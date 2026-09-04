import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { PackageSearch, ImageOff } from "lucide-react";
import PageHeader from "../../components/dashboard/PageHeader";
import EmptyState from "../../components/dashboard/EmptyState";
import DateRangePicker from "../../components/dashboard/DateRangePicker";
import { useDashboardRange } from "../../components/dashboard/DashboardLayout";
import { Skeleton, StatGridSkeleton, TableSkeleton } from "../../components/dashboard/Skeleton";
import { fetchMyFoods } from "../../services/foodService";

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 10;

const FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock"];

function classify(stock) {
  if (stock <= 0) return "Out of Stock";
  if (stock < LOW_STOCK_THRESHOLD) return "Low Stock";
  return "In Stock";
}

const BADGE_STYLE = {
  "In Stock": "badge badge-success",
  "Low Stock": "badge badge-warning",
  "Out of Stock": "badge badge-error",
};

const FoodImg = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200 text-base-content/30">
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
      className="h-10 w-10 rounded-lg object-cover"
    />
  );
};

const StockPage = () => {
  const [foods, setFoods] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { range, setRange } = useDashboardRange();

  const load = useCallback(async () => {
    try {
      setFoods(await fetchMyFoods());
    } catch {
      toast.error("Could not load your stock.");
      setFoods([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(
    () =>
      (foods || []).map((f) => ({
        id: String(f._id || f.food_id || f.id),
        name: f.food_name || f.name || "Food item",
        category: f.category || "Other",
        price: Number(f.price || f.discounted_price || 0),
        stock: Math.max(0, Math.floor(Number(f.stock) || 0)),
        image: f.image || f.food_image || "",
        status: classify(Math.max(0, Math.floor(Number(f.stock) || 0))),
      })),
    [foods],
  );

  const summary = useMemo(
    () => ({
      totalItems: items.length,
      totalUnits: items.reduce((s, i) => s + i.stock, 0),
      lowCount: items.filter((i) => i.status === "Low Stock").length,
      outCount: items.filter((i) => i.status === "Out of Stock").length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchFilter = filter === "All" || i.status === filter;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [items, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  return (
    <div>
      <PageHeader
        title="Stock Overview"
        subtitle="Live stock of every item, updated when customers order."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-2xl font-bold text-base-content">{summary.totalItems}</p>
          <p className="text-sm text-base-content/60">Total Items</p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-2xl font-bold text-base-content">{summary.totalUnits}</p>
          <p className="text-sm text-base-content/60">Units on Hand</p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-2xl font-bold text-warning">{summary.lowCount}</p>
          <p className="text-sm text-base-content/60">Low Stock</p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-2xl font-bold text-error">{summary.outCount}</p>
          <p className="text-sm text-base-content/60">Out of Stock</p>
        </div>
      </div>

      {!foods ? (
        <div className="mt-6 space-y-4">
          <StatGridSkeleton />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
          <TableSkeleton rows={10} cols={5} />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Your menu is empty"
            message="Add foods to see their stock levels here."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="input input-bordered flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-base-content/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes..."
                className="w-48 bg-transparent outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost border border-base-300"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-base-200 text-xs uppercase tracking-wide text-base-content/50">
                    <th className="px-4 py-3 font-medium">Food</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {visible.map((i) => (
                    <tr key={i.id} className="transition-colors hover:bg-base-200/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FoodImg src={i.image} name={i.name} />
                          <span className="font-semibold text-base-content">{i.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base-content/70">{i.category}</td>
                      <td className="px-4 py-3 text-right text-base-content">
                        ৳{i.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-base-content">
                        {i.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span className={BADGE_STYLE[i.status]}>{i.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pageCount > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-base-content/60">
                Showing{" "}
                {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} items
              </p>
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                >
                  « Prev
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  disabled
                >
                  Page {safePage} of {pageCount}
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= pageCount}
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StockPage;