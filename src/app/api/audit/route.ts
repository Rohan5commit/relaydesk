import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/context/store";

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

    const events = store.getAuditEventsByRequest(requestId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching audit events:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit events" },
      { status: 500 }
    );
  }
}
