import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null | undefined;

/**
 * Returns a lazily-initialised Supabase client when valid credentials
 * are configured, or null when running with seed/mock data only.
 * Lazy init avoids build-time crashes when env vars are absent.
 */
export function getSupabase(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  _client = url.startsWith("http") && key ? createClient(url, key) : null;
  return _client;
}

/** Convenience re-export — returns client or null. */
export const supabase = typeof window === "undefined" ? null : getSupabase();
