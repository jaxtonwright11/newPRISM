import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabase, getSupabaseServer, getSupabaseWithAuth } from "./supabase";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  vi.resetModules();
});

describe("Supabase client helpers", () => {
  it("treat malformed Supabase URLs as unconfigured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(getSupabase()).toBeNull();
    expect(getSupabaseServer()).toBeNull();
    expect(getSupabaseWithAuth("token")).toBeNull();
  });
});
