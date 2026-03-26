import Link from "next/link";

interface EmptyStateProps {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function EmptyState({
  heading,
  body,
  ctaLabel,
  ctaHref,
  onCtaClick,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">
        {heading}
      </h2>
      <p className="text-base text-[var(--text-secondary)] font-body max-w-sm mb-6">
        {body}
      </p>
      {ctaLabel && (ctaHref ? (
        <Link
          href={ctaHref}
          className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      ) : onCtaClick ? (
        <button
          onClick={onCtaClick}
          className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm transition-opacity hover:opacity-90"
        >
          {ctaLabel}
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
    </div>
  );
}

export const EMPTY_STATES = {
  feed: {
    heading: "This is where perspectives live.",
    body: "When communities share how they experience the world, their perspectives show up here. You're early — be the first voice.",
    ctaLabel: "Share a perspective",
    ctaHref: "/create",
    secondaryLabel: "Register a community",
    secondaryHref: "/apply",
  },
  map: {
    heading: "The map is waiting.",
    body: "Every dot on this map represents a real community sharing their perspective. Right now it's quiet — your community could be the first.",
    ctaLabel: "Register a community",
    ctaHref: "/apply",
  },
  discover: {
    heading: "Nothing to discover yet.",
    body: "This is where you'll see how different communities experience the same events. Once perspectives start flowing, this becomes the most interesting feed you've ever opened.",
  },
  profile: {
    heading: "Your story starts here.",
    body: "Every perspective you share becomes part of how your community is understood. Start with one.",
    ctaLabel: "Share your first perspective",
    ctaHref: "/create",
  },
  search: {
    heading: "Search communities and topics.",
    body: "Find communities near you or explore topics people are talking about.",
  },
  bookmarksPerspectives: {
    heading: "No saved perspectives.",
    body: "When you read something that shifts how you see the world, bookmark it. It'll be here.",
  },
  bookmarksTopics: {
    heading: "No saved topics.",
    body: "Follow topics you care about to keep up with how communities are experiencing them.",
  },
  notifications: {
    heading: "Nothing here yet.",
    body: "When someone reacts to your perspective or a community you follow shares something new, you'll know.",
  },
  messages: {
    heading: "No conversations yet.",
    body: "Connect with someone whose perspective changed how you see something. That's how real conversations start.",
  },
  communityPerspectives: {
    heading: "No perspectives yet.",
    body: "This community hasn't shared any perspectives. If you're a member, be the first.",
  },
  topicPerspectives: {
    heading: "No perspectives on this topic.",
    body: "Communities haven't weighed in yet. Share how your community experiences this.",
    ctaLabel: "Share a perspective",
    ctaHref: "/create",
  },
} as const;
