import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { SEED_COMMUNITIES } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "communities");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("active", true);

      if (!error && data) {
        return NextResponse.json({ communities: data });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ communities: SEED_COMMUNITIES });
}
