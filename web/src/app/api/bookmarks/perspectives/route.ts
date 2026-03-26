import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

// GET: List perspectives the current user has bookmarked
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "bookmarks-perspectives");
  if (rateLimited) return rateLimited;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      "id, perspective:perspectives(id, quote, context, category_tag, reaction_count, bookmark_count, created_at, community:communities(id, name, region, community_type, color_hex, verified))"
    )
    .eq("user_id", user.id)
    .not("perspective_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookmarked perspectives" },
      { status: 500 }
    );
  }

  const perspectives = (data ?? [])
    .map((b: Record<string, unknown>) => b.perspective)
    .filter(Boolean);

  return NextResponse.json({ perspectives });
}
