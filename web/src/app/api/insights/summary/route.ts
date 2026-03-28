import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { generateInsightSummary } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "insights-summary");
  if (rateLimited) return rateLimited;

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
