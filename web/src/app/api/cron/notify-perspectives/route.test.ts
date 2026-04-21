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

function createAuthorizedRequest(secret: string): Request {
  return new Request("https://example.com/api/cron/notify-perspectives", {
    headers: {
      authorization: `Bearer ${secret}`,
    },
  });
}

function setupPerspectivesResult(
  perspectives:
    | Array<{
        id: string;
        quote: string;
        community_id: string;
        topic_id: string;
        community: { name: string } | Array<{ name: string }>;
        topic: { title: string | null; slug: string | null } | Array<{ title: string | null; slug: string | null }>;
      }>
    | null
) {
  const perspectivesQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
  };
  perspectivesQuery.select.mockReturnValue(perspectivesQuery);
  perspectivesQuery.eq.mockReturnValue(perspectivesQuery);
  perspectivesQuery.gte.mockResolvedValue({
    data: perspectives,
  });

  createClientMock.mockReturnValue({
    from: vi.fn((tableName: string) => {
      if (tableName !== "perspectives") {
        throw new Error(`Unexpected table queried: ${tableName}`);
      }
      return perspectivesQuery;
    }),
  });
}

describe("GET /api/cron/notify-perspectives", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns unauthorized when auth header is invalid", async () => {
    const { GET } = await import("./route");
    const request = new Request("https://example.com/api/cron/notify-perspectives");

    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns empty counters when no recent verified perspectives exist", async () => {
    setupPerspectivesResult([]);

    const { GET } = await import("./route");
    const response = await GET(createAuthorizedRequest("cron-test-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 0,
      perspectives: 0,
    });
    expect(sendPushToCommunityFollowersMock).not.toHaveBeenCalled();
  });

  it("groups by community and deep-links to compare view when topic slug exists", async () => {
    setupPerspectivesResult([
      {
        id: "p-1",
        quote: "First quote",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Portland Community" }],
        topic: [{ title: "Housing policy", slug: "housing-policy" }],
      },
      {
        id: "p-2",
        quote: "Second quote",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Portland Community" }],
        topic: [{ title: "Housing policy", slug: "housing-policy" }],
      },
      {
        id: "p-3",
        quote: "Single perspective quote",
        community_id: "community-2",
        topic_id: "topic-2",
        community: { name: "Seattle Community" },
        topic: { title: null, slug: null },
      },
    ]);

    sendPushToCommunityFollowersMock
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    const { GET } = await import("./route");
    const response = await GET(createAuthorizedRequest("cron-test-secret"));

    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledTimes(2);
    expect(sendPushToCommunityFollowersMock).toHaveBeenNthCalledWith(1, "community-1", {
      title: 'New perspective on "Housing policy"',
      body: "2 new perspectives from Portland Community",
      url: "/compare/housing-policy",
      icon: "/icons/icon-192.svg",
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenNthCalledWith(2, "community-2", {
      title: "Seattle Community shared a perspective",
      body: "Single perspective quote",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 6,
      perspectives: 3,
      communities: 2,
    });
  });
});
