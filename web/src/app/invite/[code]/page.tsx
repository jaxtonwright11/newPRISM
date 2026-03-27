"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PrismWordmark } from "@/components/prism-wordmark";
import Link from "next/link";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate invite code and get community info
    fetch(`/api/invites/${code}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.community_name) {
          setCommunityName(data.community_name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-32 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent-primary)]/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <PrismWordmark size="lg" />

        <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mt-6 mb-2">
          {communityName
            ? `You\u2019ve been invited to join ${communityName} on PRISM`
            : "You\u2019ve been invited to PRISM"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-body mb-8">
          See how communities experience the same events. Geographic perspectives, visualized.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={`/signup?invite=${code}`}
            className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all text-center"
          >
            Create an account
          </Link>
          <Link
            href={`/login?invite=${code}`}
            className="w-full py-3 rounded-xl border border-[var(--bg-elevated)] text-[var(--text-secondary)] font-body text-sm hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/30 transition-all text-center"
          >
            I already have an account
          </Link>
          <button
            onClick={() => router.push("/")}
            className="mt-2 text-xs text-[var(--text-dim)] font-body hover:text-[var(--text-secondary)] transition-colors"
          >
            Explore without signing up
          </button>
        </div>
      </div>
    </div>
  );
}
