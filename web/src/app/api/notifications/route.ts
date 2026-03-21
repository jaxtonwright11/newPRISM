import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

import { z } from "zod";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notifications");
  if (rateLimitResponse) return rateLimitResponse;

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    meta: {
      total: (data ?? []).length,
      unread: (data ?? []).filter((n: { read: boolean }) => !n.read).length,
    },
  });
}

const markReadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("mark_read"), id: z.string().uuid() }),
  z.object({ action: z.literal("mark_all_read") }),
]);

export async function PATCH(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notifications-patch");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, markReadSchema);
  if (!parsed.success) return parsed.response;

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

  if (parsed.data.action === "mark_read") {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to mark notification read" }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      return NextResponse.json({ error: "Failed to mark all read" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

const notificationCreateSchema = z.object({
  recipient_id: z.string().uuid(),
  type: z.enum(["reaction", "connection_request", "connection_accepted", "new_perspective", "community_milestone"]),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(500),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notifications-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, notificationCreateSchema);
  if (!parsed.success) return parsed.response;

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

  const { recipient_id, type, title, body, metadata } = parsed.data;

  // Authorization: verify caller has a relationship with the recipient
  // (accepted connection, or is notifying about a connection request)
  if (type !== "connection_request") {
    const { data: connection } = await supabase
      .from("community_connections")
      .select("id")
      .eq("status", "accepted")
      .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
      .limit(1);

    if (!connection || connection.length === 0) {
      return NextResponse.json({ error: "Not authorized to notify this user" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: recipient_id,
      type,
      title,
      body,
      read: false,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
