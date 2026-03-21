import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { SEED_MAP_PINS } from "@/lib/seed-data";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "map");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (!error && data) {
        const pins = data.map((c) => ({
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
        }));

        return NextResponse.json({ pins });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ pins: SEED_MAP_PINS });
}
