type Relation<T> = T | T[] | null | undefined;

interface TopicRelation {
  title?: string | null;
  slug?: string | null;
}

interface CommunityRelation {
  name?: string | null;
}

interface DailyPromptNotificationInput {
  id: string;
  topic?: Relation<TopicRelation>;
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

interface DailyPromptNotification extends PushPayload {
  topicName: string;
}

export interface PerspectiveNotificationInput {
  quote: string;
  community_id: string | null;
  community?: Relation<CommunityRelation>;
  topic?: Relation<TopicRelation>;
}

export interface CommunityPerspectiveNotification {
  communityId: string;
  title: string;
  body: string;
  url: string;
  icon: string;
  count: number;
}

function unwrapRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

export function buildDailyPromptNotification(
  prompt: DailyPromptNotificationInput,
  count: number | null
): DailyPromptNotification {
  const topic = unwrapRelation(prompt.topic);
  const topicName = topic?.title ?? "today's topic";

  return {
    title: "A new perspective prompt is live",
    body: `Communities are posting about ${topicName} right now. ${count ?? 0} perspectives so far today.`,
    url: topic?.slug ? `/compare/${topic.slug}` : "/feed",
    topicName,
  };
}

export function buildCommunityPerspectiveNotifications(
  perspectives: PerspectiveNotificationInput[]
): CommunityPerspectiveNotification[] {
  const communityMap = new Map<
    string,
    {
      name: string;
      topicSlug: string | null;
      topicTitle: string | null;
      firstQuote: string;
      count: number;
    }
  >();

  for (const perspective of perspectives) {
    const communityId = perspective.community_id;
    if (!communityId) continue;

    const existing = communityMap.get(communityId);
    if (existing) {
      existing.count += 1;
      continue;
    }

    const community = unwrapRelation(perspective.community);
    const topic = unwrapRelation(perspective.topic);
    communityMap.set(communityId, {
      name: community?.name ?? "A community",
      topicSlug: topic?.slug ?? null,
      topicTitle: topic?.title ?? null,
      firstQuote: perspective.quote,
      count: 1,
    });
  }

  return Array.from(communityMap.entries()).map(([communityId, info]) => ({
    communityId,
    title: info.topicTitle
      ? `New perspective on "${info.topicTitle}"`
      : `${info.name} shared a perspective`,
    body:
      info.count > 1
        ? `${info.count} new perspectives from ${info.name}`
        : info.firstQuote.slice(0, 100),
    url: info.topicSlug ? `/compare/${info.topicSlug}` : "/feed",
    icon: "/icons/icon-192.svg",
    count: info.count,
  }));
}
