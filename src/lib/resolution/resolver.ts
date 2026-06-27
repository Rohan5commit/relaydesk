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

    const auditEvent = await store.createAuditEvent({
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

    if (context) {
      await store.updateCaseContext(context.id, {
        resolutionState: "in_progress",
      });
    }

    return { draft: resolutionDraft, auditEvent };
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

      await store.createAuditEvent({
        requestId: draft.requestId,
        eventType: "resolution_approved",
        agentId: approverId,
        agentName: approverName,
        agentType: "human",
        details: `Resolution approved by ${approverName}`,
        metadata: { draftId, action },
      });

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
