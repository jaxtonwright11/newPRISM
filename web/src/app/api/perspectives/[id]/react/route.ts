import { NextResponse } from "next/server";
import {
  applyRateLimit,
  parseJsonBody,
  parseParams,
} from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const reactionBodySchema = z.object({
  reaction_type: z.enum(["this_resonates", "seeing_differently", "want_to_understand"]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-react-get");
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
    .from("reactions")
    .select("reaction_type")
    .eq("user_id", user.id)
    .eq("perspective_id", parsedParams.data.id)
    .maybeSingle();

  return NextResponse.json({ data: data ?? null });
}

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

  // Fire-and-forget: notify the perspective author about the reaction
  const { data: perspective } = await supabase
    .from("perspectives")
    .select("community:communities(name), contributor:contributors(user_id)")
    .eq("id", id)
    .single();

  if (perspective) {
    const contributor = perspective.contributor as unknown as { user_id: string } | null;
    const community = perspective.community as unknown as { name: string } | null;
    if (contributor?.user_id && contributor.user_id !== user.id) {
      createNotification({
        recipientId: contributor.user_id,
        type: "reaction",
        title: "New reaction",
        body: `Someone reacted to your perspective from ${community?.name ?? "a community"}`,
        metadata: { perspective_id: id, reaction_type },
      });
    }
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
