import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

interface QueryResult {
  data: Record<string, string>[] | null;
}

function createSitemapClient(results: Record<string, QueryResult>) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            limit() {
              return results[table] ?? { data: null };
            },
            eq() {
              return {
                limit() {
                  return results[table] ?? { data: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("sitemap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("includes one signup route and comparison routes for indexed topics", async () => {
    createClientMock.mockReturnValue(
      createSitemapClient({
        topics: {
          data: [
            {
              slug: "water-access",
              updated_at: "2026-04-01T00:00:00.000Z",
            },
            {
              slug: "transit-safety",
              updated_at: "2026-04-02T00:00:00.000Z",
            },
          ],
        },
        communities: {
          data: [
            {
              id: "community-1",
              created_at: "2026-03-01T00:00:00.000Z",
            },
          ],
        },
      })
    );

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://prism.example/topic/water-access",
        "https://prism.example/compare/water-access",
        "https://prism.example/topic/transit-safety",
        "https://prism.example/compare/transit-safety",
        "https://prism.example/community/community-1",
      ])
    );
  });

  it("falls back to static routes when Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();

    expect(createClientMock).not.toHaveBeenCalled();
    expect(routes.map((route) => route.url)).toEqual([
      "https://prism.example",
      "https://prism.example/signup",
      "https://prism.example/feed",
      "https://prism.example/discover",
      "https://prism.example/map",
      "https://prism.example/login",
    ]);
  });
});
