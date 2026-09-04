import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Phone,
  Store,
  User as UserIcon,
  Package,
  Loader2,
} from "lucide-react";
import {
  acceptOrder,
  updateOrderStatus,
} from "../../services/riderService";

const TRACK_STEPS = [
  "Order Placed",
  "Restaurant Confirmed",
  "Food Preparing",
  "Ready for Pickup",
  "Rider Assigned",
  "Picked Up",
  "On The Way",
  "Delivered",
];

export function trackingSteps(order) {
  const st = order.status;
  const rs = order.rider_status;
  const done = {
    "Order Placed": true,
    "Restaurant Confirmed": ["Preparing", "On The Way", "Delivered"].includes(st),
    "Food Preparing": ["Preparing", "On The Way", "Delivered"].includes(st),
    "Ready for Pickup": ["On The Way", "Delivered"].includes(st),
    "Rider Assigned": Boolean(rs),
    "Picked Up": ["Picked Up", "On The Way", "Delivered"].includes(rs),
    "On The Way": ["On The Way", "Delivered"].includes(rs),
    Delivered: st === "Delivered" || rs === "Delivered",
  };
  return TRACK_STEPS.map((name) => ({ name, done: Boolean(done[name]) }));
}

const NEXT_ACTIONS = [
  { label: "Picked Up", from: ["Accepted", "At Restaurant"] },
  { label: "On The Way", from: ["Picked Up"] },
  { label: "Delivered", from: ["On The Way"] },
];

const RiderDeliveryCard = ({ order, onChanged, showActions = true }) => {
  const [busy, setBusy] = useState(null);
  const isClaimed = Boolean(order.rider_status);

  const handleAction = async (action) => {
    setBusy(action);
    try {
      if (action === "Accept Order") {
        await acceptOrder(order.order_no);
        toast.success("Delivery accepted!");
      } else {
        await updateOrderStatus(order.order_no, action);
        toast.success(`Status updated to ${action}`);
      }
      if (onChanged) onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed.");
      if (onChanged) onChanged();
    } finally {
      setBusy(null);
    }
  };

  const current = order.rider_status || "Accepted";
  const steps = trackingSteps(order);

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-bold text-lg">{order.order_no}</p>
          <span className="badge badge-primary">{current}</span>
        </div>

        {/* Customer + restaurant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-sm">
          <div className="flex items-start gap-2">
            <UserIcon className="w-4 h-4 mt-0.5 text-base-content/50 shrink-0" />
            <div>
              <p className="font-medium">{order.customer}</p>
              <p className="flex items-center gap-1 text-base-content/60">
                <Phone className="w-3.5 h-3.5" />
                {order.phone || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Store className="w-4 h-4 mt-0.5 text-base-content/50 shrink-0" />
            <div>
              <p className="font-medium">{order.restaurant}</p>
              <p className="flex items-center gap-1 text-base-content/60">
                <MapPin className="w-3.5 h-3.5" />
                {order.pickup || "Restaurant"}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="mt-3 text-sm">
          <p className="text-base-content/50 text-xs uppercase tracking-wide">
            Delivery Address
          </p>
          <p className="flex items-start gap-2 mt-1">
            <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            {order.dropoff || "—"}
          </p>
        </div>

        {/* Items */}
        <div className="divider my-3" />
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-base-content/50 shrink-0" />
          <span>
            {Array.isArray(order.items_detail) && order.items_detail.length
              ? order.items_detail.map((it) => (
                  <span key={it.food_id || it.food_name} className="mr-2">
                    {it.food_name || "Item"} × {it.quantity ?? 1}
                  </span>
                ))
              : order.items}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-sm text-base-content/60">Total Amount</p>
            <p className="text-xl font-bold text-primary">
              ৳{(Number(order.total_amount) || Number(order.total) || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-base-content/60">Your Earnings</p>
            <p className="text-lg font-semibold text-success">
              ৳{(Number(order.earnings) || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 mt-4">
            {!isClaimed && (
              <button
                className="btn btn-primary gap-1"
                disabled={busy}
                onClick={() => handleAction("Accept Order")}
              >
                {busy === "Accept Order" && <Loader2 className="w-4 h-4 animate-spin" />}
                Accept Order
              </button>
            )}
            {NEXT_ACTIONS.filter((a) => a.from.includes(current)).map((a) => (
              <button
                key={a.label}
                className="btn btn-outline btn-primary gap-1"
                disabled={busy}
                onClick={() => handleAction(a.label)}
              >
                {busy === a.label && <Loader2 className="w-4 h-4 animate-spin" />}
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Tracking timeline */}
        {!order.isHistory && (
          <div className="mt-4 pt-4 border-t border-base-200">
            <p className="text-sm font-semibold mb-3">Order Tracking</p>
            <ol className="space-y-0">
              {steps.map((s, idx) => (
                <li key={s.name} className="flex items-center gap-3 relative pb-4 last:pb-0">
                  {idx < steps.length - 1 && (
                    <span
                      className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                        steps[idx + 1].done ? "bg-primary" : "bg-base-300"
                      }`}
                    />
                  )}
                  {s.done ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 relative z-10 bg-base-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-base-300 shrink-0 relative z-10 bg-base-100" />
                  )}
                  <span
                    className={`text-sm ${s.done ? "font-medium" : "text-base-content/50"}`}
                  >
                    {s.name}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDeliveryCard;