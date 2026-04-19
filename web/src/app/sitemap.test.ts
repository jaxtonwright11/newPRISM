import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

type EnvSnapshot = Record<string, string | undefined>;

function snapshotEnv(keys: string[]): EnvSnapshot {
  return keys.reduce<EnvSnapshot>((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {});
}

function restoreEnv(snapshot: EnvSnapshot) {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = value;
  });
}

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

describe("sitemap", () => {
  let envSnapshot: EnvSnapshot;

  beforeEach(() => {
    envSnapshot = snapshotEnv(ENV_KEYS);
    createClientMock.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns static routes without supabase config and keeps signup unique", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(createClientMock).not.toHaveBeenCalled();
    expect(urls).toContain("https://prism.example/signup");
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
    expect(urls.some((url) => url.startsWith("https://prism.example/compare/"))).toBe(false);
  });

  it("adds topic compare routes from supabase topics", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const topics = [
      { slug: "climate-policy", updated_at: "2026-04-19T08:00:00.000Z" },
      { slug: "housing-costs", updated_at: "2026-04-18T08:00:00.000Z" },
    ];
    const communities = [{ id: "community-1", created_at: "2026-04-17T08:00:00.000Z" }];

    createClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === "topics") {
          return {
            select: () => ({
              limit: () => Promise.resolve({ data: topics }),
            }),
          };
        }

        if (table === "communities") {
          return {
            select: () => ({
              eq: () => ({
                limit: () => Promise.resolve({ data: communities }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    expect(createClientMock).toHaveBeenCalledWith("https://supabase.example", "service-role-key");
    expect(urls).toContain("https://prism.example/topic/climate-policy");
    expect(urls).toContain("https://prism.example/compare/climate-policy");
    expect(urls).toContain("https://prism.example/topic/housing-costs");
    expect(urls).toContain("https://prism.example/compare/housing-costs");
    expect(urls).toContain("https://prism.example/community/community-1");
    expect(urls.filter((url) => url === "https://prism.example/signup")).toHaveLength(1);
  });
});
