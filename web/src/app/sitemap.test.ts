import { afterEach, describe, expect, it, vi } from "vitest";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  vi.resetModules();
});

describe("sitemap", () => {
  it("falls back to static routes when Supabase URL is malformed", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { default: sitemap } = await import("./sitemap");
    const routes = await sitemap();

    expect(routes.map((route) => route.url)).toEqual([
      "https://web-liard-psi-12.vercel.app",
      "https://web-liard-psi-12.vercel.app/signup",
      "https://web-liard-psi-12.vercel.app/feed",
      "https://web-liard-psi-12.vercel.app/discover",
      "https://web-liard-psi-12.vercel.app/map",
      "https://web-liard-psi-12.vercel.app/login",
    ]);
  });
});
