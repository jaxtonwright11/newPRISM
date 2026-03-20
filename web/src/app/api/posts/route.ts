import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic_id");
  const communityId = searchParams.get("community_id");
  const postType = searchParams.get("post_type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    // Return seed posts when Supabase is not configured
    return NextResponse.json({
      posts: [],
      total: 0,
      message: "Seed data mode — Supabase not configured",
    });
  }

  try {
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        user:users(id, username, display_name, home_community_id, verification_level),
        community:communities(id, name, region, community_type, color_hex)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (topicId) query = query.eq("topic_id", topicId);
    if (communityId) query = query.eq("community_id", communityId);
    if (postType) query = query.eq("post_type", postType);

    // Only return non-expired stories
    if (postType === "story") {
      query = query.gt("expires_at", new Date().toISOString());
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch posts", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json() as {
      content?: string;
      post_type?: string;
      radius_miles?: number;
      topic_id?: string;
      community_id?: string;
    };

    const { content, post_type, radius_miles, topic_id, community_id } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const maxLen = post_type === "story" ? 280 : 1000;
    if (content.length > maxLen) {
      return NextResponse.json(
        { error: `Content exceeds maximum length of ${maxLen} characters` },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expiresAt =
      post_type === "story"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        post_type: post_type ?? "permanent",
        radius_miles: radius_miles ?? 40,
        topic_id: topic_id ?? null,
        community_id: community_id ?? null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create post", detail: String(err) },
      { status: 500 }
    );
  }
}
