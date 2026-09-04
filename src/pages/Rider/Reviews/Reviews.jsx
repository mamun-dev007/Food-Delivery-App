import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { fetchRiderReviews } from "../../../services/riderService";
import ReviewCard from "../../../components/rider/ReviewCard";
import EmptyState from "../../../components/rider/EmptyState";

const DIST = [5, 4, 3, 2, 1];

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRiderReviews();
      setReviews(data.reviews || []);
      setAvg(Number(data.avg || 0));
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dist = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const k = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      buckets[k] += 1;
    });
    return DIST.map((s) => ({ star: s, count: buckets[s], pct: reviews.length ? Math.round((buckets[s] / reviews.length) * 100) : 0 }));
  }, [reviews]);

  return (
    <div className="mx-auto max-w-[1000px]">
      <h2 className="text-lg font-bold tracking-tight text-base-content">Reviews & Ratings</h2>
      <p className="text-sm text-base-content/50">What customers say about your deliveries</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Rating summary */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 text-center shadow-sm lg:sticky lg:top-20 lg:self-start">
          <p className="text-5xl font-extrabold tracking-tight text-base-content">{avg ? avg.toFixed(1) : "—"}</p>
          <div className="mt-2 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-5 w-5 ${n <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-base-300"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-base-content/50">{reviews.length} reviews</p>

          <div className="mt-6 space-y-2 text-left">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-9 font-semibold text-base-content/70">{d.star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-200">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-10 text-right text-base-content/50">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review list */}
        <div className="lg:col-span-2">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="mb-4 h-36 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
            ))
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews yet"
              message="When customers rate your deliveries, their reviews will show up here."
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;