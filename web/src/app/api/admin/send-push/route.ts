import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { sendPushBroadcast, sendPushToCommunityFollowers } from "@/lib/send-push";
import { z } from "zod";

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

  const admin = await getAdminUser(request);
  if (!admin) {
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
