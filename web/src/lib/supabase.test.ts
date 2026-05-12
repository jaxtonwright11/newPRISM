import { describe, expect, it } from "vitest";
import { isValidSupabaseUrl } from "./supabase";

describe("isValidSupabaseUrl", () => {
  it("accepts HTTP and HTTPS Supabase endpoints", () => {
    expect(isValidSupabaseUrl("https://example.supabase.co")).toBe(true);
    expect(isValidSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
  });

  it("rejects missing, placeholder, and non-HTTP values", () => {
    expect(isValidSupabaseUrl(undefined)).toBe(false);
    expect(isValidSupabaseUrl("your-supabase-url")).toBe(false);
    expect(isValidSupabaseUrl("ftp://example.supabase.co")).toBe(false);
  });
});
