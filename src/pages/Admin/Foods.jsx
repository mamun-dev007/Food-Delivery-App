import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, RefreshCw, UtensilsCrossed, PackageCheck, AlertTriangle, PackageX } from "lucide-react";
import { fetchAdminFoods } from "../../services/adminService";
import { FoodPhoto } from "../../components/admin/SmartImage";
import { CardGridSkeleton } from "../../components/dashboard/Skeleton";

const PAGE_SIZE = 15;

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const Foods = () => {
  const { search = "" } = useOutletContext() || {};
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminFoods();
      setFoods(data);
    } catch (err) {
      toast.error(err?.message || "Could not load foods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const reload = () => load();

  const q = search.trim().toLowerCase();
  const filtered = foods.filter((f) =>
    [f.name, f.restaurant, f.category].some((v) => v?.toLowerCase().includes(q))
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, filtered.length);

  const inStock = foods.filter((f) => f.stock > 0).length;
  const lowStock = foods.filter((f) => f.stock > 0 && f.stock < 10).length;
  const outOfStock = foods.filter((f) => f.stock <= 0).length;

  const stockBadge = (stock) => {
    if (stock <= 0)
      return (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
          Out of stock
        </span>
      );
    if (stock < 10)
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          Low stock ({stock})
        </span>
      );
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        In stock ({stock})
      </span>
    );
  };

  if (loading) return <CardGridSkeleton count={9} imageHeight="h-28" />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Foods</h1>
          <p className="mt-0.5 text-sm text-base-content/50">Full food catalogue across all restaurants</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-base-content/50" />
            <p className="text-2xl font-bold text-base-content">{foods.length}</p>
          </div>
          <p className="text-xs text-base-content/50">Total foods</p>
        </div>
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-emerald-500" />
            <p className="text-2xl font-bold text-base-content">{inStock}</p>
          </div>
          <p className="text-xs text-base-content/50">In stock</p>
        </div>
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-2xl font-bold text-base-content">{lowStock}</p>
          </div>
          <p className="text-xs text-base-content/50">Low stock</p>
        </div>
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-rose-500" />
            <p className="text-2xl font-bold text-base-content">{outOfStock}</p>
          </div>
          <p className="text-xs text-base-content/50">Out of stock</p>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="py-10 text-center text-sm text-base-content/50">No foods yet</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {paged.map((f) => (
          <div key={f.id || f._id} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <FoodPhoto src={f.image} alt={f.name} className="h-14 w-14 rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-base-content">{f.name}</p>
                  <p className="truncate text-xs text-base-content/50">{f.restaurant}</p>
                </div>
              </div>
              <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/60">
                {f.category}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-lg font-bold text-primary">{fmtMoney(f.price)}</p>
              {stockBadge(f.stock)}
            </div>
          </div>
        ))}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-base-content/50">
            Showing <b className="text-base-content">{from}–{to}</b> of{" "}
            <b className="text-base-content">{filtered.length}</b> foods
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/70 transition-colors hover:bg-base-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - current) <= 2 || p === 1 || p === pages)
              .reduce((acc, p) => (acc.includes(p) ? acc : [...acc, p]), [])
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-base-content/40">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors ${
                      p === current
                        ? "bg-primary text-primary-content"
                        : "border border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={current >= pages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/70 transition-colors hover:bg-base-200 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Foods;