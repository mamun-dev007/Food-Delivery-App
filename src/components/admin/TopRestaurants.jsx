import { Store } from "lucide-react";
import { FoodPhoto } from "./SmartImage";

const TopRestaurants = ({ restaurants = [], className = "" }) => {
  const max = Math.max(1, ...restaurants.map((r) => r.orders || 0));
  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Top Restaurants</h3>
        </div>
        <span className="text-xs text-base-content/50">by orders</span>
      </div>

      <div className="mt-4 space-y-3">
        {restaurants.length === 0 && (
          <p className="py-6 text-center text-sm text-base-content/50">No data yet</p>
        )}
        {restaurants.slice(0, 5).map((r, i) => (
          <div key={r.restaurant_id || i} className="flex items-center gap-3">
            <span className="w-5 text-sm font-bold text-slate-300">{i + 1}</span>
            <FoodPhoto
              src={r.logo_url}
              alt={r.name}
              className="h-10 w-10 rounded-xl border border-base-300"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-content">{r.name}</p>
              <p className="text-xs text-base-content/50">
                {r.cuisine || "Restaurant"} · {r.city || ""}
              </p>
            </div>
            <div className="hidden w-28 sm:block">
              <div className="h-1.5 w-full rounded-full bg-base-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (r.orders / max) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-base-content">{r.orders}</span>
              <span className="text-xs text-base-content/50"> orders</span>
              {r.commission && (
                <div className="text-xs font-semibold text-primary">
                  {r.commission} comm.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRestaurants;