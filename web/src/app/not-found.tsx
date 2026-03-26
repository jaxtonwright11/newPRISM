import Link from "next/link";
import { PrismWordmark } from "@/components/prism-wordmark";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-prism-bg-base px-6 text-center">
      <div className="mb-6">
        <PrismWordmark size="lg" />
      </div>
      <h1 className="text-xl font-body font-bold text-prism-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-sm text-prism-text-secondary max-w-sm mb-6">
        This perspective doesn&apos;t exist yet. Head back to the map and keep exploring.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-full bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-primary/90 transition-colors"
      >
        Back to PRISM
      </Link>
    </div>
  );
}
