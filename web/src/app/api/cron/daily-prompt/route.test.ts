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

function createRequest(secret: string | null): Request {
  const headers = new Headers();
  if (secret) {
    headers.set("authorization", `Bearer ${secret}`);
  }

  return new Request("https://prism.example/api/cron/daily-prompt", {
    headers,
  });
}

function createPromptQuery(prompt: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(async () => ({ data: prompt })),
  };

  return query;
}

function createPerspectiveCountQuery(count: number | null) {
  const query = {
    select: vi.fn(() => query),
    gte: vi.fn(async () => ({ count })),
  };

  return query;
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("GET /api/cron/daily-prompt", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects requests without the configured cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { GET } = await loadRoute();
    const response = await GET(createRequest(null));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("broadcasts active prompt notifications to the comparison page for the prompt topic", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:30:00.000Z"));

    const promptQuery = createPromptQuery({
      id: "prompt-1",
      prompt_text: "How is transit funding affecting your community?",
      topic: [{ title: "Transit funding", slug: "transit-funding" }],
    });
    const countQuery = createPerspectiveCountQuery(12);
    const from = vi.fn((table: string) => {
      if (table === "perspective_prompts") return promptQuery;
      if (table === "perspectives") return countQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.createClient.mockReturnValue({ from });
    mocks.sendPushBroadcast.mockResolvedValue(42);

    const { GET } = await loadRoute();
    const response = await GET(createRequest("cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 42,
      prompt_id: "prompt-1",
      topic: "Transit funding",
    });
    expect(promptQuery.eq).toHaveBeenCalledWith("active", true);
    expect(promptQuery.lte).toHaveBeenCalledWith(
      "starts_at",
      "2026-04-14T12:30:00.000Z"
    );
    expect(promptQuery.order).toHaveBeenCalledWith("starts_at", { ascending: false });
    expect(promptQuery.limit).toHaveBeenCalledWith(1);
    expect(countQuery.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(countQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-04-14T00:00:00.000Z"
    );
    expect(mocks.sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Transit funding right now. 12 perspectives so far today.",
      url: "/compare/transit-funding",
    });
  });
});
