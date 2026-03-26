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
    heading: "Your neighborhood doesn't have a voice yet.",
    body: "Be the first to share a perspective from your community.",
    ctaLabel: "Share a perspective",
    ctaHref: "/create",
  },
  feedFoundingVoice: {
    heading: "You're a founding voice.",
    body: "You're one of the first people on PRISM here. Everything you post becomes the foundation.",
  },
  map: {
    heading: "You're here.",
    body: "No perspectives from this area yet. Be the first to share what your community is experiencing.",
    ctaLabel: "Share a perspective",
    ctaHref: "/create",
  },
  discover: {
    heading: "PRISM is just getting started.",
    body: "Communities across the country are beginning to share their perspectives. Check back soon.",
  },
  profile: {
    heading: "Your perspective matters.",
    body: "Everything you share here becomes part of your community's story.",
    ctaLabel: "Share your first perspective",
    ctaHref: "/create",
  },
} as const;
