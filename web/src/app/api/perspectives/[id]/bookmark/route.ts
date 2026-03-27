import { NextResponse } from "next/server";
import { applyRateLimit, parseParams } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-bookmark-get");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ data: null });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ data: null });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null });
  }

  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("perspective_id", parsedParams.data.id)
    .maybeSingle();

  return NextResponse.json({ data: data ? true : false });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-bookmark-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Check server environment variables." },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { id } = parsedParams.data;

  const { data, error } = await supabase
    .from("bookmarks")
    .upsert(
      {
        user_id: user.id,
        perspective_id: id,
      },
      { onConflict: "user_id,perspective_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save bookmark"},
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-bookmark-delete");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Check server environment variables." },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { id } = parsedParams.data;

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("perspective_id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove bookmark"},
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
