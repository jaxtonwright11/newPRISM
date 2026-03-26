"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  icon: React.ComponentType<{ filled?: boolean }>;
  isCreate?: boolean;
}

const TABS: Tab[] = [
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/feed", label: "Feed", icon: FeedIcon },
  { href: "/create", label: "", icon: PlusIcon, isCreate: true },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-[var(--bg-surface)] border-t border-[var(--bg-elevated)] safe-area-bottom md:static md:w-16 md:h-screen md:border-t-0 md:border-r"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 md:flex-col md:h-full md:justify-start md:pt-4 md:gap-6">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;

          if (tab.isCreate) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 active:scale-95 hover:scale-105 transition-all duration-200"
                role="tab"
                aria-label="Create perspective"
              >
                <Icon />
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-0.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50"
              }`}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
            >
              <Icon filled={isActive} />
              <span className="font-body font-medium text-[10px] leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MapIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={filled ? "currentColor" : "none"} />
      <circle cx="12" cy="9" r="2.5" fill={filled ? "var(--bg-surface)" : "none"} />
    </svg>
  );
}

function FeedIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={filled ? "currentColor" : "none"} />
      <line x1="7" y1="8" x2="17" y2="8" stroke={filled ? "var(--bg-surface)" : "currentColor"} />
      <line x1="7" y1="12" x2="17" y2="12" stroke={filled ? "var(--bg-surface)" : "currentColor"} />
      <line x1="7" y1="16" x2="13" y2="16" stroke={filled ? "var(--bg-surface)" : "currentColor"} />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CompassIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={filled ? "currentColor" : "none"} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={filled ? "var(--bg-surface)" : "none"} stroke={filled ? "var(--bg-surface)" : "currentColor"} />
    </svg>
  );
}

function UserIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={filled ? "currentColor" : "none"} />
      <path d="M20 21a8 8 0 0 0-16 0" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}
