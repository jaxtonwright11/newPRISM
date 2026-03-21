import { NextResponse } from "next/server";
import { applyRateLimit, parseJsonBody, parseParams, slugSchema } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { z } from "zod";

const connectionIdParamsSchema = z.object({
  id: slugSchema,
});

const connectionUpdateBodySchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "connections-id-patch");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = parseParams(await params, connectionIdParamsSchema);
  if (!parsedParams.success) return parsedParams.response;

  const parsedBody = await parseJsonBody(request, connectionUpdateBodySchema);
  if (!parsedBody.success) return parsedBody.response;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Check server environment variables." },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { id } = parsedParams.data;
  const { status } = parsedBody.data;

  // First, verify the connection exists and the current user is the recipient
  const { data: connection, error: fetchError } = await supabase
    .from("community_connections")
    .select("id, recipient_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  if (connection.recipient_id !== user.id) {
    return NextResponse.json(
      { error: "Only the recipient can accept or decline a connection" },
      { status: 403 }
    );
  }

  if (connection.status !== "pending") {
    return NextResponse.json(
      { error: `Connection has already been ${connection.status}` },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("community_connections")
    .update({ status })
    .eq("id", id)
    .select("*, requester:users!community_connections_requester_id_fkey(id, username)")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }

  // Notify the requester when their connection is accepted
  if (status === "accepted" && updated) {
    const requesterId = (updated as Record<string, unknown>).requester_id as string;
    try {
      await supabase.from("notifications").insert({
        user_id: requesterId,
        type: "connection_accepted",
        title: "Connection accepted",
        body: "Your connection request has been accepted. You can now message each other.",
        read: false,
      });
    } catch {
      // notification failure is non-critical
    }
  }

  return NextResponse.json({ data: updated });
}
