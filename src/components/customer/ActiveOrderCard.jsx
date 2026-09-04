import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { FoodPhoto } from "../admin/SmartImage";
import { fmtMoney, fmtDate } from "../rider/shared";
import { isActiveStatus, statusMeta } from "../../utils/orderStatus";
import OrderStatusTracker from "./OrderStatusTracker";

const ActiveOrderCard = ({ order }) => {
  const items = order.items || [];
  const thumb = order.logo_url || order.restaurant_logo;
  const orderRef = order.order_no || order.id;
  const status = statusMeta(order.status);
  const active = isActiveStatus(order.status);

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100 shadow-sm">
      <div className="p-5 sm:p-6">
        {/* Restaurant + status */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <FoodPhoto src={thumb} alt={order.restaurant_name} className="h-14 w-14 rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-base-content">
                {order.restaurant_name || orderRef}
              </p>
              <p className="mt-0.5 truncate text-xs text-base-content/40">
                {orderRef} • {fmtDate(order.created_at || order.order_date)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Items */}
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 rounded-full border border-base-300/60 bg-base-200 px-3 py-1.5 text-xs font-semibold text-base-content/80"
            >
              {it.image ? (
                <img src={it.image} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="h-5 w-5 rounded-full bg-base-300" />
              )}
              {(it.item_name || it.food_name || it.name || "Item")} ×{it.quantity || it.qty || 1}
            </span>
          ))}
        </div>

        {/* Delivery tracker */}
        {active && <OrderStatusTracker status={order.status} />}

        {/* Footer */}
        {active && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-base-300/60 pt-4">
            <div className="flex items-center gap-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-base-content/40">
                  Total
                </p>
                <p className="text-lg font-bold text-base-content">
                  {fmtMoney(order.total_amount ?? order.total)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-base-content/40">
                  <Clock className="h-3 w-3" /> Estimated Delivery
                </p>
                <p className="text-sm font-bold text-base-content/80">
                  {order.delivery_eta_mins ?? order.eta ?? 25} mins
                </p>
              </div>
            </div>
            <Link
              to={`/track-order?order=${encodeURIComponent(orderRef)}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content shadow-sm transition-colors hover:bg-primary-focus"
            >
              Track Order <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!active && (
          <div className="mt-4 flex items-center gap-2 text-sm text-base-content/60">
            <MapPin className="h-4 w-4 text-base-content/40" />
            This order is no longer in progress.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveOrderCard;