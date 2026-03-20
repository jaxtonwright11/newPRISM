import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({
      profile: null,
      message: "Supabase not configured — using seed data mode",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select(
        `
        *,
        home_community:communities(id, name, region, community_type, color_hex)
      `
      )
      .eq("id", user.id)
      .single();

    if (error) throw error;

    // Fetch engagement stats
    const [reactionsResult, connectionsResult] = await Promise.all([
      supabase
        .from("perspective_reactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("connection_requests")
        .select("id", { count: "exact", head: true })
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq("status", "accepted"),
    ]);

    return NextResponse.json({
      profile: {
        ...profile,
        perspectives_read: reactionsResult.count ?? 0,
        connections_made: connectionsResult.count ?? 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch profile", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      display_name?: string;
      ghost_mode?: boolean;
      default_radius_miles?: number;
    };

    const { display_name, ghost_mode, default_radius_miles } = body;

    const updates: Record<string, unknown> = {};
    if (display_name !== undefined) {
      if (typeof display_name !== "string" || display_name.length > 100) {
        return NextResponse.json(
          { error: "display_name must be a string of 100 chars or less" },
          { status: 400 }
        );
      }
      updates.display_name = display_name;
    }
    if (ghost_mode !== undefined) {
      if (typeof ghost_mode !== "boolean") {
        return NextResponse.json(
          { error: "ghost_mode must be a boolean" },
          { status: 400 }
        );
      }
      updates.ghost_mode = ghost_mode;
    }
    if (default_radius_miles !== undefined) {
      if (![10, 20, 30, 40].includes(default_radius_miles)) {
        return NextResponse.json(
          { error: "default_radius_miles must be 10, 20, 30, or 40" },
          { status: 400 }
        );
      }
      updates.default_radius_miles = default_radius_miles;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update profile", detail: String(err) },
      { status: 500 }
    );
  }
}
