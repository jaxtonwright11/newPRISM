import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";
import { sendPushToUser } from "@/lib/send-push";

const bodySchema = z.object({
  community_type: z.enum(["civic", "diaspora", "rural", "policy", "academic", "cultural"]),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
});

export async function POST(request: NextRequest) {
  const rl = applyRateLimit(request, "admin-bulk-notify");
  if (rl) return rl;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    // Find all communities of the specified type
    const { data: communities } = await supabase
      .from("communities")
      .select("id")
      .eq("community_type", parsed.data.community_type)
      .eq("active", true);

    if (!communities || communities.length === 0) {
      return NextResponse.json({ sent: 0, reason: "no communities of that type" });
    }

    const communityIds = communities.map((c) => c.id);

    // Find followers of those communities
    const { data: followers } = await supabase
      .from("community_follows")
      .select("user_id")
      .in("community_id", communityIds);

    if (!followers || followers.length === 0) {
      return NextResponse.json({ sent: 0, reason: "no followers" });
    }

    // Deduplicate user IDs
    const uniqueUserIds = Array.from(new Set(followers.map((f) => f.user_id)));

    let sent = 0;
    for (const userId of uniqueUserIds) {
      const count = await sendPushToUser(userId, {
        title: parsed.data.title,
        body: parsed.data.body,
        url: "/feed",
      });
      sent += count;
    }

    return NextResponse.json({ sent, targeted_users: uniqueUserIds.length, community_type: parsed.data.community_type });
  } catch (err) {
    return NextResponse.json({ error: "Failed", details: String(err) }, { status: 500 });
  }
}
