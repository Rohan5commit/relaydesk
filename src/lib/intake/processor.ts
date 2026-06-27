import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import { aicooClient } from "../aicoo/client";
import { router } from "../routing/router";
import {
  SupportRequest,
  CaseContext,
  AuditEvent,
} from "../schemas";

const SYSTEM_AGENT_ID = "00000000-0000-0000-0000-000000000000";

interface IntakeResult {
  request: SupportRequest;
  context: CaseContext;
  auditEvent: AuditEvent;
  routingResult: any;
}

function getCustomerFacingAgent() {
  const agents = store.getAllAgentIdentities();
  return agents.find((a) => a.type === "customer_facing");
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
    const agent = getCustomerFacingAgent();
    const agentId = agent?.id || SYSTEM_AGENT_ID;
    const agentName = agent?.name || "Customer Support Bot";

    // 1. Use AI to understand the request
    const understanding = await nimClient.understandRequest(subject, description);

    // Validate category is in enum
    const validCategories = [
      "billing",
      "refund",
      "account_access",
      "product_bug",
      "onboarding",
      "general",
    ];
    const category = validCategories.includes(understanding.category)
      ? understanding.category
      : "general";

    // 2. Create the support request
    const request = store.createSupportRequest({
      customerId: customerInfo.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      subject,
      description,
      category: category as any,
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
      agentId,
      agentName,
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
            content: `Customer: ${customerInfo.name} (${customerInfo.email})\n\n${description}\n\nCategory: ${category}\nUrgency: ${understanding.urgency}\nSentiment: ${understanding.sentiment}`,
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

    // 7. Create context_shared audit event
    store.createAuditEvent({
      requestId: request.id,
      eventType: "context_shared",
      agentId: SYSTEM_AGENT_ID,
      agentName: "RelayDesk Router",
      agentType: "customer_facing",
      details: `Context shared with ${routingResult.decision.toAgentId}: original_request, customer_info, AI analysis`,
      metadata: {
        contextItems: routingResult.decision.contextShared,
        toAgentId: routingResult.decision.toAgentId,
      },
    });

    // 8. Update request status to triaged
    store.updateSupportRequest(request.id, {
      status: "triaged",
    });

    // 9. Create triage audit event
    store.createAuditEvent({
      requestId: request.id,
      eventType: "triage_completed",
      agentId,
      agentName,
      agentType: "customer_facing",
      details: `Request triaged: ${category} (${understanding.urgency})`,
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
      details: `Note added: ${content.length > 100 ? content.substring(0, 100) + "..." : content}`,
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

    store.updateSupportRequest(requestId, {
      status: "escalated",
    });

    const agents = store.getAllAgentIdentities();
    const escalationManager = agents.find(
      (agent) => agent.type === "escalation_manager" && agent.isOnline
    );

    if (escalationManager) {
      await router.reRouteRequest(requestId, escalationManager.id, reason);
    }

    store.createAuditEvent({
      requestId,
      eventType: "escalated",
      agentId: SYSTEM_AGENT_ID,
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
