import { Flame } from "lucide-react";
import { FoodPhoto } from "./SmartImage";

const TopSellingFoods = ({ foods = [], className = "" }) => {
  const max = Math.max(1, ...foods.map((f) => f.quantity || 0));
  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Top Selling Foods</h3>
        </div>
        <span className="text-xs text-base-content/50">by qty sold</span>
      </div>

      <div className="mt-4 space-y-3">
        {foods.length === 0 && (
          <p className="py-6 text-center text-sm text-base-content/50">No data yet</p>
        )}
        {foods.slice(0, 5).map((f, i) => (
          <div key={f.food_id || i} className="flex items-center gap-3">
            <span className="w-5 text-sm font-bold text-slate-300">{i + 1}</span>
            <FoodPhoto
              src={f.image}
              alt={f.name}
              className="h-10 w-10 rounded-xl border border-base-300"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-content">{f.name}</p>
              <p className="truncate text-xs text-base-content/50">{f.restaurant || ""}</p>
            </div>
            <div className="hidden w-28 sm:block">
              <div className="h-1.5 w-full rounded-full bg-base-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (f.quantity / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-base-content">{f.quantity}</span>
            <span className="text-xs text-base-content/50">sold</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellingFoods;