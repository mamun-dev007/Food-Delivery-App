import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import toast from "react-hot-toast";
import { useOrderSummary } from "../../../hooks/useOrderSummary";
import OrderCard from "../../../components/customer/OrderCard";
import CustomerEmptyState from "../../../components/customer/EmptyState";
import { ListSkeleton } from "../../../components/dashboard/Skeleton";

const ORDER_FILTERS = [
  { key: "all", label: "All Completions" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
];

const OrderHistory = () => {
  const { orders, loading, error } = useOrderSummary("year");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (error) toast.error(error || "Failed to load order history.");
  }, [error]);

  const completed = useMemo(
    () =>
      orders.filter((o) => o.status === "Delivered" || o.status === "Cancelled"),
    [orders],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return completed;
    return completed.filter((o) => o.status === filter);
  }, [completed, filter]);

  const spent = useMemo(
    () =>
      completed
        .filter((o) => o.status === "Delivered")
        .reduce((s, o) => s + Number(o.total_amount || 0), 0) || 0,
    [completed],
  );

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Order History</h1>
          <p className="text-sm text-base-content/50">
            Delivered and cancelled orders from the past year.
          </p>
        </div>
        {!loading && completed.length > 0 && (
          <p className="rounded-xl bg-base-100 px-3.5 py-2 text-sm font-semibold text-base-content/70">
            {completed.length} order{completed.length > 1 ? "s" : ""} ·{" "}
            <span className="text-primary">৳{spent.toLocaleString("en-IN")}</span> spent
          </p>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {ORDER_FILTERS.map((f) => (
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
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <CustomerEmptyState
          icon={History}
          title={completed.length === 0 ? "No order history yet" : "No orders in this category"}
          message="Completed orders will be stored here so you can reorder or view invoices."
          action={
            completed.length === 0 ? (
              <Link
                to="/menu"
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
              >
                Start Ordering
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;