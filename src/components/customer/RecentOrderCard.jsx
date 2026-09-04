import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { FoodPhoto } from "../admin/SmartImage";
import { fmtMoney } from "../rider/shared";
import { statusMeta } from "../../utils/orderStatus";

const RecentOrderCard = ({ order }) => {
  const items = order.items || [];
  const visible = items.slice(0, 3);
  const extra = items.length - visible.length;
  const thumb = order.logo_url || order.restaurant_logo;
  const orderRef = order.order_no || order.id;
  const status = statusMeta(order.status);

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Restaurant row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FoodPhoto src={thumb} alt={order.restaurant_name} className="h-12 w-12 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-base-content">{order.restaurant_name}</p>
            <p className="truncate text-xs text-base-content/40">
              {orderRef} • {order.order_date || order.created_at || ""}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Food items */}
      <div className="mt-3 flex flex-wrap gap-2">
        {visible.map((it, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full border border-base-300/60 bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/80"
          >
            {it.image ? (
              <img src={it.image} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <UtensilsCrossed className="h-3.5 w-3.5 text-base-content/40" />
            )}
            {(it.item_name || it.food_name || it.name || "Item")} ×
            {it.quantity || it.qty || 1}
          </span>
        ))}
        {extra > 0 && (
          <span className="inline-flex items-center rounded-full bg-base-200 px-2.5 py-1 text-xs font-bold text-base-content/50">
            +{extra} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-base-300/60 pt-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-base-content/40">Total</p>
          <p className="text-base font-bold text-base-content">
            {fmtMoney(order.total_amount ?? order.total)}
          </p>
        </div>
        <Link
          to={`/invoice/${order.id || orderRef}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-base-300 px-4 py-2 text-xs font-bold text-base-content/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          View Invoice <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default RecentOrderCard;