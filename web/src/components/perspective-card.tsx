"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Perspective, ReactionType } from "../../../shared/types";

const COMMUNITY_TYPE_COLORS: Record<string, string> = {
  civic: "#4A9EFF",
  diaspora: "#F59E0B",
  rural: "#22C55E",
  policy: "#A855F7",
  academic: "#EC4899",
  cultural: "#F97316",
};

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "i_see_this", emoji: "👁", label: "I see this" },
  { type: "i_didnt_know_this", emoji: "💡", label: "I didn't know this" },
  { type: "i_agree", emoji: "🤝", label: "I agree" },
];

interface PerspectiveCardProps {
  perspective: Perspective;
}

export function PerspectiveCard({ perspective }: PerspectiveCardProps) {
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const community = perspective.community;
  const borderColor = community
    ? COMMUNITY_TYPE_COLORS[community.community_type] ?? "#666"
    : "#666";

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <CardContent className="p-4">
        {community && (
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: borderColor }}
            />
            <span className="text-xs font-medium text-foreground">
              {community.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {community.region}
            </span>
            {community.verified && (
              <span className="text-xs text-blue-400">✓</span>
            )}
          </div>
        )}

        <blockquote className="text-sm italic font-serif leading-relaxed text-foreground/90 mb-3">
          &ldquo;{perspective.quote}&rdquo;
        </blockquote>

        {perspective.context && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {perspective.context}
          </p>
        )}

        {perspective.category_tag && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground mb-3">
            {perspective.category_tag}
          </span>
        )}

        <div className="flex items-center gap-1 pt-2 border-t border-border">
          {REACTIONS.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => setActiveReaction(activeReaction === type ? null : type)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                activeReaction === type
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
              title={label}
            >
              <span>{emoji}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
