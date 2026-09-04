import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { RefreshCw, Star } from "lucide-react";
import { fetchAdminReviews } from "../../services/adminService";
import { Avatar, FoodPhoto } from "../../components/admin/SmartImage";
import { ListSkeleton } from "../../components/dashboard/Skeleton";

const Reviews = () => {
  const { search = "" } = useOutletContext() || {};
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReviews();
      setReviews(data);
    } catch (err) {
      toast.error(err?.message || "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reload = () => load();

  const q = search.trim().toLowerCase();
  const filtered = reviews.filter((r) =>
    [r.name, r.restaurant, r.food, r.text].some((v) => v?.toLowerCase().includes(q))
  );

  if (loading) return <ListSkeleton rows={6} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Reviews</h1>
          <p className="mt-0.5 text-sm text-base-content/50">Latest customer feedback</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="py-10 text-center text-sm text-base-content/50">No reviews yet</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.map((r) => (
          <div key={r.id || r._id} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={r.avatar_url} name={r.name} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-base-content">{r.name}</p>
                  <p className="truncate text-xs text-base-content/50">{r.restaurant || r.food}</p>
                </div>
              </div>
              {r.image && (
                <FoodPhoto src={r.image} alt={r.food} className="h-14 w-16 rounded-lg" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s + 1 <= Math.round(r.rating) ? "fill-amber-400 text-amber-400" : "text-base-300"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-base-content/70">{r.text}</p>
            <p className="mt-3 text-xs text-base-content/50">
              {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;