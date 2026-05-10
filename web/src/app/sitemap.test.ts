import { afterEach, describe, expect, it, vi } from "vitest";

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to static routes when the Supabase URL is invalid", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");

    const { default: sitemap } = await import("./sitemap");

    await expect(sitemap()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://web-liard-psi-12.vercel.app" }),
        expect.objectContaining({ url: "https://web-liard-psi-12.vercel.app/feed" }),
      ]),
    );
  });
});
