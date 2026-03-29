"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-screen bg-prism-bg-base px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-prism-accent-destructive/10 flex items-center justify-center mb-4">
        <span className="text-prism-accent-destructive text-xl">!</span>
      </div>
      <h1 className="text-xl font-body font-bold text-prism-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-prism-text-secondary max-w-sm mb-6">
        An unexpected error occurred. This has been logged and we&apos;re looking into it.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-full bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-primary/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-prism-bg-surface border border-prism-border text-sm text-prism-text-secondary hover:text-prism-text-primary transition-colors"
        >
          Back to PRISM
        </Link>
      </div>
    </div>
  );
}
