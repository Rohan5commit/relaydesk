import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/context/store";
import { intakeProcessor } from "@/lib/intake/processor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, description, customerInfo } = body;

    if (!subject || !description || !customerInfo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await intakeProcessor.processRequest(
      subject,
      description,
      customerInfo
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const requests = store.getAllSupportRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
