import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  sendPushToCommunityFollowers: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushToCommunityFollowers: mocks.sendPushToCommunityFollowers,
}));

function createRequest(secret: string | null): Request {
  const headers = new Headers();
  if (secret) {
    headers.set("authorization", `Bearer ${secret}`);
  }

  return new Request("https://prism.example/api/cron/notify-perspectives", {
    headers,
  });
}

function createPerspectivesQuery(data: unknown[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(async () => ({ data })),
  };

  return query;
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("GET /api/cron/notify-perspectives", () => {
  afterEach(() => {
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

  it("returns a configuration error before querying Supabase when service env is missing", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { GET } = await loadRoute();
    const response = await GET(createRequest("cron-secret"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Not configured" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("groups verified recent perspectives and deep-links push notifications to comparison pages", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-04-14T12:00:00.000Z"));

    const perspectivesQuery = createPerspectivesQuery([
      {
        id: "perspective-1",
        quote: "First community quote",
        community_id: "community-1",
        topic_id: "topic-1",
        community: { name: "Austin neighbors" },
        topic: { title: "Transit funding", slug: "transit-funding" },
      },
      {
        id: "perspective-2",
        quote: "Second community quote",
        community_id: "community-1",
        topic_id: "topic-1",
        community: { name: "Austin neighbors" },
        topic: { title: "Transit funding", slug: "transit-funding" },
      },
      {
        id: "perspective-3",
        quote: "A community without topic context still gets a feed fallback",
        community_id: "community-2",
        topic_id: null,
        community: [{ name: "Rural coalition" }],
        topic: null,
      },
    ]);
    const from = vi.fn((table: string) => {
      if (table === "perspectives") return perspectivesQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.createClient.mockReturnValue({ from });
    mocks.sendPushToCommunityFollowers.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

    const { GET } = await loadRoute();
    const response = await GET(createRequest("cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 6,
      perspectives: 3,
      communities: 2,
    });
    expect(perspectivesQuery.select).toHaveBeenCalledWith(
      "id, quote, community_id, topic_id, community:communities(name), topic:topics(title, slug)"
    );
    expect(perspectivesQuery.eq).toHaveBeenCalledWith("verified", true);
    expect(perspectivesQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-04-14T11:00:00.000Z"
    );
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      1,
      "community-1",
      {
        title: 'New perspective on "Transit funding"',
        body: "2 new perspectives from Austin neighbors",
        url: "/compare/transit-funding",
        icon: "/icons/icon-192.svg",
      }
    );
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      2,
      "community-2",
      {
        title: "Rural coalition shared a perspective",
        body: "A community without topic context still gets a feed fallback",
        url: "/feed",
        icon: "/icons/icon-192.svg",
      }
    );
  });
});
