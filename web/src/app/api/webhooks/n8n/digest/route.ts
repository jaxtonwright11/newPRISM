import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { generateWeeklyDigest } from "@/lib/claude";
import { z } from "zod";

const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

const digestSchema = z.object({
  webhook_secret: z.string().min(1),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "n8n-digest");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, digestSchema);
  if (!parsed.success) return parsed.response;

  if (!N8N_SECRET || parsed.data.webhook_secret !== N8N_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
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

    const digest = await generateWeeklyDigest(stats);
    return NextResponse.json({ digest, stats });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate digest", details: String(err) }, { status: 500 });
  }
}
