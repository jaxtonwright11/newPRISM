import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBrowserSupabaseClient,
  supabaseConfigError,
} from "./supabase-browser";

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

  it("returns null when the configured URL is invalid", () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "yo",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };

    const client = createBrowserSupabaseClient();

    expect(client).toBeNull();
    expect(supabaseConfigError().message).toBe(
      "Supabase is not configured."
    );
    expect(supabaseModuleMock.createClient).not.toHaveBeenCalled();
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
