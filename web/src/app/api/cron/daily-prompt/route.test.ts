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

function createAuthorizedRequest(secret: string): Request {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: {
      authorization: `Bearer ${secret}`,
    },
  });
}

function setupSupabaseMocks(options: {
  topicSlug: string | null;
  todayPerspectiveCount: number;
  topicAsArray?: boolean;
}) {
  const topicRecord = {
    title: "Wildfire response",
    slug: options.topicSlug,
  };

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
  promptQuery.single.mockResolvedValue({
    data: {
      id: "prompt-1",
      prompt_text: "How are communities responding?",
      topic: options.topicAsArray ? [topicRecord] : topicRecord,
    },
  });

  const perspectivesQuery = {
    select: vi.fn(),
    gte: vi.fn(),
  };
  perspectivesQuery.select.mockReturnValue(perspectivesQuery);
  perspectivesQuery.gte.mockResolvedValue({
    count: options.todayPerspectiveCount,
  });

  const fromMock = vi.fn((tableName: string) => {
    if (tableName === "perspective_prompts") {
      return promptQuery;
    }
    if (tableName === "perspectives") {
      return perspectivesQuery;
    }
    throw new Error(`Unexpected table queried: ${tableName}`);
  });

  createClientMock.mockReturnValue({
    from: fromMock,
  });
}

describe("GET /api/cron/daily-prompt", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns unauthorized when auth header is invalid", async () => {
    const { GET } = await import("./route");
    const request = new Request("https://example.com/api/cron/daily-prompt");

    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("sends push with comparison deep link when topic slug exists", async () => {
    setupSupabaseMocks({
      topicSlug: "wildfire-response",
      todayPerspectiveCount: 7,
      topicAsArray: true,
    });
    sendPushBroadcastMock.mockResolvedValue(18);

    const { GET } = await import("./route");
    const response = await GET(createAuthorizedRequest("cron-test-secret"));

    expect(response.status).toBe(200);
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Wildfire response right now. 7 perspectives so far today.",
      url: "/compare/wildfire-response",
    });
    await expect(response.json()).resolves.toEqual({
      sent: 18,
      prompt_id: "prompt-1",
      topic: "Wildfire response",
    });
  });

  it("falls back to feed link when topic slug is missing", async () => {
    setupSupabaseMocks({
      topicSlug: null,
      todayPerspectiveCount: 2,
    });
    sendPushBroadcastMock.mockResolvedValue(3);

    const { GET } = await import("./route");
    const response = await GET(createAuthorizedRequest("cron-test-secret"));

    expect(response.status).toBe(200);
    expect(sendPushBroadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/feed",
      })
    );
  });
});
