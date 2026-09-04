import { useCallback, useEffect, useState } from "react";
import { Wallet, Receipt, Clock, Star } from "lucide-react";
import { fetchOrderSummary } from "../../services/orderService";

// Time-range filter options
const RANGES = [
  { key: "day", label: "Today", hint: "1 Day" },
  { key: "month", label: "This Month", hint: "1 Month" },
  { key: "year", label: "This Year", hint: "1 Year" },
];

// Status → daisyUI badge styling
const STATUS_BADGE = {
  Pending: "badge-warning",
  Preparing: "badge-info",
  "On The Way": "badge-primary",
  Delivered: "badge-success",
  Cancelled: "badge-error",
};

const STATUS_ICON = {
  Delivered: "✓",
  Cancelled: "✕",
  Pending: "…",
  Preparing: "🍳",
  "On The Way": "🚚",
};

// ------------------------------------------------------------------
// Individual order card: restaurant + items + totals + status
// ------------------------------------------------------------------
function OrderCard({ order }) {
  const date = new Date(order.created_at);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body p-5">
        {/* Header: restaurant + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {order.logo_url ? (
              <img
                src={order.logo_url}
                alt={order.restaurant_name}
                className="w-11 h-11 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-content">
                  {order.restaurant_name?.charAt(0) || "R"}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold leading-tight">{order.restaurant_name}</h3>
              <p className="text-xs text-base-content/60">#{order.id}</p>
            </div>
          </div>

          <span
            className={`badge gap-1 ${STATUS_BADGE[order.status] || "badge-ghost"}`}
          >
            <span aria-hidden="true">{STATUS_ICON[order.status]}</span>
            {order.status}
          </span>
        </div>

        {/* Items list */}
        <dl className="mt-3 space-y-1 text-sm">
          {order.items.map((item, idx) => (
            <div
              key={`${order.id}-${idx}`}
              className="flex items-center justify-between gap-2"
            >
              <dt className="text-base-content/80">
                <span className="inline-block w-6 text-base-content/50 font-medium">
                  {item.quantity}×
                </span>
                {item.item_name}
              </dt>
              <dd className="font-medium tabular-nums">
                ${(item.quantity * item.unit_price).toFixed(2)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="divider my-2" />

        {/* Totals + date/time */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-0.5 text-sm text-base-content/60">
            <p className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formattedDate} · {formattedTime}
            </p>
            <p className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4" />
              Delivery fee{" "}
              <span className="font-medium text-base-content">
                ${order.delivery_fee.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-base-content/50">Total Amount</p>
            <p className="text-xl font-bold text-primary tabular-nums">
              ${order.total_amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

// ------------------------------------------------------------------
// Main analytics + history component
// ------------------------------------------------------------------
export default function OrderAnalytics() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchOrderSummary(range);
    setData(result);
    setLoading(false);
  }, [range]);

  // Refetch whenever the selected filter changes.
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full">
      {/* -------- Filter tabs -------- */}
      <div className="flex justify-center gap-2 bg-base-200 rounded-full p-1 w-fit mx-auto">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`btn btn-sm rounded-full ${
              range === r.key ? "btn-primary" : "btn-ghost"
            }`}
            aria-pressed={range === r.key}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* -------- Loading state -------- */}
      {loading && (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}

      {/* -------- Data -------- */}
      {!loading && data && (
        <>
          {/* Analytics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Total Spent</p>
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    ${(data.total_spent ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Total Orders</p>
                  <p className="text-3xl font-bold tabular-nums">
                    {data.total_orders ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Optionally show the range hint */}
          <p className="text-center text-sm text-base-content/50 mt-4">
            {RANGES.find((r) => r.key === data.range)?.hint}
          </p>

          {/* -------- Order list -------- */}
          <div className="mt-6 space-y-4 max-w-3xl mx-auto">
            {data.orders.length === 0 ? (
              <div className="card bg-base-100 shadow-md p-10 text-center">
                <Star className="w-10 h-10 mx-auto text-base-content/30" />
                <p className="text-lg text-base-content/70 mt-3">
                  No orders in this period yet.
                </p>
                <p className="text-sm text-base-content/50">
                  Try a different time range.
                </p>
              </div>
            ) : (
              data.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
