import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import { aicooClient } from "../aicoo/client";
import {
  SupportRequest,
  AgentIdentity,
  RouteDecision,
  AuditEvent,
} from "../schemas";

interface RoutingResult {
  decision: RouteDecision;
  auditEvent: AuditEvent;
}

export class Router {
  private categoryToTeam: Record<string, string[]> = {
    billing: ["Finance"],
    refund: ["Finance"],
    account_access: ["Technical Support", "Security"],
    product_bug: ["Engineering", "Technical Support"],
    onboarding: ["Customer Success", "Training"],
    general: ["Support"],
  };

  private urgencyToAgentType: Record<string, string[]> = {
    low: ["specialist"],
    medium: ["specialist"],
    high: ["specialist", "escalation_manager"],
    critical: ["escalation_manager"],
  };

  async routeRequest(request: SupportRequest): Promise<RoutingResult> {
    // Get all agent identities
    const agents = store.getAllAgentIdentities();
    
    // Find the appropriate agent based on category and urgency
    const targetTeam = this.categoryToTeam[request.category] || ["Support"];
    const targetAgentType = this.urgencyToAgentType[request.urgency] || ["specialist"];
    
    // Find matching agents
    let candidateAgents = agents.filter(
      (agent) =>
        targetTeam.includes(agent.team) &&
        targetAgentType.includes(agent.type) &&
        agent.isOnline &&
        agent.currentCases < agent.maxCases
    );

    // If no candidates, try to find any available specialist
    if (candidateAgents.length === 0) {
      candidateAgents = agents.filter(
        (agent) =>
          agent.type === "specialist" &&
          agent.isOnline &&
          agent.currentCases < agent.maxCases
      );
    }

    // If still no candidates, use escalation manager
    if (candidateAgents.length === 0) {
      candidateAgents = agents.filter(
        (agent) =>
          agent.type === "escalation_manager" &&
          agent.isOnline
      );
    }

    // Select the best agent (for now, pick the one with least cases)
    const selectedAgent = candidateAgents.sort(
      (a, b) => a.currentCases - b.currentCases
    )[0];

    if (!selectedAgent) {
      throw new Error("No available agents for routing");
    }

    // Use AI to determine routing confidence and reason
    const routingPrompt = `Analyze this support request routing decision:
Request: ${request.subject} - ${request.description}
Category: ${request.category}
Urgency: ${request.urgency}
Selected Agent: ${selectedAgent.name} (${selectedAgent.team})
Agent Capabilities: ${selectedAgent.capabilities.join(", ")}

Provide:
1. Confidence score (0-1) for this routing decision
2. Brief reason for this routing
3. Any context that should be shared with the agent`;

    const routingAnalysis = await this.analyzeRouting(routingPrompt);

    // Create the routing decision
    const decision = store.createRouteDecision({
      requestId: request.id,
      fromAgentId: "system",
      toAgentId: selectedAgent.id,
      reason: routingAnalysis.reason,
      contextShared: routingAnalysis.contextShared,
      confidence: routingAnalysis.confidence,
      status: "accepted",
    });

    // Create audit event
    const auditEvent = store.createAuditEvent({
      requestId: request.id,
      eventType: "routed",
      agentId: "system",
      agentName: "RelayDesk Router",
      agentType: "customer_facing",
      details: `Request routed to ${selectedAgent.name} (${selectedAgent.team})`,
      metadata: {
        confidence: routingAnalysis.confidence,
        reason: routingAnalysis.reason,
        agentId: selectedAgent.id,
      },
    });

    // Update request status
    store.updateSupportRequest(request.id, {
      status: "routed",
      likelyResolverTeam: selectedAgent.team,
    });

    // Update agent's current cases
    store.updateSupportRequest(request.id, {
      status: "routed",
    });

    return { decision, auditEvent };
  }

  private async analyzeRouting(prompt: string): Promise<{
    confidence: number;
    reason: string;
    contextShared: string[];
  }> {
    try {
      const response = await nimClient.chat({
        messages: [
          {
            role: "system",
            content:
              "You are a support routing analyzer. Return JSON with confidence (0-1), reason (string), and contextShared (array of strings).",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          confidence: parsed.confidence || 0.8,
          reason: parsed.reason || "AI-suggested routing based on request analysis",
          contextShared: parsed.contextShared || ["original_request", "customer_info"],
        };
      }
    } catch (error) {
      console.error("AI routing analysis failed:", error);
    }

    return {
      confidence: 0.7,
      reason: "Default routing based on category and urgency",
      contextShared: ["original_request", "customer_info"],
    };
  }

  async reRouteRequest(
    requestId: string,
    newAgentId: string,
    reason: string
  ): Promise<RoutingResult> {
    const request = store.getSupportRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const newAgent = store.getAgentIdentity(newAgentId);
    if (!newAgent) {
      throw new Error("Agent not found");
    }

    // Create the routing decision
    const decision = store.createRouteDecision({
      requestId,
      fromAgentId: "system",
      toAgentId: newAgentId,
      reason,
      contextShared: ["original_request", "customer_info", "prior_notes"],
      confidence: 0.9,
      status: "accepted",
    });

    // Create audit event
    const auditEvent = store.createAuditEvent({
      requestId,
      eventType: "routed",
      agentId: "system",
      agentName: "RelayDesk Router",
      agentType: "customer_facing",
      details: `Request re-routed to ${newAgent.name} (${newAgent.team})`,
      metadata: {
        reason,
        agentId: newAgentId,
      },
    });

    return { decision, auditEvent };
  }
}

export const router = new Router();
