import { NextResponse } from "next/server";
import {
  applyRateLimit,
  parseJsonBody,
  parseParams,
  slugSchema,
} from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: slugSchema,
});

const reactionBodySchema = z.object({
  reaction_type: z.enum(["i_see_this", "i_didnt_know_this", "i_agree"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-react-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const parsedBody = await parseJsonBody(request, reactionBodySchema);
  if (!parsedBody.success) return parsedBody.response;

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
  const { reaction_type } = parsedBody.data;

  const { data, error } = await supabase
    .from("reactions")
    .upsert(
      {
        user_id: user.id,
        perspective_id: id,
        reaction_type,
      },
      { onConflict: "user_id,perspective_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save reaction"},
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-react-delete");
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
    .from("reactions")
    .delete()
    .eq("user_id", user.id)
    .eq("perspective_id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove reaction"},
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
