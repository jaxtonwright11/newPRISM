type CommunityNameSource = {
  community?: {
    name?: string | null;
  } | null;
};

interface TopicComparisonDescriptionInput {
  topicTitle: string;
  topicSummary?: string | null;
  perspectives: CommunityNameSource[];
}

export function hasTopicComparison(perspectiveCount: number): boolean {
  return perspectiveCount >= 2;
}

export function getUniqueCommunityCount(perspectives: CommunityNameSource[]): number {
  const uniqueCommunityNames = new Set(
    perspectives.map((perspective) => perspective.community?.name ?? "")
  );

  return uniqueCommunityNames.size;
}

export function buildTopicComparisonDescription({
  topicTitle,
  topicSummary,
  perspectives,
}: TopicComparisonDescriptionInput): string {
  if (hasTopicComparison(perspectives.length)) {
    const communityNames = perspectives
      .slice(0, 3)
      .map((perspective) => perspective.community?.name ?? "")
      .join(", ");
    return `See how ${communityNames} experience "${topicTitle}" — same topic, completely different worlds.`;
  }

  if (topicSummary) {
    return topicSummary;
  }

  return `Perspectives on ${topicTitle}`;
}
