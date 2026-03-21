import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "health");
  if (rateLimitResponse) return rateLimitResponse;

  const checks: Record<string, string> = {};

  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing";
  checks.mapbox_token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "ok" : "missing";

  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from("communities").select("id").limit(1);
      checks.database = error ? "error" : "ok";
    } catch {
      checks.database = "error";
    }
  } else {
    checks.database = "skipped";
  }

  const allOk = Object.values(checks).every((c) => c === "ok");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
