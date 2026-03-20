"use client";

interface GhostModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export function GhostModeToggle({
  enabled,
  onToggle,
  compact = false,
}: GhostModeToggleProps) {
  if (compact) {
    return (
      <button
        onClick={onToggle}
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
          enabled
            ? "bg-prism-bg-elevated border border-prism-border/60 text-prism-text-dim"
            : "bg-prism-accent-active/10 border border-prism-accent-active/30 text-prism-accent-active"
        }`}
        title={enabled ? "You are hidden from the map. Tap to show your pin." : "Your pin is visible. Tap to go ghost."}
        aria-label={enabled ? "Ghost mode on — go visible" : "Go ghost"}
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          {enabled ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          )}
        </svg>
        <span className="hidden sm:inline">
          {enabled ? "Ghost" : "Visible"}
        </span>
        {enabled && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-prism-text-dim animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-prism-bg-elevated border border-prism-border">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            enabled
              ? "bg-prism-text-dim/20"
              : "bg-prism-accent-active/20"
          }`}
        >
          <svg
            className={`w-4 h-4 ${enabled ? "text-prism-text-dim" : "text-prism-accent-active"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {enabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            ) : (
              <>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </>
            )}
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-prism-text-primary">
            Ghost Mode
          </p>
          <p className="text-xs text-prism-text-dim">
            {enabled
              ? "Your pin is hidden. You can still browse and read."
              : "Your pin is visible to others on the map."}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-prism-accent-active/50 ${
          enabled ? "bg-prism-bg-primary border border-prism-border" : "bg-prism-accent-active"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-1" : "translate-x-6"
          }`}
        />
      </button>
    </div>
  );
}
