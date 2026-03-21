import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

// This endpoint is called by a cron job (e.g., Vercel Cron) to delete expired stories.
// It can also be triggered manually for testing.
// Secured by a shared secret in the Authorization header.

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const now = new Date().toISOString();

    // Delete expired stories
    const { data: deleted, error } = await supabase
      .from("posts")
      .delete()
      .eq("post_type", "story")
      .lt("expires_at", now)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: "Failed to expire stories", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      expired_count: deleted?.length ?? 0,
      expired_ids: deleted?.map((d: { id: string }) => d.id) ?? [],
      checked_at: now,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal error", details: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({ status: "ok", description: "Story expiry cron endpoint" });
}
