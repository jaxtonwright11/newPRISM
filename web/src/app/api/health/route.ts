import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  checks.env_supabase_url = {
    status: supabaseUrl && supabaseUrl.startsWith("http") ? "ok" : "missing",
    detail: supabaseUrl && supabaseUrl.startsWith("http")
      ? `Configured: ${supabaseUrl.substring(0, 40)}...`
      : "NEXT_PUBLIC_SUPABASE_URL not set or invalid",
  };

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  checks.env_mapbox_token = {
    status: mapboxToken && mapboxToken.startsWith("pk.") ? "ok" : "missing",
    detail: mapboxToken && mapboxToken.startsWith("pk.")
      ? `Token set (${mapboxToken.length} chars)`
      : "NEXT_PUBLIC_MAPBOX_TOKEN not set or invalid (must start with pk.)",
  };

  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from("communities").select("id").limit(1);
      if (error) {
        checks.supabase_connection = {
          status: "error",
          detail: error.message,
        };
      } else {
        checks.supabase_connection = {
          status: "ok",
          detail: "Connected and queried communities table",
        };
      }
    } catch (err) {
      checks.supabase_connection = {
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    checks.supabase_connection = {
      status: "skipped",
      detail: "No valid Supabase URL configured — using mock data",
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
