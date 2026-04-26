interface PromptTopic {
  title?: string | null;
  slug?: string | null;
}

interface DailyPrompt {
  topic?: PromptTopic | PromptTopic[] | null;
}

interface DailyPromptNotification {
  title: string;
  body: string;
  url: string;
  topicName: string;
}

export function buildDailyPromptNotification(
  prompt: DailyPrompt,
  perspectiveCount: number | null
): DailyPromptNotification {
  const topic = Array.isArray(prompt.topic) ? prompt.topic[0] : prompt.topic;
  const topicName = topic?.title ?? "today's topic";

  return {
    title: "A new perspective prompt is live",
    body: `Communities are posting about ${topicName} right now. ${perspectiveCount ?? 0} perspectives so far today.`,
    url: topic?.slug ? `/compare/${topic.slug}` : "/feed",
    topicName,
  };
}
