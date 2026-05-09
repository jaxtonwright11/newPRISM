import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { sendPushToCommunityFollowers } from "@/lib/send-push";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/send-push", () => ({
  sendPushToCommunityFollowers: vi.fn(),
}));

const originalEnv = { ...process.env };

type PerspectiveRow = {
  id: string;
  quote: string;
  community_id: string;
  topic_id: string | null;
  community: { name: string } | { name: string }[] | null;
  topic: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

type PerspectiveChainMock = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
};

function createPerspectiveQuery(rows: PerspectiveRow[]): PerspectiveChainMock {
  const chain = {} as PerspectiveChainMock;
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn().mockResolvedValue({ data: rows });
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
  return new Request("https://example.com/api/cron/notify-perspectives", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("notify perspectives cron route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("groups verified perspectives by community and deep-links topic notifications to comparison pages", async () => {
    const query = createPerspectiveQuery([
      {
        id: "perspective-1",
        quote: "Transit delays are changing how our neighborhood gets to work.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Eastside riders" }],
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
      {
        id: "perspective-2",
        quote: "A second perspective from the same community should only affect the count.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Eastside riders" }],
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
      {
        id: "perspective-3",
        quote: "This community has no topic slug and should fall back to the feed.",
        community_id: "community-2",
        topic_id: null,
        community: { name: "Rural organizers" },
        topic: null,
      },
    ]);

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "perspectives") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return query;
      }),
    } as never);
    vi.mocked(sendPushToCommunityFollowers)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    const { GET } = await importRoute();
    const response = await GET(cronRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 6,
      perspectives: 3,
      communities: 2,
    });
    expect(query.eq).toHaveBeenCalledWith("verified", true);
    expect(query.gte).toHaveBeenCalledWith("created_at", expect.any(String));
    expect(sendPushToCommunityFollowers).toHaveBeenNthCalledWith(1, "community-1", {
      title: 'New perspective on "Transit funding"',
      body: "2 new perspectives from Eastside riders",
      url: "/compare/transit-funding",
      icon: "/icons/icon-192.svg",
    });
    expect(sendPushToCommunityFollowers).toHaveBeenNthCalledWith(2, "community-2", {
      title: "Rural organizers shared a perspective",
      body: "This community has no topic slug and should fall back to the feed.",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });

  it("rejects requests without the configured cron secret before querying Supabase", async () => {
    const { GET } = await importRoute();
    const response = await GET(cronRequest("wrong-secret"));

    expect(response.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
    expect(sendPushToCommunityFollowers).not.toHaveBeenCalled();
  });
});
