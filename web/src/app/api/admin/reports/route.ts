import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase";
import { applyRateLimit } from "@/lib/api";

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["reviewed", "dismissed", "actioned"]),
});

export async function GET(request: NextRequest) {
  const rl = applyRateLimit(request, "admin-reports-get");
  if (rl) return rl;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }

  return NextResponse.json({ reports: data });
}

export async function PATCH(request: NextRequest) {
  const rl = applyRateLimit(request, "admin-reports-patch");
  if (rl) return rl;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, status } = parsed.data;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Report updated" });
}
