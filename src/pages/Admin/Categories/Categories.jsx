import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw, Tags } from "lucide-react";
import toast from "react-hot-toast";
import { fetchAdminCategories } from "../../../services/adminService";
import { CardGridSkeleton } from "../../../components/dashboard/Skeleton";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search = "" } = useOutletContext() || {};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await fetchAdminCategories());
    } catch (err) {
      toast.error(err?.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const visible = categories.filter((c) =>
    (c.name || "").toLowerCase().includes(q)
  );

  const totalFoods = categories.reduce(
    (sum, c) => sum + (Number(c.count) || 0),
    0
  );
  const maxCount = Math.max(1, ...visible.map((c) => Number(c.count) || 0));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">
            Categories
          </h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            {totalFoods} foods across {categories.length} categories.
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
        <CardGridSkeleton count={8} imageHeight="h-24" />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="py-10 text-center text-sm text-base-content/50">
            No categories yet
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c, i) => (
            <div
              key={c.name || i}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Tags className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-base-content">{c.name}</p>
                  <p className="text-sm text-base-content/50">
                    {c.count ?? 0} items
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-base-200">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{
                    width: `${((Number(c.count) || 0) / maxCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;