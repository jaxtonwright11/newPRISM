import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  sendPushBroadcast: vi.fn(),
  sendPushToCommunityFollowers: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushBroadcast: mocks.sendPushBroadcast,
  sendPushToCommunityFollowers: mocks.sendPushToCommunityFollowers,
}));

interface NotifyPerspective {
  id: string;
  quote: string;
  community_id: string;
  topic_id: string | null;
  community: { name: string } | Array<{ name: string }> | null;
  topic: { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
}

interface QueryChain {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

function createQueryChain(): QueryChain {
  const chain = {} as QueryChain;
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn();
  return chain;
}

function setCronEnv() {
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
}

function createAuthorizedRequest(path: string) {
  return new Request(`https://prism.example${path}`, {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("notify-perspectives cron route", () => {
  it("rejects requests without the configured cron secret", async () => {
    setCronEnv();
    const { GET } = await import("./notify-perspectives/route");

    const response = await GET(new Request("https://prism.example/api/cron/notify-perspectives"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("deep-links verified recent perspective notifications to comparison pages", async () => {
    setCronEnv();
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-05-11T10:00:00.000Z"));
    mocks.sendPushToCommunityFollowers
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    const perspectiveQuery = createQueryChain();
    const perspectives: NotifyPerspective[] = [
      {
        id: "perspective-1",
        quote: "A first community quote that should become the notification body.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Coastal Students" }],
        topic: [{ title: "Housing costs", slug: "housing-costs" }],
      },
      {
        id: "perspective-2",
        quote: "A second quote from the same community should not create another push.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Coastal Students" }],
        topic: [{ title: "Housing costs", slug: "housing-costs" }],
      },
      {
        id: "perspective-3",
        quote: "A rural community quote should use object-shaped Supabase relations.",
        community_id: "community-2",
        topic_id: "topic-1",
        community: { name: "Rural Neighbors" },
        topic: { title: "Housing costs", slug: "housing-costs" },
      },
    ];
    perspectiveQuery.gte.mockResolvedValue({ data: perspectives });

    const from = vi.fn((table: string) => {
      if (table !== "perspectives") {
        throw new Error(`Unexpected table: ${table}`);
      }
      return perspectiveQuery;
    });
    mocks.createClient.mockReturnValue({ from });

    const { GET } = await import("./notify-perspectives/route");
    const response = await GET(createAuthorizedRequest("/api/cron/notify-perspectives"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 5,
      perspectives: 3,
      communities: 2,
    });
    expect(perspectiveQuery.select).toHaveBeenCalledWith(
      "id, quote, community_id, topic_id, community:communities(name), topic:topics(title, slug)"
    );
    expect(perspectiveQuery.eq).toHaveBeenCalledWith("verified", true);
    expect(perspectiveQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-05-11T09:00:00.000Z"
    );
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      1,
      "community-1",
      {
        title: 'New perspective on "Housing costs"',
        body: "2 new perspectives from Coastal Students",
        url: "/compare/housing-costs",
        icon: "/icons/icon-192.svg",
      }
    );
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      2,
      "community-2",
      {
        title: 'New perspective on "Housing costs"',
        body: "A rural community quote should use object-shaped Supabase relations.",
        url: "/compare/housing-costs",
        icon: "/icons/icon-192.svg",
      }
    );
  });

  it("falls back to the feed when a new perspective has no topic slug", async () => {
    setCronEnv();
    mocks.sendPushToCommunityFollowers.mockResolvedValue(1);

    const perspectiveQuery = createQueryChain();
    perspectiveQuery.gte.mockResolvedValue({
      data: [
        {
          id: "perspective-without-topic",
          quote: "This quote has no topic relation.",
          community_id: "community-without-topic",
          topic_id: null,
          community: null,
          topic: null,
        } satisfies NotifyPerspective,
      ],
    });
    mocks.createClient.mockReturnValue({
      from: vi.fn(() => perspectiveQuery),
    });

    const { GET } = await import("./notify-perspectives/route");
    const response = await GET(createAuthorizedRequest("/api/cron/notify-perspectives"));

    expect(response.status).toBe(200);
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenCalledWith(
      "community-without-topic",
      expect.objectContaining({
        title: "A community shared a perspective",
        url: "/feed",
      })
    );
  });
});

describe("daily-prompt cron route", () => {
  it("deep-links the daily prompt broadcast to its comparison page", async () => {
    setCronEnv();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T12:00:00.000Z"));
    mocks.sendPushBroadcast.mockResolvedValue(7);

    const promptQuery = createQueryChain();
    promptQuery.single.mockResolvedValue({
      data: {
        id: "prompt-1",
        prompt_text: "How is housing changing your neighborhood?",
        topic: [{ title: "Housing costs", slug: "housing-costs" }],
      },
    });

    const perspectivesCountQuery = createQueryChain();
    perspectivesCountQuery.gte.mockResolvedValue({ count: 4 });

    const from = vi.fn((table: string) => {
      if (table === "perspective_prompts") return promptQuery;
      if (table === "perspectives") return perspectivesCountQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.createClient.mockReturnValue({ from });

    const { GET } = await import("./daily-prompt/route");
    const response = await GET(createAuthorizedRequest("/api/cron/daily-prompt"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 7,
      prompt_id: "prompt-1",
      topic: "Housing costs",
    });
    expect(promptQuery.eq).toHaveBeenCalledWith("active", true);
    expect(promptQuery.lte).toHaveBeenCalledWith(
      "starts_at",
      "2026-05-11T12:00:00.000Z"
    );
    expect(perspectivesCountQuery.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(perspectivesCountQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-05-11T00:00:00.000Z"
    );
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Housing costs right now. 4 perspectives so far today.",
      url: "/compare/housing-costs",
    });
  });
});
