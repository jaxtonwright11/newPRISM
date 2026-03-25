import { NextResponse } from "next/server";
import { applyRateLimit, parseParams, slugSchema } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

import { z } from "zod";

const perspectiveIdParamsSchema = z.object({
  id: slugSchema,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-by-id");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, perspectiveIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const { id } = parsedParams.data;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("perspectives")
        .select("*, community:communities(id, name, region, community_type, color_hex, verified)")
        .eq("id", id)
        .single();

      if (!error && data) {
        return NextResponse.json({ data });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  return NextResponse.json({ error: "Perspective not found" }, { status: 404 });
}
