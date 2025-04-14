import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingResults() {
  return (
    <div className="space-y-6 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-lg border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4 items-center">
              <Skeleton className="h-12 w-12 rounded-md" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-4 w-1/2 mt-4" />
        </div>
      ))}
    </div>
  );
}
