import { NextRequest, NextResponse } from "next/server";
import { intakeProcessor } from "@/lib/intake/processor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, agentId, agentName, content, type } = body;

    if (!requestId || !agentId || !agentName || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await intakeProcessor.addNote(requestId, agentId, agentName, content, type);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}
