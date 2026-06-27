import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import { aicooClient } from "../aicoo/client";
import {
  SupportRequest,
  ResolutionDraft,
  ApprovalAction,
  AuditEvent,
} from "../schemas";

interface ResolutionResult {
  draft: ResolutionDraft;
  auditEvent: AuditEvent;
}

export class ResolutionResolver {
  async draftResolution(
    requestId: string,
    agentId: string,
    agentName: string
  ): Promise<ResolutionResult> {
    const request = store.getSupportRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const context = store.getCaseContextByRequest(requestId);
    const notes = store.getCaseNotesByRequest(requestId);
    const routes = store.getRouteDecisionsByRequest(requestId);

    // Use AI to draft resolution
    const draft = await nimClient.draftResolution(
      `${request.subject}\n\n${request.description}`,
      {
        category: request.category,
        urgency: request.urgency,
        sentiment: request.sentiment,
        problemSummary: context?.problemSummary,
        priorSteps: context?.priorSteps,
        notes: notes.map((n) => ({
          agent: n.agentName,
          content: n.content,
        })),
        routingHistory: routes.map((r) => ({
          from: r.fromAgentId,
          to: r.toAgentId,
          reason: r.reason,
        })),
      }
    );

    // Create resolution draft
    const resolutionDraft = store.createResolutionDraft({
      requestId,
      agentId,
      agentName,
      customerResponse: draft.customerResponse,
      internalNote: draft.internalNote,
      followUpTask: draft.followUpTask,
      nextOwner: draft.nextOwner,
      caseSummary: draft.caseSummary,
      status: "draft",
    });

    // Create audit event
    const auditEvent = store.createAuditEvent({
      requestId,
      eventType: "resolution_drafted",
      agentId,
      agentName,
      agentType: "specialist",
      details: `Resolution drafted by ${agentName}`,
      metadata: {
        draftId: resolutionDraft.id,
      },
    });

    // Update context
    if (context) {
      store.updateCaseContext(context.id, {
        resolutionState: "in_progress",
      });
    }

    return { draft: resolutionDraft, auditEvent };
  }

  async submitForReview(draftId: string): Promise<void> {
    const draft = store.getResolutionDraft(draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    store.updateResolutionDraft(draftId, {
      status: "pending_review",
    });

    // Create audit event
    store.createAuditEvent({
      requestId: draft.requestId,
      eventType: "resolution_drafted",
      agentId: draft.agentId,
      agentName: draft.agentName,
      agentType: "specialist",
      details: `Resolution submitted for review`,
      metadata: {
        draftId,
      },
    });
  }

  async approveResolution(
    draftId: string,
    approverId: string,
    approverName: string,
    action: "approve" | "reject" | "override" | "request_more_context",
    reason?: string
  ): Promise<ApprovalAction> {
    const draft = store.getResolutionDraft(draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    // Create approval action
    const approvalAction = store.createApprovalAction({
      requestId: draft.requestId,
      resolutionId: draftId,
      approverId,
      approverName,
      action,
      reason,
    });

    // Update draft status
    if (action === "approve") {
      store.updateResolutionDraft(draftId, {
        status: "approved",
      });

      // Update request status
      store.updateSupportRequest(draft.requestId, {
        status: "resolved",
      });

      // Update context
      const context = store.getCaseContextByRequest(draft.requestId);
      if (context) {
        store.updateCaseContext(context.id, {
          resolutionState: "resolved",
          approvalState: "approved",
        });
      }

      // Create audit event
      store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolution_approved",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Resolution approved by ${approverName}`,
        metadata: {
          draftId,
          action,
        },
      });

      // Store final resolution in Aicoo
      try {
        await aicooClient.accumulateContext({
          texts: [
            {
              title: `Resolution ${draftId}: ${draft.caseSummary}`,
              content: `Customer Response:\n${draft.customerResponse}\n\nInternal Note:\n${draft.internalNote}\n\nApproved by: ${approverName}`,
              folder: "Resolved Cases",
            },
          ],
          folders: {
            create: ["Resolved Cases"],
          },
        });
      } catch (error) {
        console.error("Failed to store resolution in Aicoo:", error);
      }
    } else if (action === "reject") {
      store.updateResolutionDraft(draftId, {
        status: "rejected",
      });

      // Create audit event
      store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolution_rejected",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Resolution rejected by ${approverName}: ${reason}`,
        metadata: {
          draftId,
          action,
          reason,
        },
      });
    } else if (action === "override") {
      store.updateResolutionDraft(draftId, {
        status: "approved",
      });

      // Update request status
      store.updateSupportRequest(draft.requestId, {
        status: "resolved",
      });

      // Update context
      const context = store.getCaseContextByRequest(draft.requestId);
      if (context) {
        store.updateCaseContext(context.id, {
          resolutionState: "resolved",
          approvalState: "overridden",
        });
      }

      // Create audit event
      store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolution_approved",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Resolution overridden by ${approverName}: ${reason}`,
        metadata: {
          draftId,
          action,
          reason,
        },
      });
    } else if (action === "request_more_context") {
      // Create audit event
      store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "note_added",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `More context requested by ${approverName}: ${reason}`,
        metadata: {
          draftId,
          action,
          reason,
        },
      });
    }

    return approvalAction;
  }

  async getCaseTimeline(requestId: string): Promise<
    Array<{
      timestamp: string;
      event: string;
      agent: string;
      details: string;
    }>
  > {
    const auditEvents = store.getAuditEventsByRequest(requestId);
    
    return auditEvents.map((event) => ({
      timestamp: event.timestamp,
      event: event.eventType,
      agent: event.agentName,
      details: event.details,
    }));
  }
}

export const resolutionResolver = new ResolutionResolver();
