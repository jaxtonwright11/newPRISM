import { getSupabaseWithAuth } from "./supabase";

/**
 * Checks if the request is from an admin user.
 * Admin emails are configured via ADMIN_EMAILS env var (comma-separated).
 * Returns the user object if admin, null otherwise.
 */
export async function getAdminUser(request: Request) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) return null;

  const token = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  if (!token) return null;

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) return null;

  return user;
}
