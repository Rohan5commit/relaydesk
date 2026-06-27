import { NextRequest, NextResponse } from "next/server";
import { nimClient } from "@/lib/ai/nvidia-nim";
import { store } from "@/lib/context/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, requestId } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }

    let caseState = {};
    if (requestId) {
      caseState = store.getCaseState(requestId);
    } else {
      // Get all cases for context
      const allRequests = store.getAllSupportRequests();
      caseState = {
        totalCases: allRequests.length,
        recentCases: allRequests.slice(-5),
      };
    }

    const explanation = await nimClient.explainRouting(question, caseState);
    return NextResponse.json(explanation);
  } catch (error) {
    console.error("Error processing question:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}
