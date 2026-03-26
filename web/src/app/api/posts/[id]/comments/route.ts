import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api";
import { getSupabase, getSupabaseWithAuth } from "@/lib/supabase";

const uuidSchema = z.string().uuid();

const commentBodySchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, "comments-get");
  if (rateLimited) return rateLimited;

  const { id: postId } = await params;
  const parsed = uuidSchema.safeParse(postId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, user:users(id, username, display_name, avatar_url)")
    .eq("post_id", parsed.data)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, "comments-post");
  if (rateLimited) return rateLimited;

  const { id: postId } = await params;
  const parsedId = uuidSchema.safeParse(postId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = commentBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: parsedId.data,
      user_id: user.id,
      content: parsedBody.data.content,
    })
    .select("id, content, created_at, user_id, user:users(id, username, display_name, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
