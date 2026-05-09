import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { sendPushBroadcast } from "@/lib/send-push";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/send-push", () => ({
  sendPushBroadcast: vi.fn(),
}));

const originalEnv = { ...process.env };

type ChainMock = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function chainWithTerminal(terminal: Partial<ChainMock>): ChainMock {
  const chain = {} as ChainMock;
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = terminal.single ?? vi.fn();
  return chain;
}

async function importRoute() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://prism.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.CRON_SECRET = "cron-secret";
  vi.resetModules();
  return import("./route");
}

function cronRequest(secret = "cron-secret"): Request {
  return new Request("https://example.com/api/cron/daily-prompt", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("daily prompt cron route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("deep-links push notifications to the comparison page for the active topic", async () => {
    const promptChain = chainWithTerminal({
      single: vi.fn().mockResolvedValue({
        data: {
          id: "prompt-1",
          prompt_text: "What is changing locally?",
          topic: [{ title: "Transit funding", slug: "transit-funding" }],
        },
      }),
    });
    const perspectivesCountChain = chainWithTerminal({});
    perspectivesCountChain.gte = vi.fn().mockResolvedValue({ count: 7 });

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "perspective_prompts") return promptChain;
        if (table === "perspectives") return perspectivesCountChain;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);
    vi.mocked(sendPushBroadcast).mockResolvedValue(12);

    const { GET } = await importRoute();
    const response = await GET(cronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: 12,
      prompt_id: "prompt-1",
      topic: "Transit funding",
    });
    expect(sendPushBroadcast).toHaveBeenCalledWith({
      title: "A new perspective prompt is live",
      body: "Communities are posting about Transit funding right now. 7 perspectives so far today.",
      url: "/compare/transit-funding",
    });
    expect(promptChain.eq).toHaveBeenCalledWith("active", true);
    expect(promptChain.lte).toHaveBeenCalledWith("starts_at", expect.any(String));
  });

  it("rejects requests without the configured cron secret before querying Supabase", async () => {
    const { GET } = await importRoute();
    const response = await GET(cronRequest("wrong-secret"));

    expect(response.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });
});
