import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({
      connections: [],
      message: "Supabase not configured",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "accepted";

  try {
    const { data, error } = await supabase
      .from("connection_requests")
      .select(
        `
        *,
        requester:users!requester_id(id, username, display_name, home_community_id),
        recipient:users!recipient_id(id, username, display_name, home_community_id),
        topic:topics(id, title, slug)
      `
      )
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ connections: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch connections", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      recipient_id?: string;
      topic_id?: string;
      perspective_id?: string;
      intro_message?: string;
    };

    const { recipient_id, topic_id, perspective_id, intro_message } = body;

    if (!recipient_id || !topic_id || !intro_message) {
      return NextResponse.json(
        { error: "recipient_id, topic_id, and intro_message are required" },
        { status: 400 }
      );
    }

    if (intro_message.length > 500) {
      return NextResponse.json(
        { error: "Intro message cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    if (recipient_id === user.id) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    // Prevent duplicate pending requests
    const { data: existing } = await supabase
      .from("connection_requests")
      .select("id")
      .eq("requester_id", user.id)
      .eq("recipient_id", recipient_id)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A pending connection request already exists" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("connection_requests")
      .insert({
        requester_id: user.id,
        recipient_id,
        topic_id,
        perspective_id: perspective_id ?? null,
        intro_message: intro_message.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ connection: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send connection request", detail: String(err) },
      { status: 500 }
    );
  }
}
