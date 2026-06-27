import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/context/store";

export async function GET() {
  try {
    const agents = store.getAllAgentIdentities();
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
