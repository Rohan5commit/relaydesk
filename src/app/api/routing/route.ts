import { NextRequest, NextResponse } from "next/server";
import { router } from "@/lib/routing/router";
import { store } from "@/lib/context/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, agentId, reason } = body;

    if (!requestId || !agentId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await router.reRouteRequest(requestId, agentId, reason);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error routing request:", error);
    return NextResponse.json(
      { error: "Failed to route request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    
    if (!requestId) {
      return NextResponse.json(
        { error: "Missing requestId parameter" },
        { status: 400 }
      );
    }

    const decisions = await store.getRouteDecisionsByRequest(requestId);
    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Error fetching routing decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch routing decisions" },
      { status: 500 }
    );
  }
}
