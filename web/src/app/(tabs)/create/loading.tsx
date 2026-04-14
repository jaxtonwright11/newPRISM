import { Skeleton } from "@/components/skeleton";

export default function CreateLoading() {
  return (
    <div className="px-4 pt-14 pb-4 max-w-lg mx-auto">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
