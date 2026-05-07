import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, sendPushBroadcastMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  sendPushBroadcastMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushBroadcast: sendPushBroadcastMock,
}));

const originalEnv = { ...process.env };

type PromptTopic = { title?: string; slug?: string } | null;
type PromptRecord = {
  id: string;
  prompt_text: string;
  topic?: PromptTopic | PromptTopic[];
};

function authorizedRequest() {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: { authorization: "Bearer cron-secret" },
  });
}

function setupEnvironment() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.CRON_SECRET = "cron-secret";
}

function setupSupabasePrompt(prompt: PromptRecord | null, count: number | null) {
  const promptQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
  };
  promptQuery.select.mockReturnValue(promptQuery);
  promptQuery.eq.mockReturnValue(promptQuery);
  promptQuery.lte.mockReturnValue(promptQuery);
  promptQuery.order.mockReturnValue(promptQuery);
  promptQuery.limit.mockReturnValue(promptQuery);
  promptQuery.single.mockResolvedValue({ data: prompt });

  const countQuery = {
    select: vi.fn(),
    gte: vi.fn(),
  };
  countQuery.select.mockReturnValue(countQuery);
  countQuery.gte.mockResolvedValue({ count });

  const fromMock = vi.fn((table: string) => {
    if (table === "perspective_prompts") return promptQuery;
    if (table === "perspectives") return countQuery;
    throw new Error(`Unexpected table: ${table}`);
  });

  createClientMock.mockReturnValue({ from: fromMock });

  return { countQuery, fromMock, promptQuery };
}

async function importRoute() {
  vi.resetModules();
  return import("./route");
}

describe("GET /api/cron/daily-prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnvironment();
    sendPushBroadcastMock.mockResolvedValue(12);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("deep-links the daily prompt notification to the comparison view when the topic relation is an array", async () => {
    setupSupabasePrompt(
      {
        id: "prompt-1",
        prompt_text: "What changed in your city this week?",
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
      5
    );

    const { GET } = await importRoute();
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 12,
      prompt_id: "prompt-1",
      topic: "Transit funding",
    });
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Transit funding right now. 5 perspectives so far today.",
      url: "/compare/transit-funding",
    });
  });

  it("falls back to the feed when the active prompt has no topic slug", async () => {
    setupSupabasePrompt(
      {
        id: "prompt-2",
        prompt_text: "What should your neighbors understand?",
        topic: null,
      },
      null
    );

    const { GET } = await importRoute();
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(200);
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about today's topic right now. 0 perspectives so far today.",
      url: "/feed",
    });
  });

  it("does not query Supabase when the cron secret is missing or invalid", async () => {
    const { GET } = await importRoute();
    const response = await GET(
      new Request("https://example.com/api/cron/daily-prompt", {
        headers: { authorization: "Bearer wrong-secret" },
      })
    );

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendPushBroadcastMock).not.toHaveBeenCalled();
  });
});
