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

const originalEnv = { ...process.env };

type Relation<T> = T | T[] | null;
type PerspectiveRecord = {
  id: string;
  quote: string;
  community_id: string | null;
  topic_id: string | null;
  community: Relation<{ name: string }>;
  topic: Relation<{ title: string; slug: string }>;
};

function authorizedRequest() {
  return new Request("https://example.com/api/cron/notify-perspectives", {
    headers: { authorization: "Bearer cron-secret" },
  });
}

function setupEnvironment() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.CRON_SECRET = "cron-secret";
}

function setupSupabasePerspectives(perspectives: PerspectiveRecord[] | null) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.gte.mockResolvedValue({ data: perspectives });

  const fromMock = vi.fn((table: string) => {
    if (table !== "perspectives") {
      throw new Error(`Unexpected table: ${table}`);
    }
    return query;
  });

  createClientMock.mockReturnValue({ from: fromMock });

  return { fromMock, query };
}

async function importRoute() {
  vi.resetModules();
  return import("./route");
}

describe("GET /api/cron/notify-perspectives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnvironment();
    sendPushToCommunityFollowersMock.mockResolvedValue(3);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("sends one comparison deep link per community and handles array-shaped relations", async () => {
    const { query } = setupSupabasePerspectives([
      {
        id: "perspective-1",
        quote: "The morning bus is the difference between getting to work or not.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Southside Riders" }],
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
      {
        id: "perspective-2",
        quote: "When the route is late, the whole shift starts behind.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Southside Riders" }],
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      },
    ]);

    const { GET } = await importRoute();
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 3,
      perspectives: 2,
      communities: 1,
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledOnce();
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-1", {
      title: 'New perspective on "Transit funding"',
      body: "2 new perspectives from Southside Riders",
      url: "/compare/transit-funding",
      icon: "/icons/icon-192.svg",
    });
    expect(query.eq).toHaveBeenCalledWith("verified", true);
    expect(query.gte).toHaveBeenCalledWith("created_at", expect.any(String));
  });

  it("falls back to a community alert and feed deep link when a perspective has no topic", async () => {
    setupSupabasePerspectives([
      {
        id: "perspective-3",
        quote: "People need to hear what this feels like day to day.",
        community_id: "community-2",
        topic_id: null,
        community: { name: "River Ward" },
        topic: null,
      },
    ]);

    const { GET } = await importRoute();
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(200);
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-2", {
      title: "River Ward shared a perspective",
      body: "People need to hear what this feels like day to day.",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });

  it("does not create a Supabase client for invalid cron tokens", async () => {
    const { GET } = await importRoute();
    const response = await GET(
      new Request("https://example.com/api/cron/notify-perspectives", {
        headers: { authorization: "Bearer wrong-secret" },
      })
    );

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendPushToCommunityFollowersMock).not.toHaveBeenCalled();
  });

  it("does not create a Supabase client when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const { GET } = await importRoute();
    const response = await GET(authorizedRequest());

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendPushToCommunityFollowersMock).not.toHaveBeenCalled();
  });
});
