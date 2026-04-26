import { describe, expect, it, vi } from "vitest";

type TopicRow = { slug: string; updated_at: string };
type CommunityRow = { id: string; created_at: string };

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

function createQueryBuilder(data: unknown[]) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve({ data })),
  };
  return builder;
}

async function importSitemap() {
  vi.resetModules();
  return import("./sitemap");
}

describe("sitemap", () => {
  it("returns static routes once when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    createClientMock.mockReset();

    const { default: sitemap } = await importSitemap();
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(createClientMock).not.toHaveBeenCalled();
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(urls).toEqual([
      "https://prism.example",
      "https://prism.example/signup",
      "https://prism.example/feed",
      "https://prism.example/discover",
      "https://prism.example/map",
      "https://prism.example/login",
    ]);
  });

  it("adds compare routes for each topic alongside topic and community routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const topicRows: TopicRow[] = [
      { slug: "housing-costs", updated_at: "2026-04-20T12:00:00.000Z" },
      { slug: "transit-access", updated_at: "2026-04-21T12:00:00.000Z" },
    ];
    const communityRows: CommunityRow[] = [
      { id: "community-1", created_at: "2026-04-01T12:00:00.000Z" },
    ];
    const topicsBuilder = createQueryBuilder(topicRows);
    const communitiesBuilder = createQueryBuilder(communityRows);
    const fromMock = vi.fn((table: string) => {
      if (table === "topics") return topicsBuilder;
      if (table === "communities") return communitiesBuilder;
      throw new Error(`Unexpected table: ${table}`);
    });
    createClientMock.mockReset();
    createClientMock.mockReturnValue({ from: fromMock });

    const { default: sitemap } = await importSitemap();
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(createClientMock).toHaveBeenCalledWith("https://supabase.example", "service-role-key");
    expect(topicsBuilder.select).toHaveBeenCalledWith("slug, updated_at");
    expect(communitiesBuilder.select).toHaveBeenCalledWith("id, created_at");
    expect(urls).toContain("https://prism.example/topic/housing-costs");
    expect(urls).toContain("https://prism.example/compare/housing-costs");
    expect(urls).toContain("https://prism.example/topic/transit-access");
    expect(urls).toContain("https://prism.example/compare/transit-access");
    expect(urls).toContain("https://prism.example/community/community-1");
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(routes.find((route) => route.url === "https://prism.example/compare/housing-costs")).toMatchObject({
      changeFrequency: "daily",
      priority: 0.8,
    });
  });
});
