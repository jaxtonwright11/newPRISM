import { FeedSkeleton } from "@/components/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="px-4 pt-14 pb-4">
      <div className="h-8 w-40 rounded-lg bg-prism-bg-elevated animate-shimmer mb-4" />
      <div className="h-10 w-full rounded-xl bg-prism-bg-elevated animate-shimmer mb-6" />
      <div className="flex gap-2 mb-6 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-8 w-24 shrink-0 rounded-full bg-prism-bg-elevated animate-shimmer" />
        ))}
      </div>
      <FeedSkeleton count={3} />
    </div>
  );
}
