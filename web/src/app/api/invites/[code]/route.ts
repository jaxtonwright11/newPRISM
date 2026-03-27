import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: invite } = await supabase
    .from("invite_links")
    .select("id, code, community:communities(name, region, community_type)")
    .eq("code", code)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const community = Array.isArray(invite.community) ? invite.community[0] : invite.community;

  return NextResponse.json({
    valid: true,
    community_name: community?.name ?? null,
    community_region: community?.region ?? null,
  });
}
