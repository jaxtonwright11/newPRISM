import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a concise summary for a topic based on its title and optional context.
 */
export async function generateTopicSummary(
  title: string,
  context?: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are writing for PRISM, a geographic community perspective platform. Write a concise 1-2 sentence summary for a topic titled "${title}".${context ? ` Additional context: ${context}` : ""}\n\nThe summary should explain what the topic is about and why different communities might have varying perspectives on it. Be direct and informative, not promotional. No quotes around the response.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") return block.text.trim();
  return "";
}

/**
 * Suggest perspective prompts for a given topic.
 * Returns an array of prompt strings that encourage diverse community viewpoints.
 */
export async function suggestPerspectivePrompts(
  topicTitle: string,
  count: number = 3
): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are writing for PRISM, a geographic community perspective platform where people from different communities share how they experience the same events and issues.

Generate ${count} perspective prompts for the topic "${topicTitle}". Each prompt should:
- Be a question that invites a community member to share their local experience
- Encourage geographic and cultural diversity in responses
- Be open-ended but specific enough to generate meaningful perspectives
- Be 1 sentence, under 150 characters

Return ONLY the prompts, one per line, no numbering or bullets.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Generate a weekly digest summarizing platform activity.
 */
export async function generateWeeklyDigest(stats: {
  newPerspectives: number;
  activeTopics: string[];
  topCommunities: string[];
  newUsers: number;
}): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are writing a weekly digest email for PRISM, a geographic community perspective platform. Write a brief, engaging weekly digest based on these stats:

- ${stats.newPerspectives} new perspectives shared this week
- Active topics: ${stats.activeTopics.join(", ") || "None"}
- Most active communities: ${stats.topCommunities.join(", ") || "None"}
- ${stats.newUsers} new users joined

Write 2-3 short paragraphs. Tone: warm, community-focused, not corporate. Highlight the diversity of perspectives. No subject line — just the body text.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") return block.text.trim();
  return "";
}

/**
 * Generate an insight summary paragraph from platform data patterns.
 */
export async function generateInsightSummary(insights: {
  topAgreementPairs: string[];
  topDivergentTopics: string[];
  risingTopics: string[];
  geographicPatterns: string[];
}): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are an analyst for PRISM, a geographic community perspective platform. Write a brief, insightful paragraph (3-4 sentences) summarizing the most interesting pattern from this data:

- Community pairs that agree most: ${insights.topAgreementPairs.join("; ") || "insufficient data"}
- Topics with most diverse perspectives: ${insights.topDivergentTopics.join(", ") || "insufficient data"}
- Rising topics this week: ${insights.risingTopics.join(", ") || "none"}
- Geographic patterns: ${insights.geographicPatterns.join("; ") || "none detected"}

Focus on the single most surprising or interesting finding. Tone: analytical but accessible. Do not use bullet points or lists — write a flowing paragraph.`,
      },
    ],
  });

  const block2 = message.content[0];
  if (block2.type === "text") return block2.text.trim();
  return "";
}
