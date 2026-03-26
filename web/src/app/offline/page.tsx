import { PrismWordmark } from "@/components/prism-wordmark";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-prism-bg-base px-6 text-center">
      <div className="mb-6">
        <PrismWordmark size="lg" />
      </div>
      <h1 className="text-xl font-body font-bold text-prism-text-primary mb-2">
        You&apos;re offline
      </h1>
      <p className="text-sm text-prism-text-secondary max-w-sm">
        PRISM needs an internet connection to load live perspectives. Reconnect and try again.
      </p>
    </div>
  );
}
