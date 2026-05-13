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

function createAuthorizedRequest() {
  return new Request("https://prism.test/api/cron/notify-perspectives", {
    headers: {
      authorization: "Bearer test-cron-secret",
    },
  });
}

function createUnauthorizedRequest() {
  return new Request("https://prism.test/api/cron/notify-perspectives", {
    headers: {
      authorization: "Bearer wrong-secret",
    },
  });
}

function createPerspectivesQuery(data: unknown[]) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data }),
  };

  return query;
}

async function importRoute() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("CRON_SECRET", "test-cron-secret");

  return import("./route");
}

describe("notify-perspectives cron route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects unauthorized requests before touching Supabase or push services", async () => {
    const { GET } = await importRoute();

    const response = await GET(createUnauthorizedRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.sendPushToCommunityFollowers).not.toHaveBeenCalled();
  });

  it("groups verified perspectives by community and deep-links notifications to comparison pages", async () => {
    const perspectivesQuery = createPerspectivesQuery([
      {
        id: "perspective-1",
        quote: "Farmers are seeing water policy differently this week.",
        community_id: "community-rural",
        topic_id: "topic-water",
        community: { name: "Rural Iowa" },
        topic: { title: "Water policy", slug: "water-policy" },
      },
      {
        id: "perspective-2",
        quote: "A second rural perspective should not create a duplicate push.",
        community_id: "community-rural",
        topic_id: "topic-water",
        community: { name: "Rural Iowa" },
        topic: { title: "Water policy", slug: "water-policy" },
      },
      {
        id: "perspective-3",
        quote: "Transit riders are comparing the same issue from a city view.",
        community_id: "community-urban",
        topic_id: "topic-transit",
        community: [{ name: "Detroit Riders" }],
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
    ]);
    const from = vi.fn().mockReturnValue(perspectivesQuery);
    mocks.createClient.mockReturnValue({ from });
    mocks.sendPushToCommunityFollowers.mockResolvedValueOnce(4).mockResolvedValueOnce(3);
    const { GET } = await importRoute();

    const response = await GET(createAuthorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 7,
      perspectives: 3,
      communities: 2,
    });
    expect(from).toHaveBeenCalledWith("perspectives");
    expect(perspectivesQuery.select).toHaveBeenCalledWith(
      "id, quote, community_id, topic_id, community:communities(name), topic:topics(title, slug)"
    );
    expect(perspectivesQuery.eq).toHaveBeenCalledWith("verified", true);
    expect(perspectivesQuery.gte).toHaveBeenCalledWith("created_at", expect.any(String));
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenCalledTimes(2);
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      1,
      "community-rural",
      {
        title: 'New perspective on "Water policy"',
        body: "2 new perspectives from Rural Iowa",
        url: "/compare/water-policy",
        icon: "/icons/icon-192.svg",
      }
    );
    expect(mocks.sendPushToCommunityFollowers).toHaveBeenNthCalledWith(
      2,
      "community-urban",
      {
        title: 'New perspective on "Transit funding"',
        body: "Transit riders are comparing the same issue from a city view.",
        url: "/compare/transit-funding",
        icon: "/icons/icon-192.svg",
      }
    );
  });
});
