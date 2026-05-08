import { afterEach, describe, expect, it, vi } from "vitest";

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

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
] as const;

const originalEnv = new Map<(typeof ENV_KEYS)[number], string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

type EnvKey = (typeof ENV_KEYS)[number];

type PromptTopic = {
  title: string;
  slug: string | null;
};

type PromptRow = {
  id: string;
  topic: PromptTopic | PromptTopic[] | null;
};

type QueryCall = {
  table: string;
  method: string;
  args: unknown[];
};

function restoreEnv() {
  ENV_KEYS.forEach((key) => {
    const originalValue = originalEnv.get(key);
    if (originalValue === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = originalValue;
  });
}

function configureEnv(overrides: Partial<Record<EnvKey, string>> = {}) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.CRON_SECRET = "cron-secret";

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key as EnvKey];
      return;
    }

    process.env[key as EnvKey] = value;
  });
}

async function importRoute() {
  vi.resetModules();
  const route = await import("./route");
  return route.GET;
}

function createAuthorizedRequest() {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: {
      Authorization: "Bearer cron-secret",
    },
  });
}

function createSupabaseMock(prompt: PromptRow | null, count: number | null, calls: QueryCall[]) {
  const promptQuery = {
    select: vi.fn((...args: unknown[]) => {
      calls.push({ table: "perspective_prompts", method: "select", args });
      return promptQuery;
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ table: "perspective_prompts", method: "eq", args });
      return promptQuery;
    }),
    lte: vi.fn((...args: unknown[]) => {
      calls.push({ table: "perspective_prompts", method: "lte", args });
      return promptQuery;
    }),
    order: vi.fn((...args: unknown[]) => {
      calls.push({ table: "perspective_prompts", method: "order", args });
      return promptQuery;
    }),
    limit: vi.fn((...args: unknown[]) => {
      calls.push({ table: "perspective_prompts", method: "limit", args });
      return promptQuery;
    }),
    single: vi.fn(async () => ({ data: prompt })),
  };

  const perspectivesQuery = {
    select: vi.fn((...args: unknown[]) => {
      calls.push({ table: "perspectives", method: "select", args });
      return perspectivesQuery;
    }),
    gte: vi.fn(async (...args: unknown[]) => {
      calls.push({ table: "perspectives", method: "gte", args });
      return { count };
    }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "perspective_prompts") return promptQuery;
      if (table === "perspectives") return perspectivesQuery;
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe("GET /api/cron/daily-prompt", () => {
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("rejects requests without the configured cron secret", async () => {
    configureEnv();
    const GET = await importRoute();

    const response = await GET(new Request("https://example.com/api/cron/daily-prompt"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendPushBroadcastMock).not.toHaveBeenCalled();
  });

  it("returns not configured before creating a Supabase client when service env is missing", async () => {
    configureEnv({ SUPABASE_SERVICE_ROLE_KEY: "" });
    const GET = await importRoute();

    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Not configured" });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendPushBroadcastMock).not.toHaveBeenCalled();
  });

  it("broadcasts active prompts to the comparison route for the topic slug", async () => {
    configureEnv();
    const calls: QueryCall[] = [];
    const supabase = createSupabaseMock(
      {
        id: "prompt-1",
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
      7,
      calls
    );
    createClientMock.mockReturnValue(supabase);
    sendPushBroadcastMock.mockResolvedValue(3);
    const GET = await importRoute();

    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 3,
      prompt_id: "prompt-1",
      topic: "Transit funding",
    });
    expect(createClientMock).toHaveBeenCalledWith("https://supabase.example", "service-role");
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Transit funding right now. 7 perspectives so far today.",
      url: "/compare/transit-funding",
    });
    expect(calls).toEqual(
      expect.arrayContaining([
        {
          table: "perspective_prompts",
          method: "eq",
          args: ["active", true],
        },
        {
          table: "perspectives",
          method: "select",
          args: ["id", { count: "exact", head: true }],
        },
      ])
    );
  });

  it("falls back to feed when the active prompt is missing a topic slug", async () => {
    configureEnv();
    const calls: QueryCall[] = [];
    const supabase = createSupabaseMock(
      {
        id: "prompt-2",
        topic: { title: "today's topic", slug: null },
      },
      null,
      calls
    );
    createClientMock.mockReturnValue(supabase);
    sendPushBroadcastMock.mockResolvedValue(1);
    const GET = await importRoute();

    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 1,
      prompt_id: "prompt-2",
      topic: "today's topic",
    });
    expect(sendPushBroadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Communities are posting about today's topic right now. 0 perspectives so far today.",
        url: "/feed",
      })
    );
  });
});
