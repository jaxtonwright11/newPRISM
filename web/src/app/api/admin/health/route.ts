import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request, "admin-health");
  if (rl) return rl;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsersRes,
      totalCommunitiesRes,
      totalPerspectivesRes,
      todayPerspectivesRes,
      weekPerspectivesRes,
      topCommunitiesRes,
      emptyTopicsRes,
      unfollowedUsersRes,
    ] = await Promise.all([
      supabase.from("user_profiles").select("id", { count: "exact", head: true }),
      supabase.from("communities").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("perspectives").select("id", { count: "exact", head: true }),
      supabase.from("perspectives").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("perspectives").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
      supabase.from("perspectives").select("community_id, community:communities(name)").limit(500),
      supabase.from("topics").select("id, title, perspective_count").eq("perspective_count", 0).neq("status", "archived").limit(20),
      // Placeholder for unfollowed users — computed below
      Promise.resolve({ data: null }),
    ]);

    // Count perspectives per community
    const communityPerspCounts: Record<string, { name: string; count: number }> = {};
    for (const p of topCommunitiesRes.data ?? []) {
      const comm = p.community as unknown as { name: string } | null;
      if (!comm?.name) continue;
      if (!communityPerspCounts[comm.name]) communityPerspCounts[comm.name] = { name: comm.name, count: 0 };
      communityPerspCounts[comm.name].count++;
    }
    const activeCommunities = Object.values(communityPerspCounts).sort((a, b) => b.count - a.count).slice(0, 10);

    const weekCount = weekPerspectivesRes.count ?? 0;

    return NextResponse.json({
      totalUsers: totalUsersRes.count ?? 0,
      totalCommunities: totalCommunitiesRes.count ?? 0,
      totalPerspectives: totalPerspectivesRes.count ?? 0,
      perspectivesToday: todayPerspectivesRes.count ?? 0,
      perspectives7dAvg: Math.round(weekCount / 7),
      activeCommunities,
      emptyTopics: (emptyTopicsRes.data ?? []).map((t) => ({ id: t.id, title: t.title })),
      unfollowedUsers: typeof unfollowedUsersRes.data === "number" ? unfollowedUsersRes.data : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed", details: String(err) }, { status: 500 });
  }
}
