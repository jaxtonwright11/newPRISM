import { afterEach, describe, expect, it, vi } from "vitest";

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
  return new Request("https://prism.test/api/cron/daily-prompt", {
    headers: {
      authorization: "Bearer test-cron-secret",
    },
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

function createCountQuery(count: number) {
  return {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ count }),
  };
}

async function importRoute() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("CRON_SECRET", "test-cron-secret");

  return import("./route");
}

describe("daily-prompt cron route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("deep-links active prompt notifications to the topic comparison page", async () => {
    const promptQuery = createPromptQuery({
      id: "prompt-1",
      prompt_text: "How is water policy affecting your community?",
      topic: [{ title: "Water policy", slug: "water-policy" }],
    });
    const countQuery = createCountQuery(12);
    const from = vi.fn((table: string) => {
      if (table === "perspective_prompts") {
        return promptQuery;
      }

      return countQuery;
    });
    mocks.createClient.mockReturnValue({ from });
    mocks.sendPushBroadcast.mockResolvedValue(42);
    const { GET } = await importRoute();

    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 42,
      prompt_id: "prompt-1",
      topic: "Water policy",
    });
    expect(from).toHaveBeenCalledWith("perspective_prompts");
    expect(from).toHaveBeenCalledWith("perspectives");
    expect(promptQuery.select).toHaveBeenCalledWith("id, prompt_text, topic:topics(title, slug)");
    expect(promptQuery.eq).toHaveBeenCalledWith("active", true);
    expect(countQuery.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Water policy right now. 12 perspectives so far today.",
      url: "/compare/water-policy",
    });
  });
});
