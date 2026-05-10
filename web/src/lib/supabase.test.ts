import { afterEach, describe, expect, it, vi } from "vitest";

describe("Supabase client helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treat invalid Supabase URLs as unconfigured", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");

    const { getSupabase, getSupabaseServer, getSupabaseWithAuth } = await import("./supabase");

    expect(getSupabase()).toBeNull();
    expect(getSupabaseServer()).toBeNull();
    expect(getSupabaseWithAuth("access-token")).toBeNull();
  });
});
