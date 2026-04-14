import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { generateInsightSummary } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "insights-summary");
  if (rateLimited) return rateLimited;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const summary = await generateInsightSummary({
      topAgreementPairs: body.topAgreementPairs ?? [],
      topDivergentTopics: body.topDivergentTopics ?? [],
      risingTopics: body.risingTopics ?? [],
      geographicPatterns: body.geographicPatterns ?? [],
    });

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate summary", details: String(err) }, { status: 500 });
  }
}
