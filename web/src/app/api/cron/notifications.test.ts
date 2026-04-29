import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type QueryStep = {
  select?: ReturnType<typeof vi.fn>;
  eq?: ReturnType<typeof vi.fn>;
  lte?: ReturnType<typeof vi.fn>;
  gte?: ReturnType<typeof vi.fn>;
  order?: ReturnType<typeof vi.fn>;
  limit?: ReturnType<typeof vi.fn>;
  single?: ReturnType<typeof vi.fn>;
};

const envBackup = { ...process.env };

afterEach(() => {
  process.env = { ...envBackup };
});

function authorizedRequest(): Request {
  return new Request("https://example.com/api/cron", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

function resetCronEnv(): void {
  process.env = {
    ...envBackup,
    CRON_SECRET: "test-cron-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.com",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  };
}

describe("daily prompt cron notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    resetCronEnv();
  });

  it("rejects requests without the cron bearer secret before creating a Supabase client", async () => {
    const createClient = vi.fn();
    const sendPushBroadcast = vi.fn();

    vi.doMock("@supabase/supabase-js", () => ({ createClient }));
    vi.doMock("@/lib/send-push", () => ({ sendPushBroadcast }));

    const { GET } = await import("./daily-prompt/route");
    const response = await GET(new Request("https://example.com/api/cron"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClient).not.toHaveBeenCalled();
    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });

  it("returns not configured when service credentials are missing", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    const createClient = vi.fn();
    const sendPushBroadcast = vi.fn();

    vi.doMock("@supabase/supabase-js", () => ({ createClient }));
    vi.doMock("@/lib/send-push", () => ({ sendPushBroadcast }));

    const { GET } = await import("./daily-prompt/route");
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Not configured" });
    expect(createClient).not.toHaveBeenCalled();
    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });

  it("deep-links the push broadcast to the comparison page for the active prompt topic", async () => {
    const sendPushBroadcast = vi.fn().mockResolvedValue(42);
    const promptQuery: QueryStep = {};
    promptQuery.select = vi.fn(() => promptQuery);
    promptQuery.eq = vi.fn(() => promptQuery);
    promptQuery.lte = vi.fn(() => promptQuery);
    promptQuery.order = vi.fn(() => promptQuery);
    promptQuery.limit = vi.fn(() => promptQuery);
    promptQuery.single = vi.fn().mockResolvedValue({
      data: {
        id: "prompt-1",
        prompt_text: "What changed this week?",
        topic: { title: "Transit changes", slug: "transit-changes" },
      },
    });

    const countQuery: QueryStep = {};
    countQuery.select = vi.fn(() => countQuery);
    countQuery.gte = vi.fn().mockResolvedValue({ count: 7 });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "perspective_prompts") return promptQuery;
        if (table === "perspectives") return countQuery;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => supabase),
    }));
    vi.doMock("@/lib/send-push", () => ({ sendPushBroadcast }));

    const { GET } = await import("./daily-prompt/route");
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 42,
      prompt_id: "prompt-1",
      topic: "Transit changes",
    });
    expect(sendPushBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Communities are posting about Transit changes right now. 7 perspectives so far today.",
        url: "/compare/transit-changes",
      })
    );
  });

  it("handles Supabase relation aliases returned as one-item arrays", async () => {
    const sendPushBroadcast = vi.fn().mockResolvedValue(1);
    const promptQuery: QueryStep = {};
    promptQuery.select = vi.fn(() => promptQuery);
    promptQuery.eq = vi.fn(() => promptQuery);
    promptQuery.lte = vi.fn(() => promptQuery);
    promptQuery.order = vi.fn(() => promptQuery);
    promptQuery.limit = vi.fn(() => promptQuery);
    promptQuery.single = vi.fn().mockResolvedValue({
      data: {
        id: "prompt-2",
        prompt_text: "What are neighbors seeing?",
        topic: [{ title: "School budgets", slug: "school-budgets" }],
      },
    });

    const countQuery: QueryStep = {};
    countQuery.select = vi.fn(() => countQuery);
    countQuery.gte = vi.fn().mockResolvedValue({ count: 0 });

    const supabase = {
      from: vi.fn((table: string) => (table === "perspective_prompts" ? promptQuery : countQuery)),
    };

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => supabase),
    }));
    vi.doMock("@/lib/send-push", () => ({ sendPushBroadcast }));

    const { GET } = await import("./daily-prompt/route");
    await GET(authorizedRequest());

    expect(sendPushBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Communities are posting about School budgets right now. 0 perspectives so far today.",
        url: "/compare/school-budgets",
      })
    );
  });
});

