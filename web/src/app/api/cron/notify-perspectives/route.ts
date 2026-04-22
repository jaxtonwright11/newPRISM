import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToCommunityFollowers } from "@/lib/send-push";
import { buildCommunityNotificationPayloads } from "./notification-payload";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Find perspectives created in the last hour, including their topic
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: newPerspectives } = await supabase
    .from("perspectives")
    .select("id, quote, community_id, topic_id, community:communities(name), topic:topics(title, slug)")
    .eq("verified", true)
    .gte("created_at", oneHourAgo);

  if (!newPerspectives || newPerspectives.length === 0) {
    return NextResponse.json({ notified: 0, perspectives: 0 });
  }

  const payloads = buildCommunityNotificationPayloads(newPerspectives);

  let totalSent = 0;
  for (const payload of payloads) {
    const sent = await sendPushToCommunityFollowers(payload.communityId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: "/icons/icon-192.svg",
    });
    totalSent += sent;
  }

  return NextResponse.json({
    notified: totalSent,
    perspectives: newPerspectives.length,
    communities: payloads.length,
  });
}
