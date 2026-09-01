import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-muted animate-pulse", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Bone className="h-6 w-48" />
          <Bone className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Bone key={i} className="h-24 rounded-xl" />)}
      </div>
      <Bone className="h-16 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Bone className="h-64 rounded-xl" />
        <Bone className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-56" />
        </div>
        <Bone className="h-9 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Bone className="h-8 w-64 rounded-lg" />
        <Bone className="h-8 w-32 rounded-lg" />
        <Bone className="h-8 w-32 rounded-lg" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="h-10 bg-muted/50 border-b border-border" />
        <div className="divide-y divide-border">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Bone className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3.5 w-40" />
                <Bone className="h-3 w-24" />
              </div>
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="h-7 w-7 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-2">
        <Bone className="h-6 w-40" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Bone key={i} className="h-20 rounded-xl" />)}
      </div>
      <Bone className="h-10 w-48 rounded-lg" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <Bone key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  );
}
