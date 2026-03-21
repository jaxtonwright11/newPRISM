import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { SEED_COMMUNITIES } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "communities");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("communities")
        .select("id, name, region, latitude, longitude, color_hex, community_type, verified, active")
        .eq("active", true)
        .limit(200);

      if (!error && data) {
        const res = NextResponse.json({ communities: data });
        res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return res;
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  const res = NextResponse.json({ communities: SEED_COMMUNITIES });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res;
}
