import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import { aicooClient } from "../aicoo/client";
import { aicooCoordination } from "../aicoo/coordination";
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

async function getCustomerFacingAgent() {
  const agents = await store.getAllAgentIdentities();
  return agents.find((a) => a.type === "customer_facing");
}

export class IntakeProcessor {
  private workspaceInitialized = false;

  private async ensureWorkspace(): Promise<void> {
    if (this.workspaceInitialized) return;

    // Initialize Aicoo workspace
    const initResult = await aicooCoordination.initializeWorkspace();
    console.log("Aicoo workspace init:", initResult);

    // Register all agent identities in Aicoo
    const agents = await store.getAllAgentIdentities();
    for (const agent of agents) {
      const regResult = await aicooCoordination.registerAgentIdentity(
        agent.id,
        agent.name,
        agent.type,
        agent.team,
        agent.capabilities
      );
      console.log(`Aicoo agent registration (${agent.name}):`, regResult);

      // Log each agent registration in the audit trail
      await store.createAuditEvent({
        requestId: "system",
        eventType: "context_shared",
        agentId: agent.id,
        agentName: agent.name,
        agentType: agent.type,
        details: `Agent registered in Aicoo: ${agent.name} (${agent.team}) — ${agent.capabilities.join(", ")}`,
        metadata: {
          aicooOperation: regResult.operation,
          aicooSuccess: regResult.success,
          aicooDetails: regResult.details,
        },
      });
    }

    this.workspaceInitialized = true;
  }

  async processRequest(
    subject: string,
    description: string,
    customerInfo: {
      id: string;
      name: string;
      email: string;
    }
  ): Promise<IntakeResult> {
    // Ensure Aicoo workspace is initialized and agents are registered
    await this.ensureWorkspace();

    const agent = await getCustomerFacingAgent();
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
    const request = await store.createSupportRequest({
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
    const context = await store.createCaseContext({
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
    const auditEvent = await store.createAuditEvent({
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

    // 5. Store context in Aicoo as a context cell
    let aicooContextResult = null;
    try {
      aicooContextResult = await aicooClient.accumulateContext({
        texts: [
          {
            title: `Request ${request.id}: ${subject}`,
            content: [
              `Customer: ${customerInfo.name} (${customerInfo.email})`,
              `Subject: ${subject}`,
              `Description: ${description}`,
              `Category: ${category}`,
              `Urgency: ${understanding.urgency}`,
              `Sentiment: ${understanding.sentiment}`,
              `Risk Score: ${understanding.riskScore}`,
              `Missing Info: ${understanding.missingInformation.join(", ")}`,
              `Likely Resolver: ${understanding.likelyResolverTeam}`,
              `Created at: ${request.createdAt}`,
            ].join("\n"),
            folder: "Support Requests",
          },
        ],
        folders: {
          create: ["Support Requests"],
        },
      });

      // Log Aicoo context storage in audit trail
      await store.createAuditEvent({
        requestId: request.id,
        eventType: "context_shared",
        agentId: SYSTEM_AGENT_ID,
        agentName: "Aicoo Coordinator",
        agentType: "customer_facing",
        details: `Case context stored in Aicoo: "${subject}" — context cell created in "Support Requests" folder`,
        metadata: {
          aicooOperation: "aicoo.context.store",
          aicooSuccess: aicooContextResult?.success || false,
          aicooDetails: {
            title: `Request ${request.id}: ${subject}`,
            folder: "Support Requests",
            created: aicooContextResult?.created || 0,
          },
        },
      });
    } catch (error) {
      console.error("Failed to store context in Aicoo:", error);
    }

    // 6. Route the request (this calls Aicoo coordination internally)
    const routingResult = await router.routeRequest(request);

    // 7. Create context_shared audit event
    await store.createAuditEvent({
      requestId: request.id,
      eventType: "context_shared",
      agentId: SYSTEM_AGENT_ID,
      agentName: "RelayDesk Router",
      agentType: "customer_facing",
      details: `Context shared with ${routingResult.decision.toAgentId}: original_request, customer_info, AI analysis — via Aicoo context cell`,
      metadata: {
        contextItems: routingResult.decision.contextShared,
        toAgentId: routingResult.decision.toAgentId,
        aicooShareLink: routingResult.auditEvent?.metadata?.aicooShareLink,
      },
    });

    // 8. Update request status to triaged
    await store.updateSupportRequest(request.id, {
      status: "triaged",
    });

    // 9. Create triage audit event
    await store.createAuditEvent({
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
    const note = await store.createCaseNote({
      requestId,
      agentId,
      agentName,
      content,
      type,
    });

    // Add note to case context
    const context = await store.getCaseContextByRequest(requestId);
    if (context) {
      await store.updateCaseContext(context.id, {
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

    // Store note as Aicoo context cell
    try {
      await aicooClient.accumulateContext({
        texts: [
          {
            title: `Note: ${agentName} on ${requestId}`,
            content: `Agent: ${agentName}\nType: ${type}\nContent: ${content}\nTimestamp: ${note.timestamp}`,
            folder: "Agent Notes",
          },
        ],
        folders: {
          create: ["Agent Notes"],
        },
      });
    } catch (error) {
      console.error("Failed to store note in Aicoo:", error);
    }

    // Create audit event
    await store.createAuditEvent({
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
    const request = await store.getSupportRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    await store.updateSupportRequest(requestId, {
      status: "escalated",
    });

    const agents = await store.getAllAgentIdentities();
    const escalationManager = agents.find(
      (agent) => agent.type === "escalation_manager" && agent.isOnline
    );

    if (escalationManager) {
      // This calls aicooCoordination.handoffContext internally
      await router.reRouteRequest(requestId, escalationManager.id, reason);
    }

    await store.createAuditEvent({
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
