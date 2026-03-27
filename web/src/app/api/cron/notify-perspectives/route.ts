import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToCommunityFollowers } from "@/lib/send-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Find perspectives created in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: newPerspectives } = await supabase
    .from("perspectives")
    .select("id, quote, community_id, community:communities(name)")
    .eq("verified", true)
    .gte("created_at", oneHourAgo);

  if (!newPerspectives || newPerspectives.length === 0) {
    return NextResponse.json({ notified: 0, perspectives: 0 });
  }

  // Group by community to avoid duplicate notifications
  const communityMap = new Map<string, string>();
  for (const p of newPerspectives) {
    if (p.community_id && !communityMap.has(p.community_id)) {
      const community = Array.isArray(p.community) ? p.community[0] : p.community;
      communityMap.set(p.community_id, (community as { name: string })?.name ?? "A community");
    }
  }

  let totalSent = 0;
  for (const [communityId, communityName] of communityMap) {
    const count = newPerspectives.filter((p) => p.community_id === communityId).length;
    const sent = await sendPushToCommunityFollowers(communityId, {
      title: `${communityName} shared a perspective`,
      body: count > 1
        ? `${count} new perspectives from ${communityName}`
        : newPerspectives.find((p) => p.community_id === communityId)!.quote.slice(0, 100),
      url: "/feed",
      icon: "/icon-192.png",
    });
    totalSent += sent;
  }

  return NextResponse.json({
    notified: totalSent,
    perspectives: newPerspectives.length,
    communities: communityMap.size,
  });
}
