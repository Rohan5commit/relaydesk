import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/context/store";
import { intakeProcessor } from "@/lib/intake/processor";
import { CreateRequestBodySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = CreateRequestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { subject, description, customerInfo } = parsed.data;

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
    const requests = await store.getAllSupportRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
