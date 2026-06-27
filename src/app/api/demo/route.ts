import { NextResponse } from "next/server";
import { store } from "@/lib/context/store";

export async function POST() {
  try {
    await store.seedDemoData();
    return NextResponse.json({ success: true, message: "Demo data seeded" });
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const requests = await store.getAllSupportRequests();
    const agents = await store.getAllAgentIdentities();
    return NextResponse.json({
      requests: requests.length,
      agents: agents.length,
    });
  } catch (error) {
    console.error("Error fetching demo data:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo data" },
      { status: 500 }
    );
  }
}
