import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const topicBookmarkBodySchema = z
  .object({
    topic_id: z.string().uuid(),
  })
  .strict();

type AuthenticatedBookmarksClient = {
  ok: true;
  supabase: NonNullable<ReturnType<typeof getSupabaseWithAuth>>;
  userId: string;
};

type AuthenticationFailure = {
  ok: false;
  response: NextResponse;
};

async function getAuthenticatedBookmarksClient(
  request: Request
): Promise<AuthenticatedBookmarksClient | AuthenticationFailure> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Service unavailable" }, { status: 503 }),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, supabase, userId: user.id };
}

// GET: List topics the current user has bookmarked
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "bookmarks-topics");
  if (rateLimited) return rateLimited;

  const auth = await getAuthenticatedBookmarksClient(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("bookmarks")
    .select(
      "id, topic:topics(id, title, slug, summary, perspective_count, community_count)"
    )
    .eq("user_id", auth.userId)
    .not("topic_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookmarked topics" },
      { status: 500 }
    );
  }

  const topics = (data ?? [])
    .map((b: Record<string, unknown>) => b.topic)
    .filter(Boolean);

  return NextResponse.json({ topics });
}

// POST: Save a topic bookmark for the current user
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "bookmarks-topics-post");
  if (rateLimited) return rateLimited;

  const parsedBody = await parseJsonBody(request, topicBookmarkBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  const auth = await getAuthenticatedBookmarksClient(request);
  if (!auth.ok) return auth.response;

  const { topic_id } = parsedBody.data;
  const { data: existingRows, error: existingError } = await auth.supabase
    .from("bookmarks")
    .select("id, topic_id, created_at")
    .eq("user_id", auth.userId)
    .eq("topic_id", topic_id)
    .limit(1);

  if (existingError) {
    return NextResponse.json(
      { error: "Failed to save bookmarked topic" },
      { status: 500 }
    );
  }

  const existingBookmark = existingRows?.[0];
  if (existingBookmark) {
    return NextResponse.json({ data: existingBookmark });
  }

  const { data, error } = await auth.supabase
    .from("bookmarks")
    .insert({
      user_id: auth.userId,
      topic_id,
    })
    .select("id, topic_id, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save bookmarked topic" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

// DELETE: Remove a topic bookmark for the current user
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "bookmarks-topics-delete");
  if (rateLimited) return rateLimited;

  const parsedBody = await parseJsonBody(request, topicBookmarkBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  const auth = await getAuthenticatedBookmarksClient(request);
  if (!auth.ok) return auth.response;

  const { error } = await auth.supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", auth.userId)
    .eq("topic_id", parsedBody.data.topic_id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove bookmarked topic" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
