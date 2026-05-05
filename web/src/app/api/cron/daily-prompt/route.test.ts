import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

const mocks = vi.hoisted(() => ({
  sendPushBroadcast: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/send-push", () => ({
  sendPushBroadcast: mocks.sendPushBroadcast,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

function createCronRequest(secret = "test-cron-secret"): Request {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: {
      authorization: `Bearer ${secret}`,
    },
  });
}

type QueryResult = {
  data?: unknown;
  count?: number | null;
};

function createDailyPromptSupabase(results: QueryResult[]) {
  let nextResult = 0;

  return {
    from: vi.fn(() => {
      const result = results[nextResult] ?? {};
      nextResult += 1;

      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        lte: vi.fn(() => builder),
        gte: vi.fn(async () => result),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        single: vi.fn(async () => result),
      };

      return builder;
    }),
  };
}

async function importRoute() {
  vi.resetModules();
  return import("./route");
}

describe("daily prompt cron", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };
    mocks.sendPushBroadcast.mockResolvedValue(12);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("deep-links active prompt push notifications to the comparison view", async () => {
    const supabase = createDailyPromptSupabase([
      {
        data: {
          id: "prompt-1",
          prompt_text: "What are communities seeing?",
          topic: { title: "Housing costs", slug: "housing-costs" },
        },
      },
      { count: 7 },
    ]);
    mocks.createClient.mockReturnValue(supabase);
    const { GET } = await importRoute();

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 12,
      prompt_id: "prompt-1",
      topic: "Housing costs",
    });
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Housing costs right now. 7 perspectives so far today.",
      url: "/compare/housing-costs",
    });
  });

  it("falls back to feed when the active prompt has no topic slug", async () => {
    const supabase = createDailyPromptSupabase([
      {
        data: {
          id: "prompt-2",
          prompt_text: "Share what your community is noticing.",
          topic: null,
        },
      },
      { count: null },
    ]);
    mocks.createClient.mockReturnValue(supabase);
    const { GET } = await importRoute();

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 12,
      prompt_id: "prompt-2",
      topic: "today's topic",
    });
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about today's topic right now. 0 perspectives so far today.",
      url: "/feed",
    });
  });
});
