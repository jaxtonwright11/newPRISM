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

/**
 * Server-side Supabase client for API routes.
 * Uses the service role key when available, falls back to anon key.
 * Returns null when Supabase is not configured.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const key = serviceKey || anonKey;

  if (!url.startsWith("http") || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
