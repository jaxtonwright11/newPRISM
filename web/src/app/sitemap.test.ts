import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

interface TopicRow {
  slug: string;
  updated_at: string;
}

interface CommunityRow {
  id: string;
  created_at: string;
}

const ORIGINAL_ENV = process.env;

function mockSupabaseResponses(topics: TopicRow[], communities: CommunityRow[]): void {
  const topicsLimitMock = vi.fn().mockResolvedValue({ data: topics });
  const communitiesLimitMock = vi.fn().mockResolvedValue({ data: communities });

  const topicsQuery = {
    select: vi.fn().mockReturnValue({
      limit: topicsLimitMock,
    }),
  };

  const communitiesQuery = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: communitiesLimitMock,
      }),
    }),
  };

  createClientMock.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "topics") return topicsQuery;
      if (table === "communities") return communitiesQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  });
}

describe("sitemap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns static routes when Supabase credentials are missing", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const sitemap = (await import("./sitemap")).default;
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(createClientMock).not.toHaveBeenCalled();
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(
      urls.some((url) => url.startsWith("https://prism.example/compare/")),
    ).toBe(false);
  });

  it("adds topic, comparison, and community routes from Supabase", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    mockSupabaseResponses(
      [{ slug: "city-housing", updated_at: "2026-04-20T08:00:00.000Z" }],
      [{ id: "comm-1", created_at: "2026-04-18T10:30:00.000Z" }],
    );

    const sitemap = (await import("./sitemap")).default;
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(createClientMock).toHaveBeenCalledWith(
      "https://supabase.example",
      "service-role-key",
    );
    expect(urls).toContain("https://prism.example/topic/city-housing");
    expect(urls).toContain("https://prism.example/compare/city-housing");
    expect(urls).toContain("https://prism.example/community/comm-1");
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
  });
});
