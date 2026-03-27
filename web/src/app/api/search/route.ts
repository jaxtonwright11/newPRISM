import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit, parseQuery } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

const searchSchema = z
  .object({
    q: z.string().min(2).max(100).trim(),
  })
  .strict();

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "search");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, searchSchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const q = parsedQuery.data.q;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const searchPattern = `%${q}%`;

      // Search in parallel
      const [perspectivesRes, topicsRes, communitiesRes, usersRes] = await Promise.all([
        supabase
          .from("perspectives")
          .select("id, quote, context, category_tag, reaction_count, bookmark_count, created_at, community:communities(name, region, community_type, color_hex, verified)")
          .eq("verified", true)
          .or(`quote.ilike.${searchPattern},context.ilike.${searchPattern}`)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("topics")
          .select("*")
          .neq("status", "archived")
          .or(`title.ilike.${searchPattern},summary.ilike.${searchPattern}`)
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("communities")
          .select("*")
          .eq("active", true)
          .or(`name.ilike.${searchPattern},region.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .order("name")
          .limit(10),
        supabase
          .from("users")
          .select("id, username, display_name, avatar_url, location_text")
          .eq("ghost_mode", false)
          .or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`)
          .order("username")
          .limit(10),
      ]);

      return NextResponse.json({
        perspectives: perspectivesRes.data ?? [],
        topics: topicsRes.data ?? [],
        communities: communitiesRes.data ?? [],
        users: usersRes.data ?? [],
      });
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({
    perspectives: [],
    topics: [],
    communities: [],
    users: [],
  });
}
