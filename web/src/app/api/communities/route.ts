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
        .select("*")
        .eq("active", true)
        .limit(200);

      if (!error && data) {
        return NextResponse.json({ communities: data }, {
          headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
        });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ communities: SEED_COMMUNITIES }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
