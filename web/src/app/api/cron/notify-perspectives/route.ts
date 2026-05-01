import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildCommunityPerspectiveNotifications } from "@/lib/notification-payloads";
import { sendPushToCommunityFollowers } from "@/lib/send-push";

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

  let totalSent = 0;
  const notifications = buildCommunityPerspectiveNotifications(newPerspectives);
  for (const notification of notifications) {
    const { communityId, count: _count, ...payload } = notification;
    const sent = await sendPushToCommunityFollowers(communityId, payload);
    totalSent += sent;
  }

  return NextResponse.json({
    notified: totalSent,
    perspectives: newPerspectives.length,
    communities: notifications.length,
  });
}
