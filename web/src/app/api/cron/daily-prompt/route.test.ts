import { beforeEach, describe, expect, it, vi } from "vitest";

const sendPushBroadcastMock = vi.fn();
const createClientMock = vi.fn();

type QueryResponse = {
  data?: unknown;
  count?: number | null;
};

type QueryBuilder = {
  select: (columns: string, options?: unknown) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  lte: (column: string, value: unknown) => QueryBuilder;
  gte: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, options: unknown) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  single: () => Promise<{ data: unknown }>;
  then: Promise<QueryResponse>["then"];
};

function createQueryBuilder(response: QueryResponse) {
  const builder = {} as QueryBuilder;
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.lte = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.single = vi.fn(async () => ({ data: response.data }));
  builder.then = vi.fn((onfulfilled, onrejected) =>
    Promise.resolve(response).then(onfulfilled, onrejected)
  );

  return builder;
}

function createSupabaseMock(prompt: unknown, perspectiveCount: number | null = 0) {
  const promptQuery = createQueryBuilder({ data: prompt });
  const perspectivesQuery = createQueryBuilder({ count: perspectiveCount });
  const from = vi.fn((table: string) => {
    if (table === "perspective_prompts") return promptQuery;
    if (table === "perspectives") return perspectivesQuery;
    throw new Error(`Unexpected table: ${table}`);
  });

  return { client: { from }, promptQuery, perspectivesQuery };
}

function createCronRequest(secret = "test-cron-secret") {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

async function importRoute() {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.CRON_SECRET = "test-cron-secret";

  vi.doMock("@/lib/send-push", () => ({
    sendPushBroadcast: sendPushBroadcastMock,
  }));
  vi.doMock("@supabase/supabase-js", () => ({
    createClient: createClientMock,
  }));

  return import("./route");
}

describe("daily prompt cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deep-links prompt notifications to the comparison page when topic is returned as an object", async () => {
    const supabase = createSupabaseMock(
      {
        id: "prompt-1",
        prompt_text: "What changed today?",
        topic: { title: "Local transit", slug: "local-transit" },
      },
      7
    );
    createClientMock.mockReturnValue(supabase.client);
    sendPushBroadcastMock.mockResolvedValue(42);
    const { GET } = await importRoute();

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 42,
      prompt_id: "prompt-1",
      topic: "Local transit",
    });
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Local transit right now. 7 perspectives so far today.",
      url: "/compare/local-transit",
    });
  });

  it("handles Supabase topic relation arrays and falls back to feed when no topic slug exists", async () => {
    const supabase = createSupabaseMock(
      {
        id: "prompt-2",
        prompt_text: "What feels different?",
        topic: [{ title: "today's topic", slug: null }],
      },
      null
    );
    createClientMock.mockReturnValue(supabase.client);
    sendPushBroadcastMock.mockResolvedValue(3);
    const { GET } = await importRoute();

    const response = await GET(createCronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 3,
      prompt_id: "prompt-2",
      topic: "today's topic",
    });
    expect(sendPushBroadcastMock).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about today's topic right now. 0 perspectives so far today.",
      url: "/feed",
    });
  });

  it("does not query Supabase or send push when cron authorization is invalid", async () => {
    const { GET } = await importRoute();

    const response = await GET(createCronRequest("wrong-secret"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendPushBroadcastMock).not.toHaveBeenCalled();
  });
});
