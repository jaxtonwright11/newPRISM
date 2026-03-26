import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

const bodySchema = z.object({
  community_id: z.string().uuid(),
});

// GET: List communities the current user follows
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "community-follow");
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
    .from("community_follows")
    .select("community_id, created_at")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({
    follows: data.map((f) => f.community_id),
  });
}

// POST: Follow a community
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "community-follow");
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid community_id" }, { status: 400 });
  }

  const { error } = await supabase.from("community_follows").upsert(
    { user_id: user.id, community_id: parsed.data.community_id },
    { onConflict: "user_id,community_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }

  return NextResponse.json({ message: "Followed" }, { status: 201 });
}

// DELETE: Unfollow a community
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "community-follow");
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid community_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("community_id", parsed.data.community_id);

  if (error) {
    return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
  }

  return NextResponse.json({ message: "Unfollowed" });
}
