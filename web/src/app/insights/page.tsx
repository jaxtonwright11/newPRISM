"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { COMMUNITY_COLORS, REACTION_LABELS } from "@/lib/constants";
import type { CommunityType, ReactionType } from "@shared/types";
import type { InsightData } from "@/app/api/insights/route";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function ShareButton({ title, subtitle, stat }: { title: string; subtitle: string; stat?: string }) {
  const ogUrl = `${SITE_URL}/api/og/insight?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}${stat ? `&stat=${encodeURIComponent(stat)}` : ""}`;

  async function handleShare() {
    const shareUrl = `${SITE_URL}/insights`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `PRISM Insight: ${title}`, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-[10px] text-prism-text-dim hover:text-prism-accent-primary transition-colors flex items-center gap-1"
      title={`OG image: ${ogUrl}`}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </button>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((data) => setInsights(data.insights ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateSummary = useCallback(async () => {
    if (!insights) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch("/api/insights/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topAgreementPairs: insights.agreementMatrix.flatMap((a) =>
            a.pairs.map((p) => `${p.types.join(" & ")} agree ${p.agreement_pct}% on "${a.topic}"`)
          ),
          topDivergentTopics: insights.diversityScores.map((d) => `${d.topic} (${d.community_type_count} community types)`),
          risingTopics: insights.risingTopics.map((r) => `${r.topic} (+${r.growth_pct}%)`),
          geographicPatterns: insights.geographicFaults.map((f) =>
            `On "${f.topic}": coastal communities feel ${f.coastal_sentiment}, rural communities feel ${f.rural_sentiment}`
          ),
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary ?? null);
    } catch {
      setAiSummary("Unable to generate summary at this time.");
    } finally {
      setGeneratingSummary(false);
    }
  }, [insights]);

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 bg-prism-bg-elevated rounded-full w-1/3 animate-shimmer" />
          <div className="h-4 bg-prism-bg-elevated rounded-full w-1/2 animate-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-prism-bg-elevated rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasData = insights && (
    insights.agreementMatrix.length > 0 ||
    insights.diversityScores.length > 0 ||
    insights.geographicFaults.length > 0 ||
    insights.risingTopics.length > 0
  );

  return (
    <div className="min-h-screen bg-prism-bg-base">
      {/* Header */}
      <header className="border-b border-prism-border bg-prism-bg-surface p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/discover" className="p-1.5 rounded-lg bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-primary transition-colors" aria-label="Back">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <svg className="w-5 h-5 text-prism-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h1 className="font-body text-xl md:text-2xl font-bold text-prism-text-primary mb-1">
            Insights
          </h1>
          <p className="text-sm text-prism-text-secondary">
            Patterns in how communities experience the world differently
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {!hasData ? (
          <div className="text-center py-16">
            <p className="text-prism-text-dim text-sm">Not enough data yet to generate insights. Check back as communities contribute perspectives.</p>
          </div>
        ) : (
          <>
            {/* AI Summary */}
            <div className="mb-6 bg-prism-bg-surface rounded-xl border border-prism-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-prism-accent-primary uppercase tracking-wider">
                  AI Summary
                </span>
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="text-[11px] px-3 py-1 rounded-full border border-prism-border text-prism-text-secondary hover:text-prism-accent-primary hover:border-prism-accent-primary/30 transition-all disabled:opacity-50"
                >
                  {generatingSummary ? "Generating..." : aiSummary ? "Regenerate" : "Generate Insight Summary"}
                </button>
              </div>
              {aiSummary ? (
                <p className="text-sm text-prism-text-primary leading-relaxed">{aiSummary}</p>
              ) : (
                <p className="text-xs text-prism-text-dim">Click the button to have Claude analyze this week&apos;s patterns.</p>
              )}
            </div>

            {/* Insight cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Community Agreement Map */}
              {insights!.agreementMatrix.length > 0 && (
                <div className="bg-prism-bg-surface rounded-xl border border-prism-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-prism-text-primary">Community Agreement Map</h3>
                    <ShareButton title="Community Agreement Map" subtitle="Which community types agree most on top topics" />
                  </div>
                  <p className="text-[10px] text-prism-text-dim mb-3">Which community types agree most on the top topics</p>
                  <div className="space-y-3">
                    {insights!.agreementMatrix.map((item) => (
                      <div key={item.topic_id}>
                        <Link href={`/topic/${item.topic_id}`} className="text-xs font-medium text-prism-accent-primary hover:underline">
                          {item.topic}
                        </Link>
                        <div className="mt-1.5 space-y-1">
                          {item.pairs.map((pair, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-prism-bg-base rounded-full overflow-hidden">
                                <div className="h-full bg-prism-accent-live/60 rounded-full" style={{ width: `${pair.agreement_pct}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-prism-text-dim w-8 text-right">{pair.agreement_pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Perspective Diversity Score */}
              {insights!.diversityScores.length > 0 && (
                <div className="bg-prism-bg-surface rounded-xl border border-prism-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-prism-text-primary">Perspective Diversity Score</h3>
                    <ShareButton title="Perspective Diversity Score" subtitle="Topics with the highest variance in community perspectives" />
                  </div>
                  <p className="text-[10px] text-prism-text-dim mb-3">Topics generating the most diverse community responses</p>
                  <div className="space-y-2.5">
                    {insights!.diversityScores.map((d) => (
                      <div key={d.topic_id} className="flex items-center gap-3">
                        <Link href={`/topic/${d.slug}`} className="text-xs text-prism-text-primary hover:text-prism-accent-primary transition-colors flex-1 truncate">
                          {d.topic}
                        </Link>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(d.community_type_count, 6) }).map((_, i) => {
                              const types: CommunityType[] = ["civic", "diaspora", "rural", "policy", "academic", "cultural"];
                              return (
                                <span
                                  key={i}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: COMMUNITY_COLORS[types[i]] }}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[10px] font-mono text-prism-accent-primary font-bold">
                            {d.diversity_score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic Fault Lines */}
              {insights!.geographicFaults.length > 0 && (
                <div className="bg-prism-bg-surface rounded-xl border border-prism-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-prism-text-primary">Geographic Fault Lines</h3>
                    <ShareButton title="Geographic Fault Lines" subtitle="Topics where coastal and rural communities diverge" />
                  </div>
                  <p className="text-[10px] text-prism-text-dim mb-3">Topics where urban/coastal and rural communities see things differently</p>
                  <div className="space-y-3">
                    {insights!.geographicFaults.map((f) => (
                      <div key={f.topic_id} className="bg-prism-bg-base/50 rounded-lg p-2.5">
                        <span className="text-xs font-medium text-prism-text-primary block mb-1.5">{f.topic}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-prism-text-dim uppercase">Urban:</span>
                            <span className="text-[10px] font-medium" style={{ color: f.coastal_sentiment in REACTION_LABELS ? (f.coastal_sentiment === "this_resonates" ? "#4ADE80" : f.coastal_sentiment === "seeing_differently" ? "#F59E0B" : "#3B82F6") : "#9CA3AF" }}>
                              {REACTION_LABELS[f.coastal_sentiment as ReactionType]?.label ?? f.coastal_sentiment}
                            </span>
                          </div>
                          <span className="text-prism-text-dim text-[10px]">vs</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-prism-text-dim uppercase">Rural:</span>
                            <span className="text-[10px] font-medium" style={{ color: f.rural_sentiment in REACTION_LABELS ? (f.rural_sentiment === "this_resonates" ? "#4ADE80" : f.rural_sentiment === "seeing_differently" ? "#F59E0B" : "#3B82F6") : "#9CA3AF" }}>
                              {REACTION_LABELS[f.rural_sentiment as ReactionType]?.label ?? f.rural_sentiment}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rising Topics */}
              {insights!.risingTopics.length > 0 && (
                <div className="bg-prism-bg-surface rounded-xl border border-prism-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-prism-text-primary">Rising Topics</h3>
                    <ShareButton title="Rising Topics" subtitle="Topics gaining perspective volume fastest this week" />
                  </div>
                  <p className="text-[10px] text-prism-text-dim mb-3">Topics gaining perspective volume fastest this week</p>
                  <div className="space-y-2.5">
                    {insights!.risingTopics.map((r) => (
                      <div key={r.topic_id} className="flex items-center gap-3">
                        <Link href={`/topic/${r.slug}`} className="text-xs text-prism-text-primary hover:text-prism-accent-primary transition-colors flex-1 truncate">
                          {r.topic}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-prism-text-dim">
                            {r.this_week} this wk
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${r.growth_pct > 0 ? "text-prism-accent-live" : "text-prism-text-dim"}`}>
                            {r.growth_pct > 0 ? "+" : ""}{r.growth_pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
