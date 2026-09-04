import { Gauge } from "lucide-react";

const BARS = [
  { key: "acceptance_rate", label: "Acceptance Rate", color: "bg-sky-500" },
  { key: "completion_rate", label: "Completion Rate", color: "bg-emerald-500" },
  { key: "on_time_rate", label: "On-time Rate", color: "bg-amber-500" },
];

const RatingRow = ({ rating }) => (
  <div className="mt-3 flex items-center justify-between border-t border-base-200 pt-3">
    <span className="text-sm font-medium text-base-content">Customer Rating</span>
    <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
      {Number(rating || 0).toFixed(1)}{" "}
      <span className="text-xs">{"★★★★★".slice(0, Math.round(rating || 0))}</span>
    </span>
  </div>
);

const PerformanceCard = ({ rates = {}, loading = false }) => {
  const bars = BARS.map((b) => ({
    ...b,
    value: Math.max(0, Math.min(100, Math.round(Number(rates[b.key]) || 0))),
  }));

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Performance</h3>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-28 animate-pulse rounded-md bg-base-200" />
              <div className="h-2 animate-pulse rounded-full bg-base-200" />
            </div>
          ))
        ) : (
          <>
            {bars.map((b) => (
              <div key={b.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-base-content/80">{b.label}</span>
                  <span className="text-xs font-bold text-base-content">{b.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-base-200">
                  <div
                    className={`h-2 rounded-full ${b.color} transition-all duration-500`}
                    style={{ width: `${b.value}%` }}
                  />
                </div>
              </div>
            ))}
          </>
        )}
        <RatingRow rating={rates.rating} />
      </div>
    </div>
  );
};

export default PerformanceCard;