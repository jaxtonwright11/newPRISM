import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";
import { applyRateLimit } from "@/lib/api";

// GET: List all communities (including inactive/pending)
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "admin-communities");
  if (rateLimited) return rateLimited;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ communities: data });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

// PATCH: Approve or reject a community
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "admin-communities");
  if (rateLimited) return rateLimited;

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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (parsed.data.action === "approve") {
    const { error } = await supabase
      .from("communities")
      .update({ active: true })
      .eq("id", parsed.data.id);

    if (error) {
      return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
    }

    return NextResponse.json({ message: "Community approved" });
  }

  // Reject = delete the application
  const { error } = await supabase
    .from("communities")
    .delete()
    .eq("id", parsed.data.id)
    .eq("active", false);

  if (error) {
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }

  return NextResponse.json({ message: "Community rejected" });
}