describe("new perspective cron notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    resetCronEnv();
  });

  it("groups verified perspectives by community and deep-links each notification to its comparison topic", async () => {
    const sendPushToCommunityFollowers = vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    const perspectivesQuery: QueryStep = {};
    perspectivesQuery.select = vi.fn(() => perspectivesQuery);
    perspectivesQuery.eq = vi.fn(() => perspectivesQuery);
    perspectivesQuery.gte = vi.fn().mockResolvedValue({
      data: [
        {
          id: "p-1",
          quote: "The bus schedule changed how we get to work.",
          community_id: "community-1",
          topic_id: "topic-1",
          community: { name: "Riverside", },
          topic: { title: "Transit changes", slug: "transit-changes" },
        },
        {
          id: "p-2",
          quote: "Evening rides are harder now.",
          community_id: "community-1",
          topic_id: "topic-1",
          community: { name: "Riverside" },
          topic: { title: "Transit changes", slug: "transit-changes" },
        },
        {
          id: "p-3",
          quote: "Our route finally reaches the clinic.",
          community_id: "community-2",
          topic_id: "topic-1",
          community: [{ name: "Hilltown" }],
          topic: [{ title: "Transit changes", slug: "transit-changes" }],
        },
      ],
    });

    const supabase = {
      from: vi.fn(() => perspectivesQuery),
    };

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => supabase),
    }));
    vi.doMock("@/lib/send-push", () => ({ sendPushToCommunityFollowers }));

    const { GET } = await import("./notify-perspectives/route");
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 5,
      perspectives: 3,
      communities: 2,
    });
    expect(sendPushToCommunityFollowers).toHaveBeenCalledTimes(2);
    expect(sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      1,
      "community-1",
      expect.objectContaining({
        title: 'New perspective on "Transit changes"',
        body: "2 new perspectives from Riverside",
        url: "/compare/transit-changes",
      })
    );
    expect(sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      2,
      "community-2",
      expect.objectContaining({
        title: 'New perspective on "Transit changes"',
        body: "Our route finally reaches the clinic.",
        url: "/compare/transit-changes",
      })
    );
  });

  it("falls back to the feed when a new perspective has no topic slug", async () => {
    const sendPushToCommunityFollowers = vi.fn().mockResolvedValue(1);
    const perspectivesQuery: QueryStep = {};
    perspectivesQuery.select = vi.fn(() => perspectivesQuery);
    perspectivesQuery.eq = vi.fn(() => perspectivesQuery);
    perspectivesQuery.gte = vi.fn().mockResolvedValue({
      data: [
        {
          id: "p-4",
          quote: "We need more context before comparing.",
          community_id: "community-3",
          topic_id: null,
          community: null,
          topic: null,
        },
      ],
    });

    const supabase = {
      from: vi.fn(() => perspectivesQuery),
    };

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => supabase),
    }));
    vi.doMock("@/lib/send-push", () => ({ sendPushToCommunityFollowers }));

    const { GET } = await import("./notify-perspectives/route");
    await GET(authorizedRequest());

    expect(sendPushToCommunityFollowers).toHaveBeenCalledWith(
      "community-3",
      expect.objectContaining({
        title: "A community shared a perspective",
        body: "We need more context before comparing.",
        url: "/feed",
      })
    );
  });
});
