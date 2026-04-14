export default function MapLoading() {
  return (
    <div className="relative w-full h-screen bg-prism-bg-base">
      {/* Map skeleton */}
      <div className="absolute inset-0 bg-prism-bg-surface animate-shimmer" />
      {/* Topic bar skeleton */}
      <div className="absolute top-14 left-4 right-4 z-10">
        <div className="flex gap-2 overflow-hidden">
          <div className="h-8 w-28 rounded-full bg-prism-bg-elevated/80 animate-shimmer shrink-0" />
          <div className="h-8 w-24 rounded-full bg-prism-bg-elevated/80 animate-shimmer shrink-0" />
          <div className="h-8 w-32 rounded-full bg-prism-bg-elevated/80 animate-shimmer shrink-0" />
        </div>
      </div>
    </div>
  );
}
