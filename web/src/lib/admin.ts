import { getSupabaseWithAuth } from "./supabase";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/**
 * Checks if the request is from an admin user.
 * Checks both ADMIN_EMAILS and ADMIN_USER_IDS env vars.
 * Returns the user object if admin, null otherwise.
 */
export async function getAdminUser(request: Request) {
  if (ADMIN_EMAILS.length === 0 && ADMIN_IDS.length === 0) return null;

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

  const emailMatch = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "");
  const idMatch = ADMIN_IDS.includes(user.id);

  if (!emailMatch && !idMatch) return null;

  return user;
}
