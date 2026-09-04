import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { useOrderSummary } from "../../hooks/useOrderSummary";
import OrderCard from "../../components/customer/OrderCard";
import { orderIsActive } from "../../utils/order";
import CustomerEmptyState from "../../components/customer/EmptyState";
import { ListSkeleton } from "../../components/dashboard/Skeleton";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
];

const MyOrders = () => {
  const { orders, loading, error } = useOrderSummary("year");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (q) {
        const haystack = [o.order_no, o.restaurant_name].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter === "active") return orderIsActive(o.status);
      if (filter === "Delivered" || filter === "Cancelled") return o.status === filter;
      return true;
    });
  }, [orders, query, filter]);

  const counts = useMemo(() => {
    const active = orders.filter((o) => orderIsActive(o.status)).length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    return { active, delivered, cancelled };
  }, [orders]);

  useEffect(() => {
    if (error) toast.error(error || "Failed to load orders.");
  }, [error]);

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">My Orders</h1>
          <p className="text-sm text-base-content/50">
            A complete history of everything you've ordered.
          </p>
        </div>
        <Link
          to="/menu"
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
        >
          Order Something
        </Link>
      </div>

      {/* Filters + search */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-content"
                  : "border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
              }`}
            >
              {f.label}
              {f.key === "active" && counts.active > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 text-xs ${filter === f.key ? "bg-primary-content/20" : "bg-base-200"}`}>
                  {counts.active}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order no or restaurant..."
            className="w-full rounded-xl border border-base-300 bg-base-100 py-2 pl-9 pr-3 text-sm text-base-content outline-none transition-colors placeholder:text-base-content/40 focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <CustomerEmptyState
          icon={null}
          title={orders.length === 0 ? "No orders placed yet" : "No orders match your search"}
          message={
            orders.length === 0
              ? "Your orders will appear here once you place your first order."
              : "Try a different search term or filter."
          }
          action={
            orders.length === 0 ? (
              <Link
                to="/menu"
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
              >
                Browse Menu
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} showTracker />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;