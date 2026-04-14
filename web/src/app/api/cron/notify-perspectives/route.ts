import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

  // Group by community to avoid duplicate notifications
  const communityMap = new Map<string, { name: string; topicSlug: string | null; topicTitle: string | null }>();
  for (const p of newPerspectives) {
    if (p.community_id && !communityMap.has(p.community_id)) {
      const community = Array.isArray(p.community) ? p.community[0] : p.community;
      const topic = Array.isArray(p.topic) ? p.topic[0] : p.topic;
      communityMap.set(p.community_id, {
        name: (community as { name: string })?.name ?? "A community",
        topicSlug: (topic as { slug: string })?.slug ?? null,
        topicTitle: (topic as { title: string })?.title ?? null,
      });
    }
  }

  let totalSent = 0;
  for (const [communityId, info] of communityMap) {
    const count = newPerspectives.filter((p) => p.community_id === communityId).length;
    // Deep-link to comparison view if topic exists, otherwise feed
    const url = info.topicSlug ? `/compare/${info.topicSlug}` : "/feed";
    const title = info.topicTitle
      ? `New perspective on "${info.topicTitle}"`
      : `${info.name} shared a perspective`;
    const body = count > 1
      ? `${count} new perspectives from ${info.name}`
      : newPerspectives.find((p) => p.community_id === communityId)!.quote.slice(0, 100);

    const sent = await sendPushToCommunityFollowers(communityId, {
      title,
      body,
      url,
      icon: "/icons/icon-192.svg",
    });
    totalSent += sent;
  }

  return NextResponse.json({
    notified: totalSent,
    perspectives: newPerspectives.length,
    communities: communityMap.size,
  });
}
