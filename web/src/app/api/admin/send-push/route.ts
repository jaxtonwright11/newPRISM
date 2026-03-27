import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { sendPushBroadcast, sendPushToCommunityFollowers } from "@/lib/send-push";
import { z } from "zod";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

const sendPushSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  community_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-push");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, sendPushSchema);
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
  if (authError || !user || !ADMIN_IDS.includes(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body, url, community_id } = parsed.data;
  const payload = { title, body, url: url ?? "/feed", icon: "/icon-192.png" };

  let sent = 0;
  if (community_id) {
    sent = await sendPushToCommunityFollowers(community_id, payload);
  } else {
    sent = await sendPushBroadcast(payload);
  }

  return NextResponse.json({ sent });
}
