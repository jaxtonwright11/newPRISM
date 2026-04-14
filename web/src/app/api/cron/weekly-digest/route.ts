import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateWeeklyDigest } from "@/lib/claude";
import { sendDigestEmail } from "@/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Gather stats for the digest
    const [perspectivesRes, topicsRes, communitiesRes, usersRes] = await Promise.all([
      supabase
        .from("perspectives")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo),
      supabase
        .from("topics")
        .select("title")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("communities")
        .select("name")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo),
    ]);

    const stats = {
      newPerspectives: perspectivesRes.count ?? 0,
      activeTopics: (topicsRes.data ?? []).map((t) => t.title),
      topCommunities: (communitiesRes.data ?? []).map((c) => c.name),
      newUsers: usersRes.count ?? 0,
    };

    // 2. Generate the digest text
    const digest = await generateWeeklyDigest(stats);

    // 3. Find all users with email_weekly_digest enabled
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("email_weekly_digest", true);

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ sent: 0, reason: "no subscribers" });
    }

    const userIds = prefs.map((p) => p.user_id);

    // 4. Get email addresses for those users
    const { data: { users } } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    const emailMap = new Map<string, string>();
    if (users) {
      for (const u of users) {
        if (u.email && userIds.includes(u.id)) {
          emailMap.set(u.id, u.email);
        }
      }
    }

    // 5. Send digest emails
    let sent = 0;
    let failed = 0;
    for (const [, email] of emailMap) {
      const result = await sendDigestEmail(email, digest);
      if (result.success) sent++;
      else failed++;
    }

    return NextResponse.json({ sent, failed, total_subscribers: emailMap.size });
  } catch (err) {
    return NextResponse.json({ error: "Digest failed", details: String(err) }, { status: 500 });
  }
}
