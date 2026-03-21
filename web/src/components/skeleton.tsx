export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-prism-bg-elevated rounded-lg animate-shimmer ${className}`}
    />
  );
}

export function PerspectiveCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-prism-border bg-prism-bg-secondary p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      {/* Quote */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      {/* Context */}
      <Skeleton className="h-3 w-3/4" />
      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <PerspectiveCardSkeleton key={i} />
      ))}
    </div>
  );
}
