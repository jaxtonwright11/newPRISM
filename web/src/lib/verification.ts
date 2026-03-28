import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a user qualifies for auto-promotion to Level 2.
 * Criteria: 10+ perspectives posted AND account 30+ days old.
 * Call this after each perspective creation.
 */
export async function checkAutoPromotion(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ promoted: boolean; newLevel: number }> {
  // Get current level and account age
  const { data: user } = await supabase
    .from("users")
    .select("verification_level, created_at")
    .eq("id", userId)
    .single();

  if (!user || user.verification_level >= 2) {
    return { promoted: false, newLevel: user?.verification_level ?? 1 };
  }

  // Check account age (30 days)
  const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (accountAgeMs < thirtyDaysMs) {
    return { promoted: false, newLevel: 1 };
  }

  // Count perspectives by this user
  const { count } = await supabase
    .from("perspectives")
    .select("id", { count: "exact", head: true })
    .eq("contributor_user_id", userId);

  if (!count || count < 10) {
    return { promoted: false, newLevel: 1 };
  }

  // Auto-promote to Level 2
  const { error } = await supabase
    .from("users")
    .update({ verification_level: 2, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { promoted: false, newLevel: 1 };
  }

  // Send notification about promotion
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "verification_advance",
    title: "Verification Level Up!",
    body: "You've been promoted to Level 2. You can now create posts and appear on the map.",
  });

  return { promoted: true, newLevel: 2 };
}

/**
 * Admin: promote a user to Level 3 (verified contributor).
 * Level 2 → 3 requires: 50+ perspectives + admin approval.
 */
export async function adminPromoteToLevel3(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: user } = await supabase
    .from("users")
    .select("verification_level")
    .eq("id", userId)
    .single();

  if (!user) return { success: false, error: "User not found" };
  if (user.verification_level >= 3) return { success: false, error: "Already Level 3" };
  if (user.verification_level < 2) return { success: false, error: "User must be Level 2 first" };

  const { error } = await supabase
    .from("users")
    .update({ verification_level: 3, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  // Update any pending contributor applications to approved
  await supabase
    .from("contributors")
    .update({ verified: true, verification_status: "approved" })
    .eq("user_id", userId)
    .eq("verification_status", "pending");

  // Notify the user
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "verification_advance",
    title: "Level 3 Verified!",
    body: "You are now a verified contributor. Your perspectives carry a verified badge.",
  });

  return { success: true };
}
