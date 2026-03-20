import { NextResponse } from "next/server";
import { getBookmarkedPerspectives, getBookmarkedTopics } from "@/lib/seed-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "perspectives";

  if (type === "topics") {
    const topics = getBookmarkedTopics();
    return NextResponse.json({ data: topics, meta: { total: topics.length } });
  }

  const perspectives = getBookmarkedPerspectives();
  return NextResponse.json({ data: perspectives, meta: { total: perspectives.length } });
}
