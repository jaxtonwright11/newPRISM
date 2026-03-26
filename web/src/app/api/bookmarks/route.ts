import { NextResponse } from "next/server";
import { applyRateLimit, parseQuery } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

import { z } from "zod";

const bookmarksQuerySchema = z
  .object({
    type: z.enum(["perspectives", "topics"]).optional(),
  })
  .strict();

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "bookmarks");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, bookmarksQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const type = parsedQuery.data.type ?? "perspectives";

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
          if (type === "topics") {
            const { data, error } = await supabase
              .from("bookmarks")
              .select("id, topic:topics(id, title, slug, summary, status, perspective_count, community_count)")
              .eq("user_id", user.id)
              .not("topic_id", "is", null)
              .limit(100);

            if (!error && data) {
              const topics = data
                .map((b: Record<string, unknown>) => b.topic)
                .filter(Boolean);
              return NextResponse.json({
                data: topics,
                meta: { total: topics.length },
              });
            }
          } else {
            const { data, error } = await supabase
              .from("bookmarks")
              .select("id, perspective:perspectives(id, quote, context, category_tag, reaction_count, bookmark_count, created_at, community:communities(id, name, region, community_type, color_hex, verified))")
              .eq("user_id", user.id)
              .not("perspective_id", "is", null)
              .limit(100);

            if (!error && data) {
              const perspectives = data
                .map((b: Record<string, unknown>) => b.perspective)
                .filter(Boolean);
              return NextResponse.json({
                data: perspectives,
                meta: { total: perspectives.length },
              });
            }
          }
        }
      }
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({ data: [], meta: { total: 0 } });
}
