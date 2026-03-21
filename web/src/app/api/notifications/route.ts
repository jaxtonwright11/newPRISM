import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { SEED_NOTIFICATIONS } from "@/lib/seed-data";
import { z } from "zod";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notifications");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const supabase = getSupabaseWithAuth(token);
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data) {
            return NextResponse.json({
              data,
              meta: {
                total: data.length,
                unread: data.filter((n: { read: boolean }) => !n.read).length,
              },
            });
          }
        }
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({
    data: SEED_NOTIFICATIONS,
    meta: {
      total: SEED_NOTIFICATIONS.length,
      unread: SEED_NOTIFICATIONS.filter((n) => !n.read).length,
    },
  });
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
      { error: "Failed to create notification", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
