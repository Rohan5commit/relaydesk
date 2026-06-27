import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import {
  SupportRequest,
  AgentIdentity,
  RouteDecision,
  AuditEvent,
} from "../schemas";

const SYSTEM_AGENT_ID = "00000000-0000-0000-0000-000000000000";

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
    const agents = await store.getAllAgentIdentities();

    const targetTeam = this.categoryToTeam[request.category] || ["Support"];
    const targetAgentType =
      this.urgencyToAgentType[request.urgency] || ["specialist"];

    let candidateAgents = agents.filter(
      (agent) =>
        targetTeam.includes(agent.team) &&
        targetAgentType.includes(agent.type) &&
        agent.isOnline &&
        agent.currentCases < agent.maxCases
    );

    if (candidateAgents.length === 0) {
      candidateAgents = agents.filter(
        (agent) =>
          agent.type === "specialist" &&
          agent.isOnline &&
          agent.currentCases < agent.maxCases
      );
    }

    if (candidateAgents.length === 0) {
      candidateAgents = agents.filter(
        (agent) =>
          agent.type === "escalation_manager" &&
          agent.isOnline &&
          agent.currentCases < agent.maxCases
      );
    }

    const selectedAgent = [...candidateAgents].sort(
      (a, b) => a.currentCases - b.currentCases
    )[0];

    if (!selectedAgent) {
      throw new Error("No available agents for routing");
    }

    const routingAnalysis = await this.analyzeRouting(
      request.subject,
      request.description,
      request.category,
      request.urgency,
      selectedAgent
    );

    const decision = await store.createRouteDecision({
      requestId: request.id,
      fromAgentId: SYSTEM_AGENT_ID,
      toAgentId: selectedAgent.id,
      reason: routingAnalysis.reason,
      contextShared: routingAnalysis.contextShared,
      confidence: routingAnalysis.confidence,
      status: "accepted",
    });

    const auditEvent = await store.createAuditEvent({
      requestId: request.id,
      eventType: "routed",
      agentId: SYSTEM_AGENT_ID,
      agentName: "RelayDesk Router",
      agentType: "customer_facing",
      details: `Request routed to ${selectedAgent.name} (${selectedAgent.team})`,
      metadata: {
        confidence: routingAnalysis.confidence,
        reason: routingAnalysis.reason,
        agentId: selectedAgent.id,
      },
    });

    await store.updateSupportRequest(request.id, {
      status: "routed",
      likelyResolverTeam: selectedAgent.team,
    });

    return { decision, auditEvent };
  }

  private async analyzeRouting(
    subject: string,
    description: string,
    category: string,
    urgency: string,
    agent: AgentIdentity
  ): Promise<{
    confidence: number;
    reason: string;
    contextShared: string[];
  }> {
    try {
      const prompt = `Analyze this support request routing decision:
Request: ${subject} - ${description}
Category: ${category}
Urgency: ${urgency}
Selected Agent: ${agent.name} (${agent.team})
Agent Capabilities: ${agent.capabilities.join(", ")}

Provide:
1. Confidence score (0-1) for this routing decision
2. Brief reason for this routing
3. Any context that should be shared with the agent

Return ONLY a JSON object with fields: confidence, reason, contextShared`;

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

      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
          reason:
            parsed.reason ||
            `Routed to ${agent.name} based on ${category} category and ${urgency} urgency`,
          contextShared: parsed.contextShared || [
            "original_request",
            "customer_info",
          ],
        };
      }
    } catch {
      // AI fallback
    }

    return {
      confidence: 0.75,
      reason: `Routed to ${agent.name} (${agent.team}) based on ${category} category and ${urgency} urgency`,
      contextShared: ["original_request", "customer_info"],
    };
  }

  async reRouteRequest(
    requestId: string,
    newAgentId: string,
    reason: string
  ): Promise<RoutingResult> {
    const request = await store.getSupportRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const newAgent = await store.getAgentIdentity(newAgentId);
    if (!newAgent) {
      throw new Error("Agent not found");
    }

    const decision = await store.createRouteDecision({
      requestId,
      fromAgentId: SYSTEM_AGENT_ID,
      toAgentId: newAgentId,
      reason,
      contextShared: ["original_request", "customer_info", "prior_notes"],
      confidence: 0.9,
      status: "accepted",
    });

    const auditEvent = await store.createAuditEvent({
      requestId,
      eventType: "routed",
      agentId: SYSTEM_AGENT_ID,
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
