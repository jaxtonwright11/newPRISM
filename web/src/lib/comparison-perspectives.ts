import type { CommunityType } from "@shared/types";

export interface ComparisonData {
  id: string;
  quote: string;
  topic?: { title: string };
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  };
}

const communityTypes = [
  "civic",
  "diaspora",
  "rural",
  "policy",
  "academic",
  "cultural",
] as const satisfies readonly CommunityType[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCommunityType(value: unknown): value is CommunityType {
  return (
    typeof value === "string" &&
    communityTypes.includes(value as CommunityType)
  );
}

export function unwrapComparisonPerspectiveResponse(
  response: unknown
): ComparisonData | null {
  const payload = isRecord(response)
    ? response.data ?? response.perspective ?? response
    : response;

  if (!isRecord(payload) || !isRecord(payload.community)) {
    return null;
  }

  const topic = payload.topic;
  if (topic !== undefined && topic !== null) {
    if (!isRecord(topic) || typeof topic.title !== "string") {
      return null;
    }
  }

  if (
    typeof payload.id !== "string" ||
    typeof payload.quote !== "string" ||
    typeof payload.community.name !== "string" ||
    typeof payload.community.region !== "string" ||
    !isCommunityType(payload.community.community_type) ||
    typeof payload.community.color_hex !== "string"
  ) {
    return null;
  }

  return {
    id: payload.id,
    quote: payload.quote,
    topic:
      isRecord(topic) && typeof topic.title === "string"
        ? { title: topic.title }
        : undefined,
    community: {
      name: payload.community.name,
      region: payload.community.region,
      community_type: payload.community.community_type,
      color_hex: payload.community.color_hex,
    },
  };
}

export async function fetchComparisonPerspective(
  id: string
): Promise<ComparisonData | null> {
  try {
    const response = await fetch(`/api/perspectives/${encodeURIComponent(id)}`);
    if (!response.ok) {
      return null;
    }

    const json: unknown = await response.json();
    return unwrapComparisonPerspectiveResponse(json);
  } catch {
    return null;
  }
}
