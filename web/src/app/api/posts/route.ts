import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody, slugSchema } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const postCreateBodySchema = z.object({
  content: z.string().trim().min(1).max(1000),
  topic_id: slugSchema.optional().nullable(),
  community_id: slugSchema.optional(),
  post_type: z.enum(["permanent", "story"]).optional(),
  radius_miles: z.number().positive().max(500).optional(),
});

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "posts-get");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getSupabaseWithAuth(
      request.headers.get("authorization")?.replace("Bearer ", "") ?? ""
    );
    if (supabase) {
      // Filter out posts from ghost mode users at DB level
      const { data, error } = await supabase
        .from("posts")
        .select("*, users!inner(ghost_mode, username, display_name)")
        .eq("users.ghost_mode", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        return NextResponse.json({
          data,
          meta: { total: data.length, page: 1, limit: 20 },
        });
      }
    }
  } catch {
    // fall through
  }

  return NextResponse.json({
    data: [],
    meta: { total: 0, page: 1, limit: 20 },
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "posts-post");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedBody = await parseJsonBody(request, postCreateBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Check server environment variables." },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const {
    content,
    topic_id = null,
    community_id,
    post_type = "permanent",
    radius_miles = 40,
  } = parsedBody.data;

  // Look up approximate lat/lng from the user's home community
  let latitude: number | null = null;
  let longitude: number | null = null;

  const { data: profile } = await supabase
    .from("users")
    .select("home_community_id")
    .eq("id", user.id)
    .single();

  if (profile?.home_community_id) {
    const { data: community } = await supabase
      .from("communities")
      .select("latitude, longitude")
      .eq("id", profile.home_community_id)
      .single();

    if (community) {
      latitude = community.latitude;
      longitude = community.longitude;
    }
  }

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    content,
    topic_id,
    community_id: community_id ?? profile?.home_community_id ?? null,
    post_type,
    radius_miles,
    latitude,
    longitude,
  };

  if (post_type === "story") {
    // expires_at = now + 24 hours
    insertPayload.expires_at = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
