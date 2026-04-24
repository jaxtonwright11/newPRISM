import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const sendPushBroadcastMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushBroadcast: sendPushBroadcastMock,
}));

const ENV_KEYS = [
  "CRON_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const originalEnv = new Map<string, string | undefined>();

interface TopicRecord {
  title?: string;
  slug?: string | null;
}

interface PromptRecord {
  id: string;
  prompt_text: string;
  topic: TopicRecord | TopicRecord[] | null;
}

interface DailyPromptClientConfig {
  prompt: PromptRecord | null;
  count: number | null;
}

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    if (key in values) {
      process.env[key] = values[key];
      continue;
    }
    delete process.env[key];
  }
}

function createDailyPromptClient(config: DailyPromptClientConfig) {
  return {
    from: (table: string) => {
      if (table === "perspective_prompts") {
        return {
          select: () => ({
            eq: () => ({
              lte: () => ({
                order: () => ({
                  limit: () => ({
                    single: async () => ({ data: config.prompt }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === "perspectives") {
        return {
          select: () => ({
            gte: async () => ({ count: config.count }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    if (!originalEnv.has(key)) {
      originalEnv.set(key, process.env[key]);
    }
  }
  createClientMock.mockReset();
  sendPushBroadcastMock.mockReset();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("GET /api/cron/daily-prompt", () => {
  it("returns 401 when the cron secret is missing or invalid", async () => {
    setEnv({ CRON_SECRET: "cron-secret" });
    const { GET } = await loadRoute();

    const response = await GET(new Request("https://example.com/api/cron/daily-prompt"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase configuration is unavailable", async () => {
    setEnv({ CRON_SECRET: "cron-secret" });
    const { GET } = await loadRoute();

    const response = await GET(
      new Request("https://example.com/api/cron/daily-prompt", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Not configured" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("broadcasts a comparison deep-link when an active prompt has a topic slug", async () => {
    setEnv({
      CRON_SECRET: "cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });
    createClientMock.mockReturnValue(
      createDailyPromptClient({
        prompt: {
          id: "prompt-1",
          prompt_text: "What changed this week?",
          topic: { title: "Housing Affordability", slug: "housing-affordability" },
        },
        count: 7,
      })
    );
    sendPushBroadcastMock.mockResolvedValue(12);
    const { GET } = await loadRoute();

    const response = await GET(
      new Request("https://example.com/api/cron/daily-prompt", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(sendPushBroadcastMock).toHaveBeenCalledTimes(1);
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: 'Communities are posting about Housing Affordability right now. 7 perspectives so far today.',
      url: "/compare/housing-affordability",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 12,
      prompt_id: "prompt-1",
      topic: "Housing Affordability",
    });
  });

  it("falls back to feed deep-link when the topic slug is unavailable", async () => {
    setEnv({
      CRON_SECRET: "cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });
    createClientMock.mockReturnValue(
      createDailyPromptClient({
        prompt: {
          id: "prompt-2",
          prompt_text: "Share what your community noticed",
          topic: { title: "Public Transit", slug: null },
        },
        count: 0,
      })
    );
    sendPushBroadcastMock.mockResolvedValue(3);
    const { GET } = await loadRoute();

    await GET(
      new Request("https://example.com/api/cron/daily-prompt", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(sendPushBroadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/feed",
      })
    );
  });
});
