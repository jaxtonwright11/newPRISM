import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

type PromptRow = {
  id: string;
  prompt_text: string;
  topic: { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
};

type PerspectiveRow = {
  id: string;
  quote: string;
  community_id: string | null;
  topic_id: string | null;
  community: { name: string } | Array<{ name: string }> | null;
  topic: { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
};

type SupabaseFixtures = {
  prompt?: PromptRow | null;
  todayPerspectiveCount?: number | null;
  perspectives?: PerspectiveRow[] | null;
};

const sendPushBroadcastMock = vi.fn<(payload: PushPayload) => Promise<number>>();
const sendPushToCommunityFollowersMock =
  vi.fn<(communityId: string, payload: PushPayload) => Promise<number>>();

function createSupabaseMock(fixtures: SupabaseFixtures) {
  return {
    from(table: string) {
      if (table === "perspective_prompts") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: fixtures.prompt ?? null }),
        };
      }

      if (table === "perspectives") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockImplementation(() => {
            if (fixtures.perspectives !== undefined) {
              return Promise.resolve({ data: fixtures.perspectives });
            }

            return Promise.resolve({ count: fixtures.todayPerspectiveCount ?? null });
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

async function loadDailyPromptRoute(fixtures: SupabaseFixtures) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.CRON_SECRET = "cron-secret";

  vi.doMock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => createSupabaseMock(fixtures)),
  }));
  vi.doMock("@/lib/send-push", () => ({
    sendPushBroadcast: sendPushBroadcastMock,
  }));

  return import("./daily-prompt/route");
}

async function loadNotifyPerspectivesRoute(fixtures: SupabaseFixtures) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.CRON_SECRET = "cron-secret";

  vi.doMock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => createSupabaseMock(fixtures)),
  }));
  vi.doMock("@/lib/send-push", () => ({
    sendPushToCommunityFollowers: sendPushToCommunityFollowersMock,
  }));

  return import("./notify-perspectives/route");
}

function createCronRequest(secret = "cron-secret"): Request {
  return new Request("https://example.com/api/cron/test", {
    headers: {
      authorization: `Bearer ${secret}`,
    },
  });
}

describe("daily prompt push cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendPushBroadcastMock.mockResolvedValue(7);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock("@supabase/supabase-js");
    vi.doUnmock("@/lib/send-push");
  });

  it("deep-links active prompt notifications to the comparison view", async () => {
    const { GET } = await loadDailyPromptRoute({
      prompt: {
        id: "prompt-1",
        prompt_text: "What changed locally?",
        topic: [{ title: "Housing Costs", slug: "housing-costs" }],
      },
      todayPerspectiveCount: 4,
    });

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 7,
      prompt_id: "prompt-1",
      topic: "Housing Costs",
    });
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Housing Costs right now. 4 perspectives so far today.",
      url: "/compare/housing-costs",
    });
  });
});

describe("notify perspectives push cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 4, 6, 12));
    sendPushToCommunityFollowersMock.mockResolvedValue(3);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock("@supabase/supabase-js");
    vi.doUnmock("@/lib/send-push");
  });

  it("groups by community and deep-links topic notifications to comparison views", async () => {
    const { GET } = await loadNotifyPerspectivesRoute({
      perspectives: [
        {
          id: "perspective-1",
          quote: "Rent is changing where families can stay.",
          community_id: "community-1",
          topic_id: "topic-1",
          community: { name: "South Austin" },
          topic: { title: "Housing Costs", slug: "housing-costs" },
        },
        {
          id: "perspective-2",
          quote: "Transit access shapes the same housing pressure.",
          community_id: "community-1",
          topic_id: "topic-1",
          community: { name: "South Austin" },
          topic: { title: "Housing Costs", slug: "housing-costs" },
        },
        {
          id: "perspective-3",
          quote: "Food prices are shifting weekly routines.",
          community_id: "community-2",
          topic_id: "topic-2",
          community: [{ name: "East Denver" }],
          topic: [{ title: "Grocery Prices", slug: "grocery-prices" }],
        },
      ],
    });

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 6,
      perspectives: 3,
      communities: 2,
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledTimes(2);
    expect(sendPushToCommunityFollowersMock).toHaveBeenNthCalledWith(1, "community-1", {
      title: 'New perspective on "Housing Costs"',
      body: "2 new perspectives from South Austin",
      url: "/compare/housing-costs",
      icon: "/icons/icon-192.svg",
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenNthCalledWith(2, "community-2", {
      title: 'New perspective on "Grocery Prices"',
      body: "Food prices are shifting weekly routines.",
      url: "/compare/grocery-prices",
      icon: "/icons/icon-192.svg",
    });
  });

  it("falls back to the feed when a perspective has no topic slug", async () => {
    const { GET } = await loadNotifyPerspectivesRoute({
      perspectives: [
        {
          id: "perspective-1",
          quote: "The first visible sentence should carry the notification.",
          community_id: "community-1",
          topic_id: null,
          community: { name: "North Loop" },
          topic: null,
        },
      ],
    });

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-1", {
      title: "North Loop shared a perspective",
      body: "The first visible sentence should carry the notification.",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });
});
