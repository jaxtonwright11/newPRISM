import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const preferencesSchema = z.object({
  push_new_perspective: z.boolean().optional(),
  push_reactions: z.boolean().optional(),
  push_messages: z.boolean().optional(),
  push_community_activity: z.boolean().optional(),
  push_weekly_digest: z.boolean().optional(),
  email_weekly_digest: z.boolean().optional(),
});

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notif-prefs-get");
  if (rateLimitResponse) return rateLimitResponse;

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

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Return defaults if no row exists yet
  return NextResponse.json({
    preferences: data ?? {
      push_new_perspective: true,
      push_reactions: true,
      push_messages: true,
      push_community_activity: true,
      push_weekly_digest: true,
      email_weekly_digest: true,
    },
  });
}

export async function PATCH(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "notif-prefs-patch");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, preferencesSchema);
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

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
