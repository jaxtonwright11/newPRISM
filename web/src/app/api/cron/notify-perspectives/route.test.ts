import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const sendPushToCommunityFollowersMock = vi.hoisted(() => vi.fn());

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
  topic_id: string;
  community: { name: string } | { name: string }[];
  topic: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

function createPerspectivesQuery(data: PerspectiveRow[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data }),
  };
}

function createRequest(secret = "cron-secret") {
  return new Request("https://prism.example/api/cron/notify-perspectives", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("notify perspectives cron", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    sendPushToCommunityFollowersMock.mockResolvedValue(2);
  });

  it("deep-links community push notifications to the comparison page for the topic", async () => {
    const perspectives: PerspectiveRow[] = [
      {
        id: "perspective-1",
        quote: "Transit feels different after dark.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: { name: "Night-shift workers" },
        topic: { title: "Transit safety", slug: "transit-safety" },
      },
    ];
    createClientMock.mockReturnValue({
      from: vi.fn(() => createPerspectivesQuery(perspectives)),
    });

    const { GET } = await import("./route");
    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 2,
      perspectives: 1,
      communities: 1,
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-1", {
      title: 'New perspective on "Transit safety"',
      body: "Transit feels different after dark.",
      url: "/compare/transit-safety",
      icon: "/icons/icon-192.svg",
    });
  });

  it("handles Supabase relation rows returned as arrays and only notifies each community once", async () => {
    const perspectives: PerspectiveRow[] = [
      {
        id: "perspective-1",
        quote: "The first view should not be used when multiple perspectives exist.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Coastal families" }],
        topic: [{ title: "Flood readiness", slug: "flood-readiness" }],
      },
      {
        id: "perspective-2",
        quote: "A second view from the same community.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: [{ name: "Coastal families" }],
        topic: [{ title: "Flood readiness", slug: "flood-readiness" }],
      },
    ];
    createClientMock.mockReturnValue({
      from: vi.fn(() => createPerspectivesQuery(perspectives)),
    });

    const { GET } = await import("./route");
    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      notified: 2,
      perspectives: 2,
      communities: 1,
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledTimes(1);
    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-1", {
      title: 'New perspective on "Flood readiness"',
      body: "2 new perspectives from Coastal families",
      url: "/compare/flood-readiness",
      icon: "/icons/icon-192.svg",
    });
  });

  it("falls back to the feed when a perspective has no topic slug", async () => {
    const perspectives: PerspectiveRow[] = [
      {
        id: "perspective-1",
        quote: "A local update without a topic.",
        community_id: "community-1",
        topic_id: "topic-1",
        community: { name: "Rural parents" },
        topic: null,
      },
    ];
    createClientMock.mockReturnValue({
      from: vi.fn(() => createPerspectivesQuery(perspectives)),
    });

    const { GET } = await import("./route");
    await GET(createRequest());

    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-1", {
      title: "Rural parents shared a perspective",
      body: "A local update without a topic.",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });
});
