import { FeedSkeleton } from "@/components/skeleton";

export default function FeedLoading() {
  return (
    <div className="px-4 pt-14 pb-4">
      <div className="h-8 w-48 rounded-lg bg-prism-bg-elevated animate-shimmer mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-8 w-20 rounded-full bg-prism-bg-elevated animate-shimmer" />
        <div className="h-8 w-24 rounded-full bg-prism-bg-elevated animate-shimmer" />
        <div className="h-8 w-20 rounded-full bg-prism-bg-elevated animate-shimmer" />
      </div>
      <FeedSkeleton count={4} />
    </div>
  );
}
