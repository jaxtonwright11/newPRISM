import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  getSupabaseWithAuth: vi.fn(),
}));

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  perspective_count: number;
  community_count: number;
};

type PerspectiveRow = {
  id: string;
  quote: string;
  context: string | null;
  topic_id: string;
  reaction_count: number;
  bookmark_count: number;
  created_at: string;
  community:
    | {
        id: string;
        name: string;
        region: string;
        community_type: string;
        color_hex: string;
        verified: boolean;
      }
    | {
        id: string;
        name: string;
        region: string;
        community_type: string;
        color_hex: string;
        verified: boolean;
      }[];
};

type TopicsChainMock = {
  select: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
};

type PerspectivesChainMock = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
};

function createTopicsQuery(rows: TopicRow[]): TopicsChainMock {
  const chain = {} as TopicsChainMock;
  chain.select = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn().mockResolvedValue({ data: rows });
  return chain;
}

function createPerspectivesQuery(rows: PerspectiveRow[]): PerspectivesChainMock {
  const chain = {} as PerspectivesChainMock;
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn().mockResolvedValue({ data: rows });
  return chain;
}

function comparisonRequest(path = "/api/feed/comparisons"): Request {
  return new Request(`https://example.com${path}`, {
    headers: { "x-forwarded-for": "203.0.113.80" },
  });
}

describe("comparison feed route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("deduplicates communities per topic and prioritizes comparison groups before single-perspective topics", async () => {
    const topicsQuery = createTopicsQuery([
      {
        id: "topic-active-single",
        title: "Single community topic",
        slug: "single-community-topic",
        status: "active",
        perspective_count: 1,
        community_count: 1,
      },
      {
        id: "topic-hot",
        title: "Hot comparison topic",
        slug: "hot-comparison-topic",
        status: "hot",
        perspective_count: 3,
        community_count: 2,
      },
      {
        id: "topic-trending",
        title: "Trending comparison topic",
        slug: "trending-comparison-topic",
        status: "trending",
        perspective_count: 2,
        community_count: 2,
      },
    ]);
    const perspectivesQuery = createPerspectivesQuery([
      {
        id: "p-single",
        quote: "Only one community has weighed in so far.",
        context: null,
        topic_id: "topic-active-single",
        reaction_count: 0,
        bookmark_count: 0,
        created_at: "2026-05-09T10:00:00.000Z",
        community: {
          id: "community-a",
          name: "Community A",
          region: "North",
          community_type: "civic",
          color_hex: "#3B82F6",
          verified: true,
        },
      },
      {
        id: "p-hot-a",
        quote: "First hot topic perspective.",
        context: null,
        topic_id: "topic-hot",
        reaction_count: 2,
        bookmark_count: 1,
        created_at: "2026-05-09T10:01:00.000Z",
        community: [{
          id: "community-b",
          name: "Community B",
          region: "East",
          community_type: "diaspora",
          color_hex: "#22C55E",
          verified: true,
        }],
      },
      {
        id: "p-hot-b-duplicate",
        quote: "A duplicate community perspective should not be shown twice.",
        context: null,
        topic_id: "topic-hot",
        reaction_count: 1,
        bookmark_count: 0,
        created_at: "2026-05-09T10:02:00.000Z",
        community: [{
          id: "community-b",
          name: "Community B",
          region: "East",
          community_type: "diaspora",
          color_hex: "#22C55E",
          verified: true,
        }],
      },
      {
        id: "p-hot-c",
        quote: "A second community makes this a comparison.",
        context: null,
        topic_id: "topic-hot",
        reaction_count: 5,
        bookmark_count: 2,
        created_at: "2026-05-09T10:03:00.000Z",
        community: [{
          id: "community-c",
          name: "Community C",
          region: "West",
          community_type: "rural",
          color_hex: "#F59E0B",
          verified: true,
        }],
      },
      {
        id: "p-trending-a",
        quote: "First trending topic perspective.",
        context: null,
        topic_id: "topic-trending",
        reaction_count: 3,
        bookmark_count: 1,
        created_at: "2026-05-09T10:04:00.000Z",
        community: {
          id: "community-d",
          name: "Community D",
          region: "South",
          community_type: "policy",
          color_hex: "#A855F7",
          verified: true,
        },
      },
      {
        id: "p-trending-e",
        quote: "Second trending topic perspective.",
        context: null,
        topic_id: "topic-trending",
        reaction_count: 4,
        bookmark_count: 2,
        created_at: "2026-05-09T10:05:00.000Z",
        community: {
          id: "community-e",
          name: "Community E",
          region: "Central",
          community_type: "academic",
          color_hex: "#14B8A6",
          verified: true,
        },
      },
    ]);

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "topics") return topicsQuery;
        if (table === "perspectives") return perspectivesQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);

    const { GET } = await import("./route");
    const response = await GET(comparisonRequest("/api/feed/comparisons?limit=10"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(topicsQuery.in).toHaveBeenCalledWith("status", ["active", "trending", "hot"]);
    expect(perspectivesQuery.eq).toHaveBeenCalledWith("verified", true);
    expect(body.meta).toEqual({ total: 3, has_more: false });
    expect(body.data.map((group: { topic: { id: string } }) => group.topic.id)).toEqual([
      "topic-hot",
      "topic-trending",
      "topic-active-single",
    ]);
    expect(body.data[0]).toMatchObject({
      topic: {
        id: "topic-hot",
        slug: "hot-comparison-topic",
        status: "hot",
      },
      has_comparison: true,
    });
    expect(body.data[0].perspectives.map((p: { id: string }) => p.id)).toEqual([
      "p-hot-a",
      "p-hot-c",
    ]);
    expect(body.data[2]).toMatchObject({
      topic: { id: "topic-active-single" },
      has_comparison: false,
    });
  });
});
