import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { checkRateLimit, getIpKey } from "@/lib/rate-limit";

const VALID_REACTIONS = ["i_see_this", "i_didnt_know_this", "i_agree"] as const;
type ReactionType = (typeof VALID_REACTIONS)[number];

export async function POST(request: NextRequest) {
  // Rate limit: 30 reactions per minute per IP
  const ip = getIpKey(request);
  const { allowed, remaining } = checkRateLimit(`reactions:${ip}`, {
    windowMs: 60_000,
    max: 30,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — slow down" },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": String(remaining) },
      }
    );
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    // Optimistic update — accepted but not persisted
    return NextResponse.json({ success: true, persisted: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      perspective_id?: string;
      reaction_type?: string;
    };

    const { perspective_id, reaction_type } = body;

    if (!perspective_id || !reaction_type) {
      return NextResponse.json(
        { error: "perspective_id and reaction_type are required" },
        { status: 400 }
      );
    }

    if (!VALID_REACTIONS.includes(reaction_type as ReactionType)) {
      return NextResponse.json(
        { error: `reaction_type must be one of: ${VALID_REACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Upsert the reaction (toggle: same type = delete, different type = update)
    const { data: existing } = await supabase
      .from("perspective_reactions")
      .select("id, reaction_type")
      .eq("user_id", user.id)
      .eq("perspective_id", perspective_id)
      .single();

    if (existing && existing.reaction_type === reaction_type) {
      // Toggle off
      await supabase
        .from("perspective_reactions")
        .delete()
        .eq("id", existing.id);
      return NextResponse.json({ action: "removed", reaction_type });
    }

    await supabase
      .from("perspective_reactions")
      .upsert(
        {
          user_id: user.id,
          perspective_id,
          reaction_type,
        },
        { onConflict: "user_id,perspective_id" }
      );

    return NextResponse.json({
      action: existing ? "changed" : "added",
      reaction_type,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update reaction", detail: String(err) },
      { status: 500 }
    );
  }
}
