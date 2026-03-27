import { NextResponse } from "next/server";
import { applyRateLimit, parseParams } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const postIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "post-like-get");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, postIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ data: false });

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) return NextResponse.json({ data: false });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: false });

  const { data } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", parsedParams.data.id)
    .maybeSingle();

  return NextResponse.json({ data: !!data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "post-like");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, postIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id } = parsedParams.data;

  // Upsert like (idempotent)
  const { data, error } = await supabase
    .from("post_likes")
    .upsert(
      { user_id: user.id, post_id: id },
      { onConflict: "user_id,post_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to like post"},
      { status: 500 }
    );
  }

  // Notify the post author about the like
  try {
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (post && post.user_id !== user.id) {
      const { data: liker } = await supabase
        .from("users")
        .select("username, display_name")
        .eq("id", user.id)
        .single();

      const name = liker?.display_name || liker?.username || "Someone";
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "like",
        title: "Someone liked your post",
        body: `${name} liked your post`,
        metadata: { post_id: id, liker_id: user.id },
      });
    }
  } catch {
    // Non-critical
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "post-unlike");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, postIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id } = parsedParams.data;

  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to unlike post"},
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
