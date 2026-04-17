interface RelationshipCommunity {
  name: string;
}

interface RelationshipTopic {
  slug: string | null;
  title: string | null;
}

interface PerspectiveNotificationRow {
  community_id: string | null;
  quote: string;
  community: RelationshipCommunity | RelationshipCommunity[] | null;
  topic: RelationshipTopic | RelationshipTopic[] | null;
}

interface CommunityNotificationInfo {
  name: string;
  topicSlug: string | null;
  topicTitle: string | null;
}

export interface CommunityNotificationPayload {
  communityId: string;
  title: string;
  body: string;
  url: string;
}

export function buildCommunityNotificationPayloads(
  perspectives: PerspectiveNotificationRow[]
): CommunityNotificationPayload[] {
  const communityMap = new Map<string, CommunityNotificationInfo>();

  for (const perspective of perspectives) {
    if (perspective.community_id && !communityMap.has(perspective.community_id)) {
      const community = Array.isArray(perspective.community)
        ? perspective.community[0]
        : perspective.community;
      const topic = Array.isArray(perspective.topic) ? perspective.topic[0] : perspective.topic;

      communityMap.set(perspective.community_id, {
        name: community?.name ?? "A community",
        topicSlug: topic?.slug ?? null,
        topicTitle: topic?.title ?? null,
      });
    }
  }

  const notifications: CommunityNotificationPayload[] = [];

  for (const [communityId, info] of communityMap) {
    const count = perspectives.filter((perspective) => perspective.community_id === communityId).length;
    const url = info.topicSlug ? `/compare/${info.topicSlug}` : "/feed";
    const title = info.topicTitle
      ? `New perspective on "${info.topicTitle}"`
      : `${info.name} shared a perspective`;
    const body = count > 1
      ? `${count} new perspectives from ${info.name}`
      : perspectives.find((perspective) => perspective.community_id === communityId)!.quote.slice(0, 100);

    notifications.push({
      communityId,
      title,
      body,
      url,
    });
  }

  return notifications;
}
