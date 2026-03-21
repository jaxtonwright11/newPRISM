import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const messageCreateSchema = z.object({
  connection_id: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "messages:get");
  if (rateLimited) return rateLimited;

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ messages: [], message: "Supabase not configured" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connection_id");

  if (!connectionId) {
    return NextResponse.json(
      { error: "connection_id is required" },
      { status: 400 }
    );
  }

  try {
    // Verify the user is a participant in this connection
    const { data: connection } = await supabase
      .from("community_connections")
      .select("id, requester_id, recipient_id, status")
      .eq("id", connectionId)
      .single();

    if (
      !connection ||
      (connection.requester_id !== user.id && connection.recipient_id !== user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Connection is not accepted yet" },
        { status: 403 }
      );
    }

    const { data: messages, error } = await supabase
      .from("direct_messages")
      .select(`*, sender:users!sender_id(id, username, display_name)`)
      .eq("connection_id", connectionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: messages ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch messages", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "messages:post");
  if (rateLimited) return rateLimited;

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = await parseJsonBody(request, messageCreateSchema);
    if (!parsed.success) return parsed.response;

    const { connection_id, content } = parsed.data;

    // Verify the user is a participant in an accepted connection
    const { data: connection } = await supabase
      .from("community_connections")
      .select("id, requester_id, recipient_id, status")
      .eq("id", connection_id)
      .single();

    if (
      !connection ||
      (connection.requester_id !== user.id && connection.recipient_id !== user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Can only message accepted connections" },
        { status: 403 }
      );
    }

    const { data: message, error } = await supabase
      .from("direct_messages")
      .insert({
        connection_id,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send message", detail: String(err) },
      { status: 500 }
    );
  }
}
