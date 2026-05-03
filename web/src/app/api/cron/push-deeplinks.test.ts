import { afterEach, describe, expect, it, vi } from "vitest";

type QueryResult = Promise<{ data?: unknown; count?: number | null }>;

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: QueryResult["then"];
  catch: QueryResult["catch"];
  finally: QueryResult["finally"];
};

function createQueryBuilder(result: { data?: unknown; count?: number | null }): QueryBuilder {
  const resolved = Promise.resolve(result);
  const builder = {} as QueryBuilder;
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.lte = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.single = vi.fn(() => resolved);
  builder.then = resolved.then.bind(resolved);
  builder.catch = resolved.catch.bind(resolved);
  builder.finally = resolved.finally.bind(resolved);

  return builder;
}

function createAuthorizedRequest() {
  return new Request("https://example.com/api/cron", {
    headers: {
      authorization: "Bearer test-cron-secret",
    },
  });
}

async function importRouteWithSupabase(
  routePath: string,
  tableResults: Record<string, { data?: unknown; count?: number | null }>
) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.CRON_SECRET = "test-cron-secret";

  const queryBuilders = new Map<string, QueryBuilder>();
  const supabase = {
    from: vi.fn((table: string) => {
      const builder = createQueryBuilder(tableResults[table] ?? { data: null });
      queryBuilders.set(table, builder);
      return builder;
    }),
  };

  vi.doMock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => supabase),
  }));

  return {
    route: await import(routePath),
    supabase,
    queryBuilders,
  };
}

describe("push notification cron deep links", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.CRON_SECRET;
  });

  it("sends daily prompt notifications to the comparison page for the active topic", async () => {
    const sendPushBroadcast = vi.fn().mockResolvedValue(7);
    vi.doMock("@/lib/send-push", () => ({ sendPushBroadcast }));

    const { route } = await importRouteWithSupabase("./daily-prompt/route", {
      perspective_prompts: {
        data: {
          id: "prompt-1",
          prompt_text: "What changed this week?",
          topic: [{ title: "Housing costs", slug: "housing-costs" }],
        },
      },
      perspectives: { count: 3 },
    });

    const response = await route.GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    expect(sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Housing costs right now. 3 perspectives so far today.",
      url: "/compare/housing-costs",
    });
    await expect(response.json()).resolves.toEqual({
      sent: 7,
      prompt_id: "prompt-1",
      topic: "Housing costs",
    });
  });

  it("falls back to the feed when a daily prompt has no topic slug", async () => {
    const sendPushBroadcast = vi.fn().mockResolvedValue(1);
    vi.doMock("@/lib/send-push", () => ({ sendPushBroadcast }));

    const { route } = await importRouteWithSupabase("./daily-prompt/route", {
      perspective_prompts: {
        data: {
          id: "prompt-2",
          prompt_text: "What are people missing?",
          topic: null,
        },
      },
      perspectives: { count: 0 },
    });

    const response = await route.GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    expect(sendPushBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Communities are posting about today's topic right now. 0 perspectives so far today.",
        url: "/feed",
      })
    );
  });

  it("links new perspective notifications to the first topic comparison per community", async () => {
    const sendPushToCommunityFollowers = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    vi.doMock("@/lib/send-push", () => ({ sendPushToCommunityFollowers }));

    const { route } = await importRouteWithSupabase("./notify-perspectives/route", {
      perspectives: {
        data: [
          {
            id: "perspective-1",
            quote: "The rent jump changed everything for us.",
            community_id: "community-1",
            topic_id: "topic-1",
            community: [{ name: "River Bend" }],
            topic: [{ title: "Housing costs", slug: "housing-costs" }],
          },
          {
            id: "perspective-2",
            quote: "A second quote from the same community.",
            community_id: "community-1",
            topic_id: "topic-1",
            community: [{ name: "River Bend" }],
            topic: [{ title: "Housing costs", slug: "housing-costs" }],
          },
          {
            id: "perspective-3",
            quote: "Transit access shapes every appointment.",
            community_id: "community-2",
            topic_id: "topic-2",
            community: { name: "Northside Parents" },
            topic: { title: "Transit access", slug: "transit-access" },
          },
        ],
      },
    });

    const response = await route.GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    expect(sendPushToCommunityFollowers).toHaveBeenNthCalledWith(1, "community-1", {
      title: 'New perspective on "Housing costs"',
      body: "2 new perspectives from River Bend",
      url: "/compare/housing-costs",
      icon: "/icons/icon-192.svg",
    });
    expect(sendPushToCommunityFollowers).toHaveBeenNthCalledWith(2, "community-2", {
      title: 'New perspective on "Transit access"',
      body: "Transit access shapes every appointment.",
      url: "/compare/transit-access",
      icon: "/icons/icon-192.svg",
    });
    await expect(response.json()).resolves.toEqual({
      notified: 3,
      perspectives: 3,
      communities: 2,
    });
  });

  it("keeps new perspective notifications on the feed when topic data is unavailable", async () => {
    const sendPushToCommunityFollowers = vi.fn().mockResolvedValue(1);
    vi.doMock("@/lib/send-push", () => ({ sendPushToCommunityFollowers }));

    const { route } = await importRouteWithSupabase("./notify-perspectives/route", {
      perspectives: {
        data: [
          {
            id: "perspective-4",
            quote: "This still needs to reach followers.",
            community_id: "community-3",
            topic_id: null,
            community: { name: "East Ward" },
            topic: null,
          },
        ],
      },
    });

    const response = await route.GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    expect(sendPushToCommunityFollowers).toHaveBeenCalledWith("community-3", {
      title: "East Ward shared a perspective",
      body: "This still needs to reach followers.",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });
});
