import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function createAuthorizedRequest() {
  return new Request("https://example.com/api/cron/notify-perspectives", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

function createPerspectivesQuery(data: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data }),
  };
}

async function importRoute() {
  vi.resetModules();
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  return import("./route");
}

describe("GET /api/cron/notify-perspectives", () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.sendPushToCommunityFollowers.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("groups verified recent perspectives by community and deep-links topic notifications to comparisons", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-05-10T10:00:00.000Z"));

    const perspectives = [
      {
        id: "perspective-1",
        quote: "The river has flooded the commute for a third straight week.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Harbor Workers" }],
        topic: [{ title: "Flooding downtown", slug: "flooding-downtown" }],
      },
      {
        id: "perspective-2",
        quote: "Parents are changing pickup routes because the side roads are closed.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Harbor Workers" }],
        topic: [{ title: "Flooding downtown", slug: "flooding-downtown" }],
      },
      {
        id: "perspective-3",
        quote: "We need more warning before emergency detours begin.",
        community_id: "community-2",
        topic_id: null,
        community: { name: "Hill Seniors" },
        topic: null,
      },
    ];
    const perspectivesQuery = createPerspectivesQuery(perspectives);
    const supabase = {
      from: vi.fn((table: string) => {
        expect(table).toBe("perspectives");
        return perspectivesQuery;
      }),
    };

    mocks.createClient.mockReturnValue(supabase);
    mocks.sendPushToCommunityFollowers.mockImplementation(async (communityId: string) =>
      communityId === "community-1" ? 3 : 1
    );

    const { GET } = await importRoute();
    const response = await GET(createAuthorizedRequest());

    await expect(response.json()).resolves.toEqual({
      notified: 4,
      perspectives: 3,
      communities: 2,
    });
    expect(response.status).toBe(200);

    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://supabase.example",
      "service-role-key"
    );
    expect(perspectivesQuery.select).toHaveBeenCalledWith(
      "id, quote, community_id, topic_id, community:communities(name), topic:topics(title, slug)"
    );
    expect(perspectivesQuery.eq).toHaveBeenCalledWith("verified", true);
    expect(perspectivesQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-05-10T09:00:00.000Z"
    );

    expect(mocks.sendPushToCommunityFollowers).toHaveBeenCalledTimes(2);
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      1,
      "community-1",
      {
        title: 'New perspective on "Flooding downtown"',
        body: "2 new perspectives from Harbor Workers",
        url: "/compare/flooding-downtown",
        icon: "/icons/icon-192.svg",
      }
    );
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      2,
      "community-2",
      {
        title: "Hill Seniors shared a perspective",
        body: "We need more warning before emergency detours begin.",
        url: "/feed",
        icon: "/icons/icon-192.svg",
      }
    );
  });

  it("rejects unauthenticated cron requests before touching Supabase", async () => {
    const { GET } = await importRoute();
    const response = await GET(
      new Request("https://example.com/api/cron/notify-perspectives")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.sendPushToCommunityFollowers).not.toHaveBeenCalled();
  });
});
