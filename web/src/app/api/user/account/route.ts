import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth, getSupabaseServer } from "@/lib/supabase";

export async function DELETE(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "account-delete");
  if (rateLimitResponse) return rateLimitResponse;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Verify the user is who they say they are
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = getSupabaseServer();
  if (!serviceClient) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Delete from public.users first — CASCADE handles all child rows
  // (posts, reactions, bookmarks, notifications, contributors, etc.)
  const { error: deleteUserError } = await serviceClient
    .from("users")
    .delete()
    .eq("id", user.id);

  if (deleteUserError) {
    console.error("Failed to delete user data:", deleteUserError);
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }

  // Also clean up user_profiles (references auth.users, not public.users in some schemas)
  await serviceClient.from("user_profiles").delete().eq("id", user.id);

  // Clean up community_follows if it exists
  await serviceClient.from("community_follows").delete().eq("user_id", user.id);

  // Clean up push subscriptions and notification preferences
  await serviceClient.from("push_subscriptions").delete().eq("user_id", user.id);
  await serviceClient.from("notification_preferences").delete().eq("user_id", user.id);

  // Finally, delete the auth.users entry via admin API
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    console.error("Failed to delete auth user:", authDeleteError);
    // Data is already gone — log but don't fail the request
  }

  return NextResponse.json({ success: true });
}
