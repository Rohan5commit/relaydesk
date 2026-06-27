import { store } from "../context/store";
import { nimClient } from "../ai/nvidia-nim";
import { aicooCoordination } from "../aicoo/coordination";
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
    const request = await store.getSupportRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const context = await store.getCaseContextByRequest(requestId);
    const notes = await store.getCaseNotesByRequest(requestId);
    const routes = await store.getRouteDecisionsByRequest(requestId);

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

    const resolutionDraft = await store.createResolutionDraft({
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

    // Store resolution draft as Aicoo context cell
    try {
      const aicooResult = await aicooCoordination.storeResolution(
        requestId,
        resolutionDraft.id,
        agentName,
        draft.customerResponse,
        draft.internalNote,
        draft.caseSummary
      );

      // Log Aicoo resolution storage in audit trail
      await store.createAuditEvent({
        requestId,
        eventType: "resolution_drafted",
        agentId,
        agentName,
        agentType: "specialist",
        details: `Resolution drafted by ${agentName} — stored as Aicoo context cell`,
        metadata: {
          draftId: resolutionDraft.id,
          aicooOperation: aicooResult.operation,
          aicooSuccess: aicooResult.success,
        },
      });
    } catch (error) {
      console.error("Failed to store resolution in Aicoo:", error);

      await store.createAuditEvent({
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
    }

    if (context) {
      await store.updateCaseContext(context.id, {
        resolutionState: "in_progress",
      });
    }

    return {
      draft: resolutionDraft,
      auditEvent: await store.getAuditEventsByRequest(requestId).then(
        (events) => events[events.length - 1]
      ),
    };
  }

  async submitForReview(draftId: string): Promise<void> {
    const draft = await store.getResolutionDraft(draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    await store.updateResolutionDraft(draftId, {
      status: "pending_review",
    });

    await store.createAuditEvent({
      requestId: draft.requestId,
      eventType: "resolution_drafted",
      agentId: draft.agentId,
      agentName: draft.agentName,
      agentType: "specialist",
      details: `Resolution submitted for review by ${draft.agentName}`,
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
    const draft = await store.getResolutionDraft(draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    const approvalAction = await store.createApprovalAction({
      requestId: draft.requestId,
      resolutionId: draftId,
      approverId,
      approverName,
      action,
      reason,
    });

    if (action === "approve") {
      await store.updateResolutionDraft(draftId, { status: "approved" });
      await store.updateSupportRequest(draft.requestId, { status: "resolved" });

      const context = await store.getCaseContextByRequest(draft.requestId);
      if (context) {
        await store.updateCaseContext(context.id, {
          resolutionState: "resolved",
          approvalState: "approved",
        });
      }

      // Store approved resolution in Aicoo as final context cell
      try {
        const aicooResult = await aicooCoordination.storeResolution(
          draft.requestId,
          draftId,
          approverName,
          draft.customerResponse,
          draft.internalNote,
          `APPROVED: ${draft.caseSummary}`
        );

        // Log Aicoo resolution approval in audit trail
        await store.createAuditEvent({
          requestId: draft.requestId,
          eventType: "resolution_approved",
          agentId: approverId,
          agentName: approverName,
          agentType: "human",
          details: `Resolution approved by ${approverName} — final context cell stored in Aicoo`,
          metadata: {
            draftId,
            action,
            aicooOperation: aicooResult.operation,
            aicooSuccess: aicooResult.success,
          },
        });
      } catch (error) {
        console.error("Failed to store approved resolution in Aicoo:", error);

        await store.createAuditEvent({
          requestId: draft.requestId,
          eventType: "resolution_approved",
          agentId: approverId,
          agentName: approverName,
          agentType: "human",
          details: `Resolution approved by ${approverName}`,
          metadata: { draftId, action },
        });
      }

      // Create the resolved audit event
      await store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolved",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Case resolved. Final response approved by ${approverName}.`,
        metadata: {
          draftId,
          caseSummary: draft.caseSummary,
        },
      });
    } else if (action === "reject") {
      await store.updateResolutionDraft(draftId, { status: "rejected" });

      await store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolution_rejected",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Resolution rejected by ${approverName}${reason ? `: ${reason}` : ""}`,
        metadata: { draftId, action, reason },
      });
    } else if (action === "override") {
      await store.updateResolutionDraft(draftId, { status: "approved" });
      await store.updateSupportRequest(draft.requestId, { status: "resolved" });

      const context = await store.getCaseContextByRequest(draft.requestId);
      if (context) {
        await store.updateCaseContext(context.id, {
          resolutionState: "resolved",
          approvalState: "overridden",
        });
      }

      await store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolution_approved",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Resolution overridden by ${approverName}${reason ? `: ${reason}` : ""}`,
        metadata: { draftId, action, reason },
      });

      // Create the resolved audit event
      await store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolved",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Case resolved via override by ${approverName}.`,
        metadata: {
          draftId,
          caseSummary: draft.caseSummary,
        },
      });
    } else if (action === "request_more_context") {
      await store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "note_added",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `More context requested by ${approverName}${reason ? `: ${reason}` : ""}`,
        metadata: { draftId, action, reason },
      });
    }

    return approvalAction;
  }

  async getCaseTimeline(
    requestId: string
  ): Promise<
    Array<{
      timestamp: string;
      event: string;
      agent: string;
      details: string;
    }>
  > {
    const auditEvents = await store.getAuditEventsByRequest(requestId);

    return auditEvents.map((event) => ({
      timestamp: event.timestamp,
      event: event.eventType,
      agent: event.agentName,
      details: event.details,
    }));
  }
}

export const resolutionResolver = new ResolutionResolver();
