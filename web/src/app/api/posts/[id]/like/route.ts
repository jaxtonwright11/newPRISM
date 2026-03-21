import { NextResponse } from "next/server";
import { applyRateLimit, parseParams, slugSchema } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const postIdParamsSchema = z.object({
  id: slugSchema,
});

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
