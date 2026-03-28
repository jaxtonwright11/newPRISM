import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushBroadcast } from "@/lib/send-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

/**
 * Daily Perspective Window — sends a push notification when a prompt goes live.
 * Called by Vercel cron at a random-ish time between 9 AM and 6 PM UTC.
 * The cron runs at noon UTC; the actual "window" is implied by the notification timing.
 * After 3 hours, the prompt is still visible but no longer "live."
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Find the current active prompt
    const { data: prompt } = await supabase
      .from("perspective_prompts")
      .select("id, prompt_text, topic:topics(title, slug)")
      .eq("active", true)
      .lte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: false })
      .limit(1)
      .single();

    if (!prompt) {
      return NextResponse.json({ sent: 0, reason: "no active prompt" });
    }

    const topic = Array.isArray(prompt.topic) ? prompt.topic[0] : prompt.topic;
    const topicName = topic?.title ?? "today's topic";

    // Count perspectives posted today for context
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("perspectives")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    const sent = await sendPushBroadcast({
      title: "A new perspective prompt is live",
      body: `Communities are posting about ${topicName} right now. ${count ?? 0} perspectives so far today.`,
      url: topic?.slug ? `/topic/${topic.slug}` : "/feed",
    });

    return NextResponse.json({ sent, prompt_id: prompt.id, topic: topicName });
  } catch (err) {
    return NextResponse.json({ error: "Failed", details: String(err) }, { status: 500 });
  }
}
