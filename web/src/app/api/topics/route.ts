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
        .order("updated_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ topics: data });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ topics: SEED_TOPICS });
}
