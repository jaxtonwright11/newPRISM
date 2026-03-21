import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { SEED_USER } from "@/lib/seed-data";

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
            .select("*, profile:user_profiles(*)")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            return NextResponse.json({ data });
          }
        }
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ data: SEED_USER });
}
