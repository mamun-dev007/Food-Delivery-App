import { Bike } from "lucide-react";
import { Avatar } from "./SmartImage";

const RiderPerformance = ({ riders = [], className = "" }) => (
  <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
    <div className="flex items-center gap-2">
      <Bike className="h-5 w-5 text-primary" />
      <h3 className="text-base font-bold text-base-content">Rider Performance</h3>
    </div>
    <p className="mt-0.5 text-sm text-base-content/50">Delivered orders & earnings</p>

    <div className="mt-4 space-y-3">
      {riders.length === 0 && (
        <p className="py-6 text-center text-sm text-base-content/50">No rider activity yet</p>
      )}
      {riders.slice(0, 5).map((r, i) => {
        const earnings = Number(r.earnings || 0);
        return (
          <div key={r.rider_id || i} className="flex items-center gap-3">
            <Avatar src={r.avatar_url} name={r.name} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-content">{r.name}</p>
              <p className="text-xs text-base-content/50">
                {r.deliveries || 0} deliveries ·{" "}
                {Number(r.rating || 0) > 0 ? `★ ${Number(r.rating).toFixed(1)}` : "No rating yet"}
              </p>
            </div>
            <span className="text-sm font-bold text-base-content">
              ৳{earnings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export default RiderPerformance;