import { NextResponse } from "next/server";

export async function GET() {
  const nimKey = process.env.NIM_API_KEY || "";
  const aicooKey = process.env.AICOO_API_KEY || "";
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";

  // Check NIM by making a lightweight call
  let nimStatus: "ok" | "missing" | "error" = nimKey ? "ok" : "missing";
  if (nimKey) {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
        headers: { Authorization: `Bearer ${nimKey}` },
      });
      if (!res.ok) nimStatus = "error";
    } catch {
      nimStatus = "error";
    }
  }

  // Check Aicoo by hitting /init (idempotent)
  let aicooStatus: "ok" | "missing" | "error" = aicooKey ? "ok" : "missing";
  if (aicooKey) {
    try {
      const res = await fetch("https://www.aicoo.io/api/v1/context/status", {
        headers: { Authorization: `Bearer ${aicooKey}` },
      });
      if (!res.ok) aicooStatus = "error";
    } catch {
      aicooStatus = "error";
    }
  }

  // Check Redis
  let redisStatus: "ok" | "missing" | "error" =
    redisUrl && redisToken ? "ok" : "missing";
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (!res.ok) redisStatus = "error";
    } catch {
      redisStatus = "error";
    }
  }

  const allOk =
    nimStatus === "ok" && aicooStatus === "ok" && redisStatus === "ok";

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        nim: {
          status: nimStatus,
          configured: !!nimKey,
        },
        aicoo: {
          status: aicooStatus,
          configured: !!aicooKey,
        },
        redis: {
          status: redisStatus,
          configured: !!(redisUrl && redisToken),
        },
      },
    },
    { status: allOk ? 200 : 207 }
  );
}
