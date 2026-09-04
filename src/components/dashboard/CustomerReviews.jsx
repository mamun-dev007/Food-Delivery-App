import { Link } from "react-router-dom";
import { Star, ArrowRight, ImageOff } from "lucide-react";
import { useState } from "react";
import DashboardCard from "./DashboardCard";

function initials(name) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-info/10 text-info",
  "bg-secondary/10 text-secondary",
  "bg-warning/10 text-warning",
];

const ReviewImg = ({ src, dish }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary/60">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={dish}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-14 rounded-xl object-cover"
    />
  );
};

const CustomerReviews = ({ reviews }) => {
  const list = reviews.list || [];
  return (
    <DashboardCard
      title="Customer Reviews"
      subtitle={`${reviews.count || 0} reviews · ${reviews.avg || 0} average rating`}
      action={
        <Link
          to="/dashboard/reviews"
          className="text-sm font-medium text-primary hover:text-primary"
        >
          View More Reviews
        </Link>
      }
      className="lg:col-span-2"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.slice(0, 3).map((r, idx) => (
          <div key={r.id || idx} className="rounded-xl border border-base-200 bg-base-200/60 p-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
              >
                {initials(r.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-base-content">{r.name}</p>
                <p className="flex items-center gap-1 text-xs text-base-content/60">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {r.rating} · {r.dish}
                </p>
              </div>
              <ReviewImg src={r.foodImage} dish={r.dish} />
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-base-content/70">{r.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 lg:hidden">
        <Link
          to="/dashboard/reviews"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary"
        >
          View More Reviews <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </DashboardCard>
  );
};

export default CustomerReviews;