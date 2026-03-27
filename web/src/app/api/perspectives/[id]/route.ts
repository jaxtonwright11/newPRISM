import { NextResponse } from "next/server";
import { applyRateLimit, parseParams } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "perspective-by-id");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, paramsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const { id } = parsedParams.data;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("perspectives")
        .select("*, community:communities(id, name, region, community_type, color_hex, verified), topic:topics(id, title, slug)")
        .eq("id", id)
        .single();

      if (!error && data) {
        // Fire-and-forget: increment view count
        supabase.rpc("increment_perspective_views", { perspective_id: id }).then(() => {});
        return NextResponse.json({ data });
      }
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({ error: "Perspective not found" }, { status: 404 });
}
