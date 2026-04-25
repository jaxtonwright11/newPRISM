import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToCommunityFollowers } from "@/lib/send-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

type NullableRelation<T> = T | T[] | null | undefined;

function firstRelation<T>(relation: NullableRelation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

type PerspectiveNotificationSource = {
  quote: string;
  community_id: string | null;
  community?: NullableRelation<{ name?: string | null }>;
  topic?: NullableRelation<{ title?: string | null; slug?: string | null }>;
};

type CommunityNotification = {
  communityId: string;
  payload: {
    title: string;
    body: string;
    url: string;
    icon: string;
  };
};

export function buildPerspectiveNotifications(
  perspectives: PerspectiveNotificationSource[]
): CommunityNotification[] {
  const communityMap = new Map<
    string,
    {
      name: string;
      topicSlug: string | null;
      topicTitle: string | null;
    }
  >();

  for (const perspective of perspectives) {
    if (perspective.community_id && !communityMap.has(perspective.community_id)) {
      const community = firstRelation(perspective.community);
      const topic = firstRelation(perspective.topic);

      communityMap.set(perspective.community_id, {
        name: community?.name ?? "A community",
        topicSlug: topic?.slug ?? null,
        topicTitle: topic?.title ?? null,
      });
    }
  }

  return Array.from(communityMap, ([communityId, info]) => {
    const count = perspectives.filter((p) => p.community_id === communityId).length;
    const firstPerspective = perspectives.find((p) => p.community_id === communityId);

    return {
      communityId,
      payload: {
        title: info.topicTitle
          ? `New perspective on "${info.topicTitle}"`
          : `${info.name} shared a perspective`,
        body: count > 1
          ? `${count} new perspectives from ${info.name}`
          : (firstPerspective?.quote ?? "").slice(0, 100),
        url: info.topicSlug ? `/compare/${info.topicSlug}` : "/feed",
        icon: "/icons/icon-192.svg",
      },
    };
  });
}

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

  const notifications = buildPerspectiveNotifications(newPerspectives);

  let totalSent = 0;
  for (const notification of notifications) {
    const sent = await sendPushToCommunityFollowers(notification.communityId, notification.payload);
    totalSent += sent;
  }

  return NextResponse.json({
    notified: totalSent,
    perspectives: newPerspectives.length,
    communities: notifications.length,
  });
}
