import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  sendPushBroadcast: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushBroadcast: mocks.sendPushBroadcast,
}));

function createAuthorizedRequest() {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

function createPromptQuery(prompt: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: prompt }),
  };
}

function createPerspectiveCountQuery(count: number) {
  return {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ count }),
  };
}

async function importRoute() {
  vi.resetModules();
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  return import("./route");
}

describe("GET /api/cron/daily-prompt", () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.sendPushBroadcast.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends active prompt notifications to the comparison route for the prompt topic", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T14:30:00.000Z"));

    const promptQuery = createPromptQuery({
      id: "prompt-1",
      prompt_text: "How is transit changing your day?",
      topic: [{ title: "Transit delays", slug: "transit-delays" }],
    });
    const perspectiveCountQuery = createPerspectiveCountQuery(7);
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "perspective_prompts") return promptQuery;
        if (table === "perspectives") return perspectiveCountQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    mocks.createClient.mockReturnValue(supabase);
    mocks.sendPushBroadcast.mockResolvedValue(42);

    const { GET } = await importRoute();
    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 42,
      prompt_id: "prompt-1",
      topic: "Transit delays",
    });

    expect(promptQuery.select).toHaveBeenCalledWith(
      "id, prompt_text, topic:topics(title, slug)"
    );
    expect(promptQuery.eq).toHaveBeenCalledWith("active", true);
    expect(promptQuery.lte).toHaveBeenCalledWith(
      "starts_at",
      "2026-05-10T14:30:00.000Z"
    );
    expect(perspectiveCountQuery.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(perspectiveCountQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-05-10T00:00:00.000Z"
    );
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Transit delays right now. 7 perspectives so far today.",
      url: "/compare/transit-delays",
    });
  });

  it("falls back to the feed when an active prompt has no topic slug", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T14:30:00.000Z"));

    const promptQuery = createPromptQuery({
      id: "prompt-2",
      prompt_text: "What changed locally today?",
      topic: { title: "today's topic", slug: null },
    });
    const perspectiveCountQuery = createPerspectiveCountQuery(0);
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "perspective_prompts") return promptQuery;
        if (table === "perspectives") return perspectiveCountQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    mocks.createClient.mockReturnValue(supabase);
    mocks.sendPushBroadcast.mockResolvedValue(3);

    const { GET } = await importRoute();
    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about today's topic right now. 0 perspectives so far today.",
      url: "/feed",
    });
  });
});
