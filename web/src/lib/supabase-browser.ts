import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_CONFIG_ERROR_MESSAGE = "Supabase is not configured.";
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

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasValidSupabaseUrl(url) || !key) return null;

  return createClient(url, key, supabaseClientOptions);
}

export function supabaseConfigError(): Error {
  return new Error(SUPABASE_CONFIG_ERROR_MESSAGE);
}
