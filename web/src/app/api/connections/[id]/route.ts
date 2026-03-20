import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

interface Params {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: Params) {
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
    const body = await request.json() as { status?: string };
    const { status } = body;

    if (!status || !["accepted", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'accepted' or 'declined'" },
        { status: 400 }
      );
    }

    // Only the recipient can accept/decline
    const { data: connection, error: fetchError } = await supabase
      .from("community_connections")
      .select("id, recipient_id, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (connection.recipient_id !== user.id) {
      return NextResponse.json(
        { error: "Only the recipient can respond to a connection request" },
        { status: 403 }
      );
    }

    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "Connection has already been responded to" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("community_connections")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ connection: data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update connection", detail: String(err) },
      { status: 500 }
    );
  }
}
