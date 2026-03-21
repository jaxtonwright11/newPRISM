import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { SEED_TOPICS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "topics");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        return NextResponse.json({ topics: data }, {
          headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
        });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ topics: SEED_TOPICS }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
