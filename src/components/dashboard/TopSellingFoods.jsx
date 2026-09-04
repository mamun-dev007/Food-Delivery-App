import { Link } from "react-router-dom";
import { Star, ArrowRight, ImageOff } from "lucide-react";
import { useState } from "react";
import DashboardCard from "./DashboardCard";

const FoodImg = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary/60">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-16 w-16 rounded-xl object-cover"
    />
  );
};

const TopSellingFoods = ({ foods }) => (
  <DashboardCard
    title="Top Selling Foods"
    subtitle="Most ordered items this week"
    action={
      <Link
        to="/dashboard/menu"
        className="text-sm font-medium text-primary hover:text-primary"
      >
        View All Foods
      </Link>
    }
  >
    <div className="space-y-3">
      {foods.slice(0, 5).map((f) => (
        <div key={f.id} className="flex items-center gap-3">
          <FoodImg src={f.image} name={f.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-base-content">{f.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-base-content/60">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {f.rating}
              <span className="text-base-content/50">({f.reviews})</span>
            </p>
          </div>
          <span className="text-sm font-bold text-base-content">
            ৳{Number(f.price || 0).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-4 lg:hidden">
      <Link
        to="/dashboard/menu"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary"
      >
        View All Foods <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </DashboardCard>
);

export default TopSellingFoods;