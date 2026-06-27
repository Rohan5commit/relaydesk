import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import { aicooClient } from "../aicoo/client";
import { router } from "../routing/router";
import {
  SupportRequest,
  CaseContext,
  AuditEvent,
} from "../schemas";

interface IntakeResult {
  request: SupportRequest;
  context: CaseContext;
  auditEvent: AuditEvent;
  routingResult: any;
}

export class IntakeProcessor {
  async processRequest(
    subject: string,
    description: string,
    customerInfo: {
      id: string;
      name: string;
      email: string;
    }
  ): Promise<IntakeResult> {
    // 1. Use AI to understand the request
    const understanding = await nimClient.understandRequest(subject, description);

    // 2. Create the support request
    const request = store.createSupportRequest({
      customerId: customerInfo.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      subject,
      description,
      category: understanding.category as any,
      urgency: understanding.urgency,
      sentiment: understanding.sentiment,
      missingInformation: understanding.missingInformation,
      likelyResolverTeam: understanding.likelyResolverTeam,
      riskScore: understanding.riskScore,
      status: "received",
    });

    // 3. Create case context
    const context = store.createCaseContext({
      requestId: request.id,
      originalRequest: `${subject}\n\n${description}`,
      problemSummary: understanding.problemSummary,
      customerMetadata: {
        id: customerInfo.id,
        name: customerInfo.name,
        email: customerInfo.email,
      },
      priorSteps: [],
      notes: [],
      resolutionState: "pending",
      approvalState: "pending",
    });

    // 4. Create initial audit event
    const auditEvent = store.createAuditEvent({
      requestId: request.id,
      eventType: "request_received",
      agentId: "customer_facing_agent",
      agentName: "Customer Support Bot",
      agentType: "customer_facing",
      details: `Request received: ${subject}`,
      metadata: {
        category: understanding.category,
        urgency: understanding.urgency,
        sentiment: understanding.sentiment,
      },
    });

    // 5. Store context in Aicoo
    try {
      await aicooClient.accumulateContext({
        texts: [
          {
            title: `Request ${request.id}: ${subject}`,
            content: `Customer: ${customerInfo.name} (${customerInfo.email})\n\n${description}\n\nCategory: ${understanding.category}\nUrgency: ${understanding.urgency}\nSentiment: ${understanding.sentiment}`,
            folder: "Support Requests",
          },
        ],
        folders: {
          create: ["Support Requests"],
        },
      });
    } catch (error) {
      console.error("Failed to store context in Aicoo:", error);
    }

    // 6. Route the request
    const routingResult = await router.routeRequest(request);

    // 7. Update request status to triaged
    store.updateSupportRequest(request.id, {
      status: "triaged",
    });

    // 8. Create triage audit event
    store.createAuditEvent({
      requestId: request.id,
      eventType: "triage_completed",
      agentId: "customer_facing_agent",
      agentName: "Customer Support Bot",
      agentType: "customer_facing",
      details: `Request triaged: ${understanding.category} (${understanding.urgency})`,
      metadata: {
        understanding,
      },
    });

    return {
      request,
      context,
      auditEvent,
      routingResult,
    };
  }

  async addNote(
    requestId: string,
    agentId: string,
    agentName: string,
    content: string,
    type: "internal" | "customer_facing" | "escalation" = "internal"
  ): Promise<void> {
    const note = store.createCaseNote({
      requestId,
      agentId,
      agentName,
      content,
      type,
    });

    // Add note to case context
    const context = store.getCaseContextByRequest(requestId);
    if (context) {
      store.updateCaseContext(context.id, {
        notes: [
          ...context.notes,
          {
            id: note.id,
            agentId,
            content,
            timestamp: note.timestamp,
          },
        ],
      });
    }

    // Create audit event
    store.createAuditEvent({
      requestId,
      eventType: "note_added",
      agentId,
      agentName,
      agentType: "specialist",
      details: `Note added: ${content.substring(0, 100)}...`,
    });
  }

  async escalateRequest(
    requestId: string,
    reason: string
  ): Promise<void> {
    const request = store.getSupportRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Update request status
    store.updateSupportRequest(requestId, {
      status: "escalated",
    });

    // Find escalation manager
    const agents = store.getAllAgentIdentities();
    const escalationManager = agents.find(
      (agent) => agent.type === "escalation_manager" && agent.isOnline
    );

    if (escalationManager) {
      // Route to escalation manager
      await router.reRouteRequest(requestId, escalationManager.id, reason);
    }

    // Create audit event
    store.createAuditEvent({
      requestId,
      eventType: "escalated",
      agentId: "system",
      agentName: "RelayDesk System",
      agentType: "customer_facing",
      details: `Request escalated: ${reason}`,
      metadata: {
        reason,
      },
    });
  }
}

export const intakeProcessor = new IntakeProcessor();
