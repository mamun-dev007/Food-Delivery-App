import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Package } from "lucide-react";
import StatusBadge from "../dashboard/StatusBadge";
import { FoodPhoto } from "../admin/SmartImage";
import { fmtMoney, fmtDate } from "../rider/shared";
import { orderIsActive } from "../../utils/order";

const STEPS = ["Pending", "Preparing", "On The Way", "Delivered"];
const STEP_INDEX = { Pending: 0, Preparing: 1, "On The Way": 2, Delivered: 3 };

const OrderItems = ({ items = [] }) => {
  const visible = items.slice(0, 3);
  const extra = items.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content/70"
        >
          {it.image ? (
            <img src={it.image} alt="" className="h-4 w-4 rounded-full object-cover" />
          ) : (
            <Package className="h-3 w-3 text-base-content/40" />
          )}
          <span>{(it.item_name || it.food_name || it.name || "").slice(0, 22)}</span>
          <span className="font-bold text-base-content/50">×{it.quantity || it.qty || 1}</span>
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-base-200 px-2.5 py-1 text-xs font-bold text-base-content/50">
          +{extra} more
        </span>
      )}
    </div>
  );
};

const ProgressSteps = ({ status }) => {
  const currentIdx = STEP_INDEX[status] ?? -1;
  if (currentIdx < 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    done ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/40"
                  }`}
                >
                  {done && idx < currentIdx ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </span>
                <span
                  className={`hidden text-[10px] sm:block ${
                    isCurrent ? "font-bold text-primary" : done ? "text-base-content/70" : "text-base-content/30"
                  }`}
                >
                  {step}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded ${idx < currentIdx ? "bg-primary" : "bg-base-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderCard = ({ order, showTracker = false }) => {
  const active = orderIsActive(order.status);
  const thumb = order.logo_url || order.restaurant_logo;
  const items = order.items || [];

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FoodPhoto src={thumb} alt={order.restaurant_name} className="h-12 w-12 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate font-bold text-base-content">{order.restaurant_name || order.id}</p>
            <p className="truncate text-xs text-base-content/50">
              {order.order_no || order.id} • {fmtDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="mt-3">
        <OrderItems items={items} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-200 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-base-content/50">Total</span>
          <span className="text-lg font-bold text-base-content">{fmtMoney(order.total_amount)}</span>
          {order.total_amount != null && order.delivery_fee != null && (
            <span className="text-[11px] text-base-content/40">
              incl. {fmtMoney(order.delivery_fee)} delivery
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {active ? (
            <Link
              to={`/track-order?order=${order.order_no || order.id}`}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
            >
              Track Order <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to={`/invoice/${order.id || order.order_no}`}
              className="inline-flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold text-base-content/70 transition-colors hover:bg-base-200"
            >
              View Invoice <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {showTracker && active && <ProgressSteps status={order.status} />}
    </div>
  );
};

export default OrderCard;