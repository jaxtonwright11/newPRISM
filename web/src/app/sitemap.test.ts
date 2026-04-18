import { afterEach, describe, expect, it, vi } from "vitest";

type SitemapTopic = { slug: string; updated_at: string };
type SitemapCommunity = { id: string; created_at: string };

const originalEnv = { ...process.env };

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

async function loadSitemapModule({
  siteUrl = "https://prism.test",
  supabaseUrl,
  serviceKey,
  topics = [],
  communities = [],
}: {
  siteUrl?: string;
  supabaseUrl?: string;
  serviceKey?: string;
  topics?: SitemapTopic[];
  communities?: SitemapCommunity[];
}) {
  process.env.NEXT_PUBLIC_SITE_URL = siteUrl;

  if (supabaseUrl) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (serviceKey) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  } else {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  const topicsQuery = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: topics }),
  };
  const communitiesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: communities }),
  };

  const fromMock = vi.fn((table: string) => {
    if (table === "topics") return topicsQuery;
    if (table === "communities") return communitiesQuery;
    throw new Error(`Unexpected table queried: ${table}`);
  });

  const createClientMock = vi.fn(() => ({ from: fromMock }));
  vi.doMock("@supabase/supabase-js", () => ({
    createClient: createClientMock,
  }));

  const { default: sitemap } = await import("./sitemap");
  return { sitemap, createClientMock, fromMock };
}

describe("sitemap", () => {
  it("returns static routes only when Supabase is not configured", async () => {
    const { sitemap, createClientMock } = await loadSitemapModule({
      supabaseUrl: undefined,
      serviceKey: undefined,
    });

    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(createClientMock).not.toHaveBeenCalled();
    expect(routes).toHaveLength(6);
    expect(urls).toContain("https://prism.test/signup");
    expect(urls.filter((url) => url.endsWith("/signup"))).toHaveLength(1);
    expect(urls.some((url) => url.includes("/compare/"))).toBe(false);
  });

  it("adds topic, compare, and community routes from Supabase data", async () => {
    const topics: SitemapTopic[] = [
      { slug: "climate", updated_at: "2026-04-17T10:00:00.000Z" },
      { slug: "housing", updated_at: "2026-04-16T09:00:00.000Z" },
    ];
    const communities: SitemapCommunity[] = [
      { id: "community-1", created_at: "2026-04-15T08:00:00.000Z" },
    ];

    const { sitemap, createClientMock, fromMock } = await loadSitemapModule({
      supabaseUrl: "https://supabase.test",
      serviceKey: "service-role-key",
      topics,
      communities,
    });

    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(createClientMock).toHaveBeenCalledWith(
      "https://supabase.test",
      "service-role-key"
    );
    expect(fromMock).toHaveBeenCalledWith("topics");
    expect(fromMock).toHaveBeenCalledWith("communities");

    expect(routes).toHaveLength(11);
    expect(urls).toContain("https://prism.test/topic/climate");
    expect(urls).toContain("https://prism.test/topic/housing");
    expect(urls).toContain("https://prism.test/compare/climate");
    expect(urls).toContain("https://prism.test/compare/housing");
    expect(urls).toContain("https://prism.test/community/community-1");
    expect(urls.filter((url) => url.endsWith("/signup"))).toHaveLength(1);

    const compareRoute = routes.find(
      (route) => route.url === "https://prism.test/compare/climate"
    );
    expect(compareRoute).toBeDefined();
    expect(compareRoute?.priority).toBe(0.8);
    expect(compareRoute?.changeFrequency).toBe("daily");
    expect(compareRoute?.lastModified?.toISOString()).toBe(
      "2026-04-17T10:00:00.000Z"
    );
  });
});
