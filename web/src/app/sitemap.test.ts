import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("sitemap", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to static routes when the Supabase URL is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();

    expect(createClientMock).not.toHaveBeenCalled();
    expect(routes.some((route) => route.url.endsWith("/feed"))).toBe(true);
  });
});
