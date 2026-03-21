import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

// Level 1 → 2: location verification (user sets home community)
const level2Schema = z.object({
  action: z.literal("upgrade_to_level_2"),
  community_id: z.string().uuid(),
  location_context: z.string().trim().min(1).max(500),
});

// Level 2 → 3: contributor application
const level3Schema = z.object({
  action: z.literal("apply_for_level_3"),
  community_id: z.string().uuid(),
  application_message: z.string().trim().min(20).max(2000),
});

const bodySchema = z.discriminatedUnion("action", [level2Schema, level3Schema]);

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "user-verify");
  if (rateLimitResponse) return rateLimitResponse;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.success) return parsed.response;

  // Get current verification level
  const { data: currentUser, error: fetchError } = await supabase
    .from("users")
    .select("verification_level, home_community_id")
    .eq("id", user.id)
    .single();

  if (fetchError || !currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (parsed.data.action === "upgrade_to_level_2") {
    if (currentUser.verification_level >= 2) {
      return NextResponse.json({ error: "Already at Level 2 or above" }, { status: 400 });
    }

    // Verify the community exists
    const { data: community } = await supabase
      .from("communities")
      .select("id")
      .eq("id", parsed.data.community_id)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Upgrade to Level 2: set home community and verification level
    const { error: updateError } = await supabase
      .from("users")
      .update({
        verification_level: 2,
        home_community_id: parsed.data.community_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to upgrade", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verification_level: 2,
      message: "You are now Level 2 verified. You can create posts and appear on the map.",
    });
  }

  if (parsed.data.action === "apply_for_level_3") {
    if (currentUser.verification_level < 2) {
      return NextResponse.json(
        { error: "Must be Level 2 before applying for Level 3" },
        { status: 400 }
      );
    }

    if (currentUser.verification_level >= 3) {
      return NextResponse.json({ error: "Already at Level 3" }, { status: 400 });
    }

    // Check for existing pending application
    const { data: existing } = await supabase
      .from("contributors")
      .select("id, verification_status")
      .eq("user_id", user.id)
      .eq("community_id", parsed.data.community_id)
      .single();

    if (existing?.verification_status === "pending") {
      return NextResponse.json(
        { error: "You already have a pending application for this community" },
        { status: 400 }
      );
    }

    // Create contributor application
    const { error: insertError } = await supabase.from("contributors").insert({
      user_id: user.id,
      community_id: parsed.data.community_id,
      verified: false,
      verification_status: "pending",
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to submit application", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verification_level: 2,
      application_status: "pending",
      message: "Your contributor application has been submitted for review.",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
