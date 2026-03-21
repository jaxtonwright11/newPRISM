import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { SEED_MAP_PINS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "map");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getSupabase();
    if (supabase) {
      // Community pins — always visible (public data, uses anon key + RLS)
      const { data: communities, error: commError } = await supabase
        .from("communities")
        .select("*")
        .eq("active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      const communityPins = !commError && communities
        ? communities.map((c) => ({
            id: `pin-${c.id}`,
            type: "community" as const,
            latitude: c.latitude as number,
            longitude: c.longitude as number,
            color_hex: c.color_hex,
            community_type: c.community_type,
            activity_level: (["high", "medium", "low"] as const)[
              Math.floor(Math.abs(c.latitude as number) % 3)
            ],
            community: c,
          }))
        : [];

      // User post pins — EXCLUDE ghost mode users (needs service-role for users join)
      const serverClient = getSupabaseServer();
      const { data: posts } = serverClient ? await serverClient
        .from("posts")
        .select("id, latitude, longitude, post_type, content, created_at, user_id, users!inner(ghost_mode)")
        .eq("users.ghost_mode", false)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(100) : { data: null };

      const postPins = posts
        ? posts.map((p) => ({
            id: `post-${p.id}`,
            type: (p.post_type === "story" ? "story" : "post") as "post" | "story",
            latitude: p.latitude as number,
            longitude: p.longitude as number,
            color_hex: "#4A9EFF",
            community_type: "civic" as const,
            activity_level: "medium" as const,
          }))
        : [];

      return NextResponse.json({ pins: [...communityPins, ...postPins] });
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ pins: SEED_MAP_PINS });
}
