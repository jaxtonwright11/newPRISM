import { NextResponse } from "next/server";
import { z } from "zod";
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

const updateSchema = z.object({
  display_name: z.string().trim().min(1).max(50).optional(),
  bio: z.string().trim().max(160).optional(),
});

export async function PATCH(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "user-profile-update");
  if (rateLimitResponse) return rateLimitResponse;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Run independent updates in parallel
  const updates: Promise<{ error: unknown }>[] = [];

  if (parsed.data.display_name !== undefined) {
    updates.push(
      Promise.resolve(
        supabase
          .from("users")
          .update({ display_name: parsed.data.display_name })
          .eq("id", user.id)
      ).then(({ error }) => ({ error }))
    );
  }

  if (parsed.data.bio !== undefined) {
    updates.push(
      Promise.resolve(
        supabase
          .from("user_profiles")
          .upsert(
            { id: user.id, bio: parsed.data.bio },
            { onConflict: "id" }
          )
      ).then(({ error }) => ({ error }))
    );
  }

  if (updates.length > 0) {
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Profile updated" });
}
