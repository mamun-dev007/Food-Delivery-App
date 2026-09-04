import { Link } from "react-router-dom";
import { Star, MessageSquareQuote, ArrowRight } from "lucide-react";
import { Avatar, FoodPhoto } from "./SmartImage";

const CustomerReviews = ({ reviews = [], className = "" }) => (
  <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MessageSquareQuote className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Customer Reviews</h3>
      </div>
      <Link
        to="/admin/reviews"
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
      >
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="mt-4 space-y-3">
      {reviews.length === 0 && (
        <p className="py-6 text-center text-sm text-base-content/50">No reviews yet</p>
      )}
      {reviews.slice(0, 4).map((r, i) => {
        const rating = Number(r.rating || 0);
        return (
          <div key={r._id || r.id || i} className="rounded-xl border border-base-300 p-3">
            <div className="flex items-center gap-3">
              <Avatar src={r.avatar_url || r.user_avatar} name={r.name || r.user_name || r.customer_name} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-base-content">
                  {r.name || r.user_name || r.customer_name || "Customer"}
                </p>
                <p className="truncate text-xs text-base-content/50">
                  reviewing {r.restaurant || r.restaurant_name || r.food || r.food_name || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                {r.image && (
                  <FoodPhoto src={r.image} alt={r.food} className="h-10 w-12 rounded-lg" />
                )}
              </div>
            </div>
            {(r.text || r.comment) && (
              <p className="mt-2 line-clamp-2 text-sm text-base-content/60">{r.text || r.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default CustomerReviews;