import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserSupabaseClient } from "./supabase-browser";

const supabaseModuleMock = vi.hoisted(() => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock("@supabase/supabase-js", () => supabaseModuleMock);

const originalEnv = process.env;

describe("createBrowserSupabaseClient", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("uses a local fallback URL when the configured URL is invalid", () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "yo",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };

    createBrowserSupabaseClient();

    expect(supabaseModuleMock.createClient).toHaveBeenCalledWith(
      "http://localhost:54321",
      "anon-key",
      expect.any(Object)
    );
  });

  it("uses configured credentials when the URL is valid", () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };

    createBrowserSupabaseClient();

    expect(supabaseModuleMock.createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.any(Object)
    );
  });
});
