const RiderSkeletonBlock = ({ className = "h-24" }) => (
  <div className={`animate-pulse rounded-2xl border border-base-300 bg-base-200/60 ${className}`} />
);

const RiderSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <RiderSkeletonBlock key={i} className="h-28" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <RiderSkeletonBlock className="h-80 lg:col-span-2" />
      <RiderSkeletonBlock className="h-80" />
    </div>
    <RiderSkeletonBlock className="h-64" />
  </div>
);

export default RiderSkeleton;