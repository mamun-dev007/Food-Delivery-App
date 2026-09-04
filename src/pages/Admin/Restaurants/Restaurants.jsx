import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { RefreshCw, Star } from "lucide-react";
import toast from "react-hot-toast";
import { fetchAdminRestaurants } from "../../../services/adminService";
import { CardGridSkeleton } from "../../../components/dashboard/Skeleton";
import StatusBadge from "../../../components/admin/StatusBadge";
import { FoodPhoto } from "../../../components/admin/SmartImage";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search = "" } = useOutletContext() || {};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRestaurants(await fetchAdminRestaurants());
    } catch (err) {
      toast.error(err?.message || "Could not load restaurants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const visible = restaurants.filter((r) => {
    if (!q) return true;
    return (
      (r.name || "").toLowerCase().includes(q) ||
      (r.cuisine || "").toLowerCase().includes(q) ||
      (r.city || "").toLowerCase().includes(q) ||
      (r.owner || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">
            Restaurants
          </h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            Manage restaurant accounts and their status.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} imageHeight="h-40" />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="py-10 text-center text-sm text-base-content/50">
            No restaurants yet
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FoodPhoto
                    src={r.logo_url}
                    alt={r.name}
                    className="h-12 w-12 rounded-xl"
                  />
                  <div>
                    <p className="font-bold text-base-content">{r.name}</p>
                    <p className="text-xs text-base-content/50">
                      {r.cuisine}
                      {r.city ? ` · ${r.city}` : ""}
                    </p>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="mt-3 flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(Number(r.rating) || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-base-300"
                    }`}
                  />
                ))}
                <span className="ml-1.5 text-xs font-semibold text-base-content/70">
                  {r.rating ?? "—"}
                </span>
              </div>

              <div className="mt-2 text-xs text-base-content/60">
                <p className="font-medium text-base-content">{r.owner}</p>
                {r.owner_email && <p>{r.owner_email}</p>}
              </div>

              {r.status === "pending" && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">
                    This restaurant is awaiting approval.
                  </p>
                  <Link
                    to="/admin/restaurants/requests"
                    className="mt-1 inline-block text-xs font-semibold text-primary hover:text-primary"
                  >
                    Review now
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Restaurants;