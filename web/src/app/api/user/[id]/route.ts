import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, "user-public");
  if (rateLimited) return rateLimited;

  const { id: rawId } = await params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }
  const id = parsed.data;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  // Fetch user with profile stats, community, and recent posts
  const { data: user, error } = await supabase
    .from("users")
    .select(`
      id, username, display_name, avatar_url, verification_level, ghost_mode,
      home_community:communities(id, name, region, community_type, color_hex, verified),
      profile:user_profiles(perspectives_read, communities_engaged, connections_made)
    `)
    .eq("id", id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Don't expose ghost mode users' profiles publicly
  if (user.ghost_mode) {
    return NextResponse.json({
      data: {
        id: user.id,
        username: "Anonymous",
        display_name: "Anonymous User",
        avatar_url: null,
        verification_level: user.verification_level,
        ghost_mode: true,
        home_community: null,
        profile: null,
        recent_posts: [],
      },
    });
  }

  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, content, post_type, radius_miles, created_at, like_count, comment_count")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Count topics engaged (distinct topic_ids from posts + reactions)
  const { count: topicsEngaged } = await supabase
    .from("posts")
    .select("topic_id", { count: "exact", head: true })
    .eq("user_id", id)
    .not("topic_id", "is", null);

  return NextResponse.json({
    data: {
      ...user,
      recent_posts: recentPosts ?? [],
      topics_engaged: topicsEngaged ?? 0,
    },
  });
}
