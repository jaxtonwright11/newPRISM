import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { sendPushToCommunityFollowers } from "@/lib/send-push";
import { z } from "zod";

const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

const alertSchema = z.object({
  community_id: z.string().uuid(),
  milestone: z.string().trim().min(1).max(500),
  webhook_secret: z.string().min(1),
});

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "n8n-community-alert");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJsonBody(request, alertSchema);
  if (!parsed.success) return parsed.response;

  if (!N8N_SECRET || parsed.data.webhook_secret !== N8N_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { community_id, milestone } = parsed.data;

  // Verify community exists and get its name
  const { data: community, error } = await supabase
    .from("communities")
    .select("id, name")
    .eq("id", community_id)
    .single();

  if (error || !community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // Send push notification to all community followers
  const sent = await sendPushToCommunityFollowers(community_id, {
    title: `${community.name} milestone`,
    body: milestone,
    url: `/community/${community_id}`,
    icon: "/icons/icon-192.svg",
  });

  return NextResponse.json({
    community: community.name,
    milestone,
    push_sent: sent,
  });
}
