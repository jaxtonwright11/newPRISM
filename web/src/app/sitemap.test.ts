import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

interface SitemapQuery {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
}

function createSitemapQuery(result: unknown): SitemapQuery {
  const chain = {} as SitemapQuery;
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  return chain;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("sitemap", () => {
  it("returns only unique static routes when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(urls).toEqual([
      "https://prism.example",
      "https://prism.example/signup",
      "https://prism.example/feed",
      "https://prism.example/discover",
      "https://prism.example/map",
      "https://prism.example/login",
    ]);
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(urls.some((url) => url.startsWith("https://prism.example/compare/"))).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("adds topic, comparison, and active community routes from Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const topicsQuery = createSitemapQuery({
      data: [
        {
          slug: "housing-costs",
          updated_at: "2026-05-10T18:30:00.000Z",
        },
      ],
    });
    const communitiesQuery = createSitemapQuery({
      data: [
        {
          id: "community-1",
          created_at: "2026-05-09T08:15:00.000Z",
        },
      ],
    });

    const from = vi.fn((table: string) => {
      if (table === "topics") return topicsQuery;
      if (table === "communities") return communitiesQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.createClient.mockReturnValue({ from });

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(topicsQuery.select).toHaveBeenCalledWith("slug, updated_at");
    expect(topicsQuery.limit).toHaveBeenCalledWith(200);
    expect(communitiesQuery.select).toHaveBeenCalledWith("id, created_at");
    expect(communitiesQuery.eq).toHaveBeenCalledWith("active", true);
    expect(communitiesQuery.limit).toHaveBeenCalledWith(200);
    expect(urls).toContain("https://prism.example/topic/housing-costs");
    expect(urls).toContain("https://prism.example/compare/housing-costs");
    expect(urls).toContain("https://prism.example/community/community-1");
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
  });
});
