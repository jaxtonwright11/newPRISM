import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, sendPushToCommunityFollowersMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  sendPushToCommunityFollowersMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushToCommunityFollowers: sendPushToCommunityFollowersMock,
}));

type PerspectiveRow = {
  id: string;
  quote: string;
  community_id: string;
  topic_id: string | null;
  community:
    | { name: string }
    | Array<{ name: string }>
    | null;
  topic:
    | { title: string; slug: string }
    | Array<{ title: string; slug: string }>
    | null;
};

function createPerspectivesClient(rows: PerspectiveRow[]) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data: rows }),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table !== "perspectives") {
        throw new Error(`Unexpected table ${table}`);
      }

      return query;
    }),
  };

  return { client, query };
}

describe("GET /api/cron/notify-perspectives", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://prism.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    sendPushToCommunityFollowersMock.mockResolvedValue(3);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("deep-links community notifications to the comparison view when a topic slug exists", async () => {
    const { client } = createPerspectivesClient([
      {
        id: "perspective-1",
        quote: "Small businesses are feeling the bridge closure first.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Downtown Residents" }],
        topic: [{ title: "Bridge Closure", slug: "bridge-closure" }],
      },
      {
        id: "perspective-2",
        quote: "Commute patterns shifted overnight.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Downtown Residents" }],
        topic: [{ title: "Bridge Closure", slug: "bridge-closure" }],
      },
    ]);
    createClientMock.mockReturnValue(client);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://example.com/api/cron/notify-perspectives", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 3,
      perspectives: 2,
      communities: 1,
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith(
      "community-1",
      {
        title: 'New perspective on "Bridge Closure"',
        body: "2 new perspectives from Downtown Residents",
        url: "/compare/bridge-closure",
        icon: "/icons/icon-192.svg",
      }
    );
  });

  it("falls back to the feed when the perspective has no joined topic", async () => {
    const { client } = createPerspectivesClient([
      {
        id: "perspective-1",
        quote: "A topicless update should still reach followers.",
        community_id: "community-2",
        topic_id: null,
        community: { name: "River Ward" },
        topic: null,
      },
    ]);
    createClientMock.mockReturnValue(client);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://example.com/api/cron/notify-perspectives", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(response.status).toBe(200);
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith(
      "community-2",
      expect.objectContaining({
        title: "River Ward shared a perspective",
        body: "A topicless update should still reach followers.",
        url: "/feed",
      })
    );
  });
});
