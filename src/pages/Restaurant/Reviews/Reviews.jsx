import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { fetchOwnerReviews } from "../../../services/restaurantService";
import { ListSkeleton } from "../../../components/dashboard/Skeleton";

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const StarRow = ({ value, size = "w-4 h-4" }) => (
  <div className="flex">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`${size} ${
          n <= value ? "text-yellow-500 fill-yellow-500" : "text-base-content/30"
        }`}
      />
    ))}
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ avg: 0, count: 0, distribution: {} });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOwnerReviews();
      setReviews(data.reviews);
      setRating(data.rating);
    } catch {
      toast.error("Failed to load reviews.");
      setReviews([]);
      setRating({ avg: 0, count: 0, distribution: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
        <p className="text-base-content/60 mt-1">
          See what customers think about your restaurant.
        </p>
      </div>

      {/* Rating summary */}
      <div className="card bg-base-100 shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">
              {Number(rating.avg).toFixed(1)}
            </p>
            <StarRow value={Math.round(rating.avg)} size="w-5 h-5" />
            <p className="text-sm text-base-content/60 mt-1">
              {rating.count} review{rating.count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex-1 w-full space-y-1 max-w-md">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = rating.distribution[star] || 0;
              const max = rating.count || 1;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-base-content/60">{star} ★</span>
                  <progress
                    className="progress progress-primary flex-1"
                    value={count}
                    max={max}
                  ></progress>
                  <span className="w-8 text-right text-base-content/60">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : reviews.length === 0 ? (
        <div className="card bg-base-100 shadow-md p-10 text-center">
          <Star className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
          <p className="text-base-content/50">
            No reviews for your restaurant yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card bg-base-100 shadow-md">
              <div className="card-body p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="font-bold text-primary-content">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-base-content/60">
                        {r.dish}
                        {r.created_at ? ` · ${fmtDate(r.created_at)}` : ""}
                      </p>
                    </div>
                  </div>
                  <StarRow value={r.rating} />
                </div>
                <p className="mt-3 text-base-content/80">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
