import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null | undefined;

function hasValidSupabaseUrl(url: string | undefined): url is string {
  return url?.startsWith("http://") === true || url?.startsWith("https://") === true;
}

/**
 * Returns a lazily-initialised Supabase client when valid credentials
 * are configured, or null when running with no Supabase configured.
 * Lazy init avoids build-time crashes when env vars are absent.
 */
export function getSupabase(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  _client = hasValidSupabaseUrl(url) && key ? createClient(url, key) : null;
  return _client;
}

/**
 * Returns a Supabase client using the service role key for server-side
 * operations that don't need user auth context (e.g. admin tasks).
 */
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasValidSupabaseUrl(url) || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns a Supabase client scoped to a specific user's access token.
 * Use this in API routes where you need to act on behalf of the user.
 */
export function getSupabaseWithAuth(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasValidSupabaseUrl(url) || !anonKey) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Convenience re-export — returns client or null. */
export const supabase = typeof window === "undefined" ? null : getSupabase();
