import { NextResponse } from "next/server";
import { applyRateLimit, parseQuery } from "@/lib/api";
import { getBookmarkedPerspectives, getBookmarkedTopics } from "@/lib/seed-data";
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

  if (type === "topics") {
    const topics = getBookmarkedTopics();
    return NextResponse.json({ data: topics, meta: { total: topics.length } });
  }

  const perspectives = getBookmarkedPerspectives();
  return NextResponse.json({ data: perspectives, meta: { total: perspectives.length } });
}
