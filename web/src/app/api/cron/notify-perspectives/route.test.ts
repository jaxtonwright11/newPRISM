import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

type PerspectiveRow = {
  id: string;
  quote: string;
  community_id: string | null;
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

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

function createAuthorizedRequest() {
  return new Request("https://example.com/api/cron/notify-perspectives", {
    headers: {
      authorization: "Bearer cron-secret",
    },
  });
}

async function loadRoute(perspectives: PerspectiveRow[]) {
  const sendPushToCommunityFollowers = vi.fn<
    (communityId: string, payload: PushPayload) => Promise<number>
  >().mockResolvedValue(1);

  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => Promise.resolve({ data: perspectives })),
  };

  const supabase = {
    from: vi.fn(() => query),
  };

  const createClient = vi.fn(() => supabase);

  vi.doMock("@supabase/supabase-js", () => ({ createClient }));
  vi.doMock("@/lib/send-push", () => ({ sendPushToCommunityFollowers }));

  const route = await import("./route");

  return { GET: route.GET, createClient, sendPushToCommunityFollowers };
}

describe("notify-perspectives cron", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("deep-links new perspective pushes to the topic comparison page", async () => {
    const { GET, sendPushToCommunityFollowers } = await loadRoute([
      {
        id: "perspective-1",
        quote: "This is the local context residents want others to understand.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Austin neighbors" }],
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
    ]);

    const response = await GET(createAuthorizedRequest());

    await expect(response.json()).resolves.toEqual({
      notified: 1,
      perspectives: 1,
      communities: 1,
    });
    expect(sendPushToCommunityFollowers).toHaveBeenCalledWith("community-1", {
      title: 'New perspective on "Transit funding"',
      body: "This is the local context residents want others to understand.",
      url: "/compare/transit-funding",
      icon: "/icons/icon-192.svg",
    });
  });

  it("falls back to the feed when a perspective has no topic slug", async () => {
    const { GET, sendPushToCommunityFollowers } = await loadRoute([
      {
        id: "perspective-1",
        quote: "The first neighborhood quote.",
        community_id: "community-1",
        topic_id: null,
        community: { name: "Rural teachers" },
        topic: null,
      },
      {
        id: "perspective-2",
        quote: "The second neighborhood quote.",
        community_id: "community-1",
        topic_id: null,
        community: { name: "Rural teachers" },
        topic: null,
      },
    ]);

    await GET(createAuthorizedRequest());

    expect(sendPushToCommunityFollowers).toHaveBeenCalledWith("community-1", {
      title: "Rural teachers shared a perspective",
      body: "2 new perspectives from Rural teachers",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });
});
