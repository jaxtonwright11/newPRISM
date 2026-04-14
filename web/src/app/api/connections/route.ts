import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const connectionCreateBodySchema = z.object({
  recipient_id: z.string().uuid(),
  topic_id: z.string().uuid().optional().nullable(),
  perspective_id: z.string().uuid().optional().nullable(),
  intro_message: z.string().trim().min(1).max(500),
});

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "connections-get");
  if (rateLimitResponse) return rateLimitResponse;

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

  const { data, error } = await supabase
    .from("community_connections")
    .select(
      "*, requester:users!community_connections_requester_id_fkey(id, username, display_name, avatar_url, home_community_id, verification_level), recipient:users!community_connections_recipient_id_fkey(id, username, display_name, avatar_url, home_community_id, verification_level)"
    )
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: data?.length ?? 0 },
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "connections-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedBody = await parseJsonBody(request, connectionCreateBodySchema);
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

  const {
    recipient_id,
    topic_id = null,
    perspective_id = null,
    intro_message = null,
  } = parsedBody.data;

  if (recipient_id === user.id) {
    return NextResponse.json(
      { error: "Cannot create a connection with yourself" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("community_connections")
    .insert({
      requester_id: user.id,
      recipient_id,
      topic_id,
      perspective_id,
      intro_message,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }

  // Notify the recipient about the connection request
  try {
    const { data: requesterData } = await supabase
      .from("users")
      .select("username, display_name")
      .eq("id", user.id)
      .single();

    const requesterName = requesterData?.display_name || requesterData?.username || "Someone";
    await supabase.from("notifications").insert({
      user_id: recipient_id,
      type: "connection_request",
      title: "New connection request",
      body: `${requesterName} wants to connect with you`,
      metadata: { connection_id: data.id, requester_id: user.id },
    });
  } catch {
    // Non-critical — don't fail the connection creation
  }

  return NextResponse.json({ data }, { status: 201 });
}
