import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="px-4 pt-14 pb-4">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="flex gap-6 mb-8">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-12 w-20" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
