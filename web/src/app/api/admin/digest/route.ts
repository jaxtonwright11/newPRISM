import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { generateWeeklyDigest } from "@/lib/claude";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-ai");
  if (rateLimitResponse) return rateLimitResponse;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Gather stats from the past week
    const [perspectivesRes, topicsRes, communitiesRes, usersRes] = await Promise.all([
      supabase
        .from("perspectives")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo),
      supabase
        .from("topics")
        .select("title")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("communities")
        .select("name")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo),
    ]);

    const stats = {
      newPerspectives: perspectivesRes.count ?? 0,
      activeTopics: (topicsRes.data ?? []).map((t) => t.title),
      topCommunities: (communitiesRes.data ?? []).map((c) => c.name),
      newUsers: usersRes.count ?? 0,
    };

    const digest = await generateWeeklyDigest(stats);
    return NextResponse.json({ digest, stats });
  } catch (err) {
    console.error("Digest generation error:", err);
    return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
  }
}
