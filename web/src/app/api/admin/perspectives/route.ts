import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";
import { z } from "zod";

const createPerspectiveSchema = z.object({
  quote: z.string().min(20, "Quote must be at least 20 characters").max(500, "Quote must be under 500 characters"),
  context: z.string().max(300).optional(),
  community_id: z.string().uuid(),
  topic_id: z.string().uuid(),
  category_tag: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "admin-perspectives");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, createPerspectiveSchema);
  if (!parsed.success) return parsed.response;

  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("perspectives")
    .insert({
      quote: parsed.data.quote,
      context: parsed.data.context ?? null,
      community_id: parsed.data.community_id,
      topic_id: parsed.data.topic_id,
      category_tag: parsed.data.category_tag ?? null,
      verified: true,
      reaction_count: 0,
      bookmark_count: 0,
    })
    .select("*, community:communities(name, region, community_type, color_hex)")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create perspective" }, { status: 500 });
  }

  // Update community perspective count on the topic if provided
  if (parsed.data.topic_id) {
    try {
      await supabase.rpc("increment_topic_counts", {
        p_topic_id: parsed.data.topic_id,
        p_community_id: parsed.data.community_id,
      });
    } catch {
      // RPC may not exist yet, non-critical
    }
  }

  return NextResponse.json({ perspective: data }, { status: 201 });
}
