import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

function createQuery<TData>(data: TData) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    limit: vi.fn(async () => ({ data })),
  };

  return query;
}

async function loadSitemap() {
  vi.resetModules();
  const mod = await import("./sitemap");
  return mod.default;
}

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns static routes without duplicate signup when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const sitemap = await loadSitemap();
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(urls).not.toContain("https://prism.example/compare/climate-action");
  });

  it("adds topic, compare, and active community routes from Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const topicQuery = createQuery([
      {
        slug: "climate-action",
        updated_at: "2026-04-14T10:00:00.000Z",
      },
    ]);
    const communityQuery = createQuery([
      {
        id: "community-1",
        created_at: "2026-04-13T10:00:00.000Z",
      },
    ]);
    const from = vi.fn((table: string) => {
      if (table === "topics") return topicQuery;
      if (table === "communities") return communityQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.createClient.mockReturnValue({ from });

    const sitemap = await loadSitemap();
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://supabase.example",
      "service-role-key"
    );
    expect(from).toHaveBeenCalledWith("topics");
    expect(from).toHaveBeenCalledWith("communities");
    expect(topicQuery.limit).toHaveBeenCalledWith(200);
    expect(communityQuery.eq).toHaveBeenCalledWith("active", true);
    expect(communityQuery.limit).toHaveBeenCalledWith(200);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://prism.example/topic/climate-action",
        "https://prism.example/compare/climate-action",
        "https://prism.example/community/community-1",
      ])
    );
  });
});
