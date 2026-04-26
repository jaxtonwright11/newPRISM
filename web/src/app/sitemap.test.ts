import { afterEach, describe, expect, it, vi } from "vitest";

const supabaseModuleMock = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => supabaseModuleMock);

const originalEnv = process.env;

async function loadSitemap() {
  vi.resetModules();
  return (await import("./sitemap")).default;
}

describe("sitemap", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("falls back to static routes when Supabase URL is invalid", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "unset",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };

    const sitemap = await loadSitemap();
    const routes = await sitemap();

    expect(routes.map((route) => route.url)).toContain(
      "https://web-liard-psi-12.vercel.app/feed"
    );
    expect(supabaseModuleMock.createClient).not.toHaveBeenCalled();
  });

  it("falls back to static routes when Supabase URL is missing", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };

    const sitemap = await loadSitemap();
    const routes = await sitemap();

    expect(routes.map((route) => route.url)).toContain(
      "https://web-liard-psi-12.vercel.app/feed"
    );
    expect(supabaseModuleMock.createClient).not.toHaveBeenCalled();
  });

  it("uses Supabase when URL and service role key are configured", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };

    const from = vi.fn((table: string) => ({
      select: vi.fn(() => ({
        limit: vi.fn(() =>
          Promise.resolve({
            data:
              table === "topics"
                ? [{ slug: "housing", updated_at: "2026-04-26T00:00:00.000Z" }]
                : [],
          })
        ),
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    }));
    supabaseModuleMock.createClient.mockReturnValue({ from });

    const sitemap = await loadSitemap();
    const routes = await sitemap();

    expect(supabaseModuleMock.createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key"
    );
    expect(routes.map((route) => route.url)).toContain(
      "https://web-liard-psi-12.vercel.app/compare/housing"
    );
  });
});
