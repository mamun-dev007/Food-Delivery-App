import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Package, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { fetchOrder } from "../../../services/orderService";
import { useOrderSummary } from "../../../hooks/useOrderSummary";
import { useCartStore } from "../../../store/cartStore";
import { FoodPhoto } from "../../../components/admin/SmartImage";
import { fmtDate, fmtMoney } from "../../../components/rider/shared";
import OrderStatusTracker from "../../../components/customer/OrderStatusTracker";
import { isActiveStatus, statusMeta } from "../../../utils/orderStatus";

const OrderDetails = () => {
  const { id } = useParams();
  const { orders, loading: listLoading } = useOrderSummary("year");
  const addItem = useCartStore((s) => s.addItem);

  const fromList = useMemo(
    () => orders.find((o) => String(o.id) === String(id) || String(o.order_no) === String(id)),
    [orders, id],
  );

  const [order, setOrder] = useState(fromList || null);
  const [loading, setLoading] = useState(!fromList);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fromList) {
      setOrder(fromList);
      setLoading(false);
      return;
    }
    let mounted = true;
    fetchOrder(id)
      .then((o) => mounted && setOrder(o))
      .catch(() => mounted && setError("Order not found. Please check the order number."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (listLoading && loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded-xl bg-base-300/60" />
        <div className="h-80 animate-pulse rounded-2xl bg-base-300/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-base-300/60 bg-base-100 p-8 text-center shadow-sm">
        <Package className="mx-auto h-10 w-10 text-base-content/30" />
        <p className="mt-3 text-sm font-semibold text-base-content/80">{error}</p>
        <Link
          to="/customer/dashboard/order-history"
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-focus"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Order History
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const items = order.items || [];
  const status = statusMeta(order.status);
  const active = isActiveStatus(order.status);
  const thumb = order.logo_url || order.restaurant_logo || order.restaurant_logo_url;

  const reorder = () => {
    let count = 0;
    items.forEach((it) => {
      const idk = it.food_id || it.id || it.item_id;
      if (idk) {
        addItem({
          id: idk,
          name: it.item_name || it.food_name || it.name,
          price: Number(it.unit_price ?? it.price ?? 0),
          image: it.image || "",
          restaurant: order.restaurant_name,
        });
        count += 1;
      }
    });
    if (count > 0) {
      toast.success("Added to your cart!");
    } else {
      toast("Open the restaurant menu to reorder these items.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        to="/customer/dashboard/order-history"
        className="inline-flex items-center gap-1 text-xs font-semibold text-base-content/50 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Order History
      </Link>

      <div className="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100 shadow-sm">
        <div className="border-b border-base-300/60 bg-base-200/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <FoodPhoto src={thumb} alt={order.restaurant_name} className="h-14 w-14 rounded-2xl" />
              <div className="min-w-0">
                <p className="text-base font-bold text-base-content">{order.restaurant_name}</p>
                <p className="text-xs text-base-content/40">
                  {order.order_no} • {fmtDate(order.created_at)}
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
        </div>

        <div className="p-5 sm:p-6">
          {active && <OrderStatusTracker status={order.status} />}

          {/* Items */}
          <div className="mt-5 space-y-2.5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                {it.image ? (
                  <img
                    src={it.image}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-base-200 text-base-content/30">
                    <Package className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-base-content/90">
                    {it.item_name || it.food_name || it.name}
                  </p>
                  <p className="text-xs text-base-content/40">× {it.quantity || it.qty || 1}</p>
                </div>
                <span className="text-sm font-bold text-base-content/90">
                  {fmtMoney((it.unit_price ?? it.price ?? 0) * (it.quantity || it.qty || 1))}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-5 space-y-1.5 border-t border-base-300/60 pt-4 text-sm">
            <div className="flex justify-between text-base-content/60">
              <span>Subtotal</span>
              <span className="font-semibold text-base-content/90">
                {fmtMoney(order.subtotal ?? order.total_amount)}
              </span>
            </div>
            {order.delivery_fee != null && (
              <div className="flex justify-between text-base-content/60">
                <span>Delivery Fee</span>
                <span className="font-semibold text-base-content/90">{fmtMoney(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-base-300/60 pt-1.5">
              <span className="font-bold text-base-content">Total</span>
              <span className="text-base font-bold text-base-content">
                {fmtMoney(order.total_amount)}
              </span>
            </div>
          </div>

          {order.delivery?.address && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-base-200 p-3 text-sm text-base-content/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-base-content/40" />
              <span>
                {order.delivery.address}
                {order.delivery.city ? `, ${order.delivery.city}` : ""}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {active && (
              <Link
                to={`/track-order?order=${encodeURIComponent(order.order_no || order.id)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
              >
                Track Order <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              to={`/invoice/${order.id || order.order_no}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-base-300 px-4 py-2.5 text-sm font-bold text-base-content/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              View Invoice
            </Link>
            {items.length > 0 && (
              <button
                onClick={reorder}
                className="inline-flex items-center gap-1.5 rounded-xl border border-base-300 px-4 py-2.5 text-sm font-bold text-base-content/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <RefreshCw className="h-4 w-4" /> Reorder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;