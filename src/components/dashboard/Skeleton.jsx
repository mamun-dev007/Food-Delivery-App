// Skeleton loading primitives for the owner dashboard. Mirror the real card
// shapes (rounded-2xl cards, stat tiles, charts) so the page never flashes
// between layouts while data is loading.

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-base-200/70 ${className}`} />
);

const SkeletonCard = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}
  >
    <Skeleton className="h-4 w-32" />
    <Skeleton className="mt-2 h-3 w-20" />
    <div className="mt-6 space-y-3">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/6" />
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <Skeleton className="h-8 w-24" />
    <Skeleton className="mt-2 h-3 w-16" />
    <div className="mt-4 flex items-center gap-2">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

const TableSkeleton = ({ rows = 8, cols = 4 }) => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
    <div className="flex items-center justify-between border-b border-base-200 px-5 py-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="divide-y divide-base-200">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 ${c === 0 ? "w-40" : c % 2 === 0 ? "w-16" : "w-24"}`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const ChartCardSkeleton = ({ className = "" }) => (
  <SkeletonCard className={className} />
);

const StatGridSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

const DashboardLoading = () => (
  <div className="mt-6 space-y-4">
    <StatGridSkeleton />

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCardSkeleton className="lg:col-span-2" />
      <ChartCardSkeleton />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCardSkeleton className="lg:col-span-2" />
      <ChartCardSkeleton />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCardSkeleton className="lg:col-span-2" />
    </div>

    <TableSkeleton />

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCardSkeleton />
      <ChartCardSkeleton />
      <ChartCardSkeleton />
    </div>
  </div>
);

const CardGridSkeleton = ({ count = 6, imageHeight = "h-44" }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
      >
        <Skeleton className={`${imageHeight} w-full rounded-none`} />
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-10 shrink-0" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/6" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ListSkeleton = ({ rows = 6, avatar = true }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        {avatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0" />
      </div>
    ))}
  </div>
);

const FormSkeleton = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i}>
        <Skeleton className="mb-1.5 h-3 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end gap-2 pt-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-28" />
    </div>
  </div>
);

const TextLinesSkeleton = ({ lines = 4, className = "" }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-3/6"}`}
      />
    ))}
    {className && <div className={className} />}
  </div>
);

export {
  Skeleton,
  SkeletonCard,
  StatCardSkeleton,
  StatGridSkeleton,
  TableSkeleton,
  ChartCardSkeleton,
  DashboardLoading,
  CardGridSkeleton,
  ListSkeleton,
  FormSkeleton,
  TextLinesSkeleton,
};