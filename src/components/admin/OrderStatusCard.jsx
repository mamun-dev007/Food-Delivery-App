import { ListChecks } from "lucide-react";

const STATUS_COLORS = {
  Pending: "bg-amber-500",
  Confirmed: "bg-sky-500",
  Preparing: "bg-violet-500",
  "Ready for Pickup": "bg-cyan-500",
  "On the Way": "bg-blue-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-rose-500",
};

const ORDER_ORDER = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready for Pickup",
  "On the Way",
  "Delivered",
  "Cancelled",
];

const OrderStatusCard = ({ counts = {}, className = "" }) => {
  const total = ORDER_ORDER.reduce((s, k) => s + Number(counts[k] || 0), 0);

  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Order Status</h3>
      </div>
      <p className="mt-0.5 text-sm text-base-content/50">Share of orders in each stage</p>

      <div className="mt-4 space-y-3">
        {ORDER_ORDER.map((k) => {
          const v = Number(counts[k] || 0);
          const p = total ? Math.round((v / total) * 100) : 0;
          return (
            <div key={k}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-base-content/70">{k}</span>
                <span className="font-semibold text-base-content">
                  {v} <span className="ml-1 text-xs font-normal text-base-content/50">({p}%)</span>
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-base-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[k]}`}
                  style={{ width: `${p}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusCard;