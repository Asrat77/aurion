export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 flex flex-col">
      <Skeleton className="w-full aspect-[4/3] rounded-2xl mb-4" />
      <Skeleton className="w-16 h-3 mb-3" />
      <Skeleton className="w-3/4 h-5 mb-2" />
      <Skeleton className="w-1/2 h-4 mb-3" />
      <Skeleton className="w-full h-4 mb-1" />
      <Skeleton className="w-2/3 h-4 mb-4" />
      <Skeleton className="w-full h-10 rounded-full" />
    </div>
  );
}

export function TableSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton className="w-20 h-3 mb-3" />
          <Skeleton className="w-14 h-7" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
      <div>
        <Skeleton className="w-24 h-3 mb-4" />
        <Skeleton className="w-3/4 h-10 mb-4" />
        <Skeleton className="w-32 h-6 mb-4" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-2/3 h-4 mb-6" />
        <Skeleton className="w-48 h-12 rounded-full" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card">
      <div className="flex justify-between mb-4">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-2/3 h-4" />
    </div>
  );
}
