import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";


export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "user-profile");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const supabase = getSupabaseWithAuth(token);
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("users")
            .select("id, username, display_name, avatar_url, email, home_community_id, ghost_mode, verification_tier, default_radius_miles, created_at, profile:user_profiles(id, bio, interests, social_links)")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            return NextResponse.json({ data });
          }
        }
      }
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({ data: null });
}
