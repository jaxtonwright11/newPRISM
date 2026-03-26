import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, "community-detail");
  if (rateLimited) return rateLimited;

  const { id: rawId } = await params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
  }
  const id = parsed.data;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    // Fetch community
    const { data: community, error: commError } = await supabase
      .from("communities")
      .select("*")
      .eq("id", id)
      .single();

    if (commError || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Fetch perspectives (with topic_id) and topics in parallel
    const { data: perspectives } = await supabase
      .from("perspectives")
      .select("id, quote, context, category_tag, reaction_count, bookmark_count, created_at, topic_id, community:communities(name, region, community_type, color_hex, verified)")
      .eq("community_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Extract unique topic IDs from the perspectives we already fetched
    const topicIds = new Set<string>();
    if (perspectives) {
      for (const p of perspectives) {
        if (p.topic_id) topicIds.add(p.topic_id as string);
      }
    }

    let topics: unknown[] = [];
    if (topicIds.size > 0) {
      const { data: topicData } = await supabase
        .from("topics")
        .select("id, title, slug, summary, status, perspective_count, community_count")
        .in("id", Array.from(topicIds));
      topics = topicData ?? [];
    }

    const res = NextResponse.json({
      community,
      perspectives: (perspectives ?? []).map((p) => ({
        ...p,
        community: Array.isArray(p.community) ? p.community[0] : p.community,
      })),
      topics,
    });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
