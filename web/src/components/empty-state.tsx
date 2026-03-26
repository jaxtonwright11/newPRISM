"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  heading: string;
  body: string;
  icon?: "map" | "compass" | "perspectives" | "search" | "bookmark" | "bell" | "message" | "profile";
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  map: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" strokeDasharray="4 3" />
      <circle cx="12" cy="12" r="11" strokeDasharray="2 4" opacity={0.4} />
    </svg>
  ),
  compass: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,2 14,10 12,12 10,10" fill="currentColor" opacity={0.4} />
      <polygon points="12,22 10,14 12,12 14,14" fill="currentColor" opacity={0.2} />
    </svg>
  ),
  perspectives: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <rect x="3" y="4" width="18" height="5" rx="1.5" />
      <rect x="3" y="11" width="18" height="5" rx="1.5" opacity={0.5} />
      <rect x="3" y="18" width="12" height="3" rx="1" opacity={0.25} />
    </svg>
  ),
  search: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeWidth={1.5} />
    </svg>
  ),
  bookmark: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),
  bell: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  message: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  profile: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  ),
};

export function EmptyState({
  heading,
  body,
  icon,
  ctaLabel,
  ctaHref,
  onCtaClick,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {icon && ICONS[icon] && (
        <motion.div
          className="mb-5 text-[var(--text-dim)] opacity-40"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--bg-overlay)] flex items-center justify-center">
            {ICONS[icon]}
          </div>
        </motion.div>
      )}
      <h2 className="font-display font-bold text-2xl tracking-tight text-[var(--text-primary)] mb-2">
        {heading}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] font-body max-w-xs mb-6 leading-relaxed">
        {body}
      </p>
      {ctaLabel && (ctaHref ? (
        <Link
          href={ctaHref}
          className="group px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm transition-all hover:shadow-[0_0_20px_rgba(212,149,107,0.25)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          {ctaLabel}
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      ) : onCtaClick ? (
        <button
          onClick={onCtaClick}
          className="group px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm transition-all hover:shadow-[0_0_20px_rgba(212,149,107,0.25)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          {ctaLabel}
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      ) : null)}
      {secondaryLabel && secondaryHref && (
        <Link
          href={secondaryHref}
          className="mt-3 text-sm text-[var(--text-secondary)] font-body hover:text-[var(--text-primary)] transition-colors"
        >
          {secondaryLabel}
        </Link>
      )}
    </motion.div>
  );
}

export const EMPTY_STATES = {
  feed: {
    heading: "This is where perspectives live.",
    body: "When communities share how they experience the world, their perspectives show up here. You're early — be the first voice.",
    icon: "perspectives" as const,
    ctaLabel: "Share a perspective",
    ctaHref: "/create",
    secondaryLabel: "Register a community",
    secondaryHref: "/apply",
  },
  map: {
    heading: "The map is waiting.",
    body: "Every dot on this map represents a real community sharing their perspective. Right now it's quiet — your community could be the first.",
    icon: "map" as const,
    ctaLabel: "Register a community",
    ctaHref: "/apply",
  },
  discover: {
    heading: "Nothing to discover yet.",
    body: "This is where you'll see how different communities experience the same events. Once perspectives start flowing, this becomes the most interesting feed you've ever opened.",
    icon: "compass" as const,
  },
  profile: {
    heading: "Your story starts here.",
    body: "Every perspective you share becomes part of how your community is understood. Start with one.",
    icon: "profile" as const,
    ctaLabel: "Share your first perspective",
    ctaHref: "/create",
  },
  search: {
    heading: "Search communities and topics.",
    body: "Find communities near you or explore topics people are talking about.",
    icon: "search" as const,
  },
  bookmarksPerspectives: {
    heading: "No saved perspectives.",
    body: "When you read something that shifts how you see the world, bookmark it. It'll be here.",
    icon: "bookmark" as const,
  },
  bookmarksTopics: {
    heading: "No saved topics.",
    body: "Follow topics you care about to keep up with how communities are experiencing them.",
    icon: "bookmark" as const,
  },
  notifications: {
    heading: "Nothing here yet.",
    body: "When someone reacts to your perspective or a community you follow shares something new, you'll know.",
    icon: "bell" as const,
  },
  messages: {
    heading: "No conversations yet.",
    body: "Connect with someone whose perspective changed how you see something. That's how real conversations start.",
    icon: "message" as const,
  },
  communityPerspectives: {
    heading: "No perspectives yet.",
    body: "This community hasn't shared any perspectives. If you're a member, be the first.",
    icon: "perspectives" as const,
  },
  topicPerspectives: {
    heading: "No perspectives on this topic.",
    body: "Communities haven't weighed in yet. Share how your community experiences this.",
    icon: "perspectives" as const,
    ctaLabel: "Share a perspective",
    ctaHref: "/create",
  },
} as const;
