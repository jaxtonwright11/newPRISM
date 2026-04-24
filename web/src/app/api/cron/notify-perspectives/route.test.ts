import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const sendPushToCommunityFollowersMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/send-push", () => ({
  sendPushToCommunityFollowers: sendPushToCommunityFollowersMock,
}));

const ENV_KEYS = [
  "CRON_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const originalEnv = new Map<string, string | undefined>();

interface CommunityRecord {
  name?: string;
}

interface TopicRecord {
  slug?: string | null;
  title?: string | null;
}

interface PerspectiveRecord {
  id: string;
  quote: string;
  community_id: string | null;
  community: CommunityRecord | CommunityRecord[] | null;
  topic: TopicRecord | TopicRecord[] | null;
}

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    if (key in values) {
      process.env[key] = values[key];
      continue;
    }
    delete process.env[key];
  }
}

function createNotifyPerspectivesClient(perspectives: PerspectiveRecord[] | null) {
  return {
    from: (table: string) => {
      if (table !== "perspectives") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            gte: async () => ({ data: perspectives }),
          }),
        }),
      };
    },
  };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    if (!originalEnv.has(key)) {
      originalEnv.set(key, process.env[key]);
    }
  }
  createClientMock.mockReset();
  sendPushToCommunityFollowersMock.mockReset();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("GET /api/cron/notify-perspectives", () => {
  it("returns 401 when authorization header is missing", async () => {
    setEnv({ CRON_SECRET: "cron-secret" });
    const { GET } = await loadRoute();

    const response = await GET(new Request("https://example.com/api/cron/notify-perspectives"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase credentials are missing", async () => {
    setEnv({ CRON_SECRET: "cron-secret" });
    const { GET } = await loadRoute();

    const response = await GET(
      new Request("https://example.com/api/cron/notify-perspectives", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Not configured" });
  });

  it("groups notifications by community and deep-links to compare pages", async () => {
    setEnv({
      CRON_SECRET: "cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });
    createClientMock.mockReturnValue(
      createNotifyPerspectivesClient([
        {
          id: "persp-1",
          quote: "Prices rose quickly this season.",
          community_id: "community-a",
          community: { name: "Downtown Renters" },
          topic: { title: "Housing", slug: "housing" },
        },
        {
          id: "persp-2",
          quote: "Transit delays are affecting shifts.",
          community_id: "community-a",
          community: { name: "Downtown Renters" },
          topic: { title: "Housing", slug: "housing" },
        },
        {
          id: "persp-3",
          quote: "Childcare costs dominate our planning.",
          community_id: "community-b",
          community: [{ name: "Young Families" }],
          topic: [{ title: "Family Budgeting", slug: "family-budgeting" }],
        },
      ])
    );
    sendPushToCommunityFollowersMock
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    const { GET } = await loadRoute();

    const response = await GET(
      new Request("https://example.com/api/cron/notify-perspectives", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledTimes(2);
    expect(sendPushToCommunityFollowersMock).toHaveBeenNthCalledWith(1, "community-a", {
      title: 'New perspective on "Housing"',
      body: "2 new perspectives from Downtown Renters",
      url: "/compare/housing",
      icon: "/icons/icon-192.svg",
    });
    expect(sendPushToCommunityFollowersMock).toHaveBeenNthCalledWith(2, "community-b", {
      title: 'New perspective on "Family Budgeting"',
      body: "Childcare costs dominate our planning.",
      url: "/compare/family-budgeting",
      icon: "/icons/icon-192.svg",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notified: 3,
      perspectives: 3,
      communities: 2,
    });
  });

  it("falls back to feed URL and default title when topic data is missing", async () => {
    setEnv({
      CRON_SECRET: "cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });
    createClientMock.mockReturnValue(
      createNotifyPerspectivesClient([
        {
          id: "persp-10",
          quote: "We are still assessing local impact.",
          community_id: "community-z",
          community: null,
          topic: null,
        },
      ])
    );
    sendPushToCommunityFollowersMock.mockResolvedValue(4);
    const { GET } = await loadRoute();

    await GET(
      new Request("https://example.com/api/cron/notify-perspectives", {
        headers: { authorization: "Bearer cron-secret" },
      })
    );

    expect(sendPushToCommunityFollowersMock).toHaveBeenCalledWith("community-z", {
      title: "A community shared a perspective",
      body: "We are still assessing local impact.",
      url: "/feed",
      icon: "/icons/icon-192.svg",
    });
  });
});
