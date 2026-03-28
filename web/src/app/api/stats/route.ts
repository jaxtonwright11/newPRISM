import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { applyRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request, "stats");
  if (rl) return rl;
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({
      communities_active: 0,
      perspectives_this_week: 0,
      topics_active: 0,
    });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [communitiesRes, perspectivesRes, topicsRes] = await Promise.all([
    supabase
      .from("communities")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("perspectives")
      .select("id", { count: "exact", head: true })
      .eq("verified", true)
      .gte("created_at", oneWeekAgo),
    supabase
      .from("topics")
      .select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    communities_active: communitiesRes.count ?? 0,
    perspectives_this_week: perspectivesRes.count ?? 0,
    topics_active: topicsRes.count ?? 0,
  });
}
