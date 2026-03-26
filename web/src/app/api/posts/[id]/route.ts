import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

const uuidSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, "post-get");
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, content, post_type, radius_miles, like_count, comment_count, share_count, created_at, expires_at, user_id, user:users(username, display_name, avatar_url, ghost_mode), community:communities(id, name, region, community_type, color_hex)"
    )
    .eq("id", parsed.data)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Respect ghost mode
  const user = data.user as unknown as { ghost_mode: boolean } | null;
  if (user?.ghost_mode) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
