import { NextRequest, NextResponse } from "next/server";
import { resolutionResolver } from "@/lib/resolution/resolver";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, agentId, agentName, action, draftId, approverId, approverName, reason } = body;

    if (action === "draft") {
      if (!requestId || !agentId || !agentName) {
        return NextResponse.json(
          { error: "Missing required fields for draft" },
          { status: 400 }
        );
      }
      const result = await resolutionResolver.draftResolution(requestId, agentId, agentName);
      return NextResponse.json(result);
    }

    if (action === "approve" || action === "reject" || action === "override" || action === "request_more_context") {
      if (!draftId || !approverId || !approverName) {
        return NextResponse.json(
          { error: "Missing required fields for approval" },
          { status: 400 }
        );
      }
      const result = await resolutionResolver.approveResolution(
        draftId,
        approverId,
        approverName,
        action,
        reason
      );
      return NextResponse.json(result);
    }

    if (action === "submit") {
      if (!draftId) {
        return NextResponse.json(
          { error: "Missing draftId" },
          { status: 400 }
        );
      }
      await resolutionResolver.submitForReview(draftId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing resolution:", error);
    return NextResponse.json(
      { error: "Failed to process resolution" },
      { status: 500 }
    );
  }
}
