import { createClient, SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "http://localhost:54321";
const FALLBACK_SUPABASE_ANON_KEY = "prism-local-anon-key";
const supabaseClientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    debug: false,
  },
};

function hasValidSupabaseUrl(url: string | undefined): url is string {
  return url?.startsWith("http://") === true || url?.startsWith("https://") === true;
}

export function createBrowserSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createClient(
    hasValidSupabaseUrl(url) ? url : FALLBACK_SUPABASE_URL,
    key || FALLBACK_SUPABASE_ANON_KEY,
    supabaseClientOptions
  );
}
