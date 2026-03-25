export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-prism-bg-primary px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-prism-accent-active to-prism-community-diaspora flex items-center justify-center mb-6">
        <span className="text-white font-display font-bold text-2xl">P</span>
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
