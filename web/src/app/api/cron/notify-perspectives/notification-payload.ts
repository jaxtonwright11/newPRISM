export interface NotificationPerspectiveRow {
  quote: string;
  community_id: string | null;
  community?: { name: string } | Array<{ name: string }> | null;
  topic?: { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
}

export interface CommunityNotificationPayload {
  communityId: string;
  title: string;
  body: string;
  url: string;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export function buildCommunityNotificationPayloads(
  perspectives: NotificationPerspectiveRow[]
): CommunityNotificationPayload[] {
  const grouped = new Map<string, NotificationPerspectiveRow[]>();

  for (const perspective of perspectives) {
    if (!perspective.community_id) {
      continue;
    }

    const entries = grouped.get(perspective.community_id);
    if (entries) {
      entries.push(perspective);
    } else {
      grouped.set(perspective.community_id, [perspective]);
    }
  }

  const payloads: CommunityNotificationPayload[] = [];

  for (const [communityId, entries] of grouped) {
    const firstEntry = entries[0];
    const community = unwrapRelation(firstEntry.community);
    const topic = unwrapRelation(firstEntry.topic);

    const communityName = community?.name ?? "A community";
    const topicTitle = topic?.title ?? null;
    const topicSlug = topic?.slug ?? null;
    const count = entries.length;

    payloads.push({
      communityId,
      title: topicTitle ? `New perspective on "${topicTitle}"` : `${communityName} shared a perspective`,
      body: count > 1 ? `${count} new perspectives from ${communityName}` : firstEntry.quote.slice(0, 100),
      url: topicSlug ? `/compare/${topicSlug}` : "/feed",
    });
  }

  return payloads;
}
