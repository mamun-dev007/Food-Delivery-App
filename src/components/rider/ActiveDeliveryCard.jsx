import { useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarClock,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  Store,
  User as UserIcon,
} from "lucide-react";
import { Avatar, FoodPhoto } from "../admin/SmartImage";
import { updateOrderStatus } from "../../services/riderService";
import DeliveryProgress from "./DeliveryProgress";
import StatusBadge from "./StatusBadge";
import { fmtMoney, fmtDate } from "./shared";

const NEXT_ACTIONS = [
  { label: "Picked Up", from: ["Accepted", "At Restaurant"], cta: "Mark as Picked Up" },
  { label: "On The Way", from: ["Picked Up"], cta: "Start Delivery" },
  { label: "Delivered", from: ["On The Way"], cta: "Mark as Delivered" },
];

const mapsUrl = (order) => {
  const { pickup_coords: p, dropoff_coords: d } = order;
  if (p && d && p.lat && d.lat) {
    return `https://www.google.com/maps/dir/${p.lat},${p.lng}/${d.lat},${d.lng}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(order.dropoff || "")}`;
};

const ActiveDeliveryCard = ({ order, onChanged }) => {
  const [busy, setBusy] = useState(null);
  const current = order.rider_status || "Accepted";
  const delivered = current === "Delivered" || order.status === "Delivered";
  const next = NEXT_ACTIONS.find((a) => a.from.includes(current));

  const handleAction = async (action) => {
    setBusy(action);
    try {
      await updateOrderStatus(order.order_no, action);
      toast.success(`Status updated to ${action}.`);
      if (onChanged) onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed.");
      if (onChanged) onChanged();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-200/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <FoodPhoto
            src={order.restaurant_logo}
            alt={order.restaurant}
            className="h-11 w-11 rounded-xl"
          />
          <div>
            <p className="text-sm font-bold text-base-content">{order.restaurant}</p>
            <p className="text-xs text-base-content/50">
              {order.order_no} · {order.distance_km} km away
            </p>
          </div>
        </div>
        <StatusBadge status={current} />
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* Left: route + customer */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                Pickup
              </p>
              <p className="text-sm font-medium text-base-content">{order.restaurant}</p>
              <p className="text-xs text-base-content/60">{order.pickup}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                Drop-off
              </p>
              <p className="text-sm font-medium text-base-content">{order.dropoff || "—"}</p>
              <p className="text-xs text-base-content/60">{order.customer}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-3">
            <Avatar src={null} name={order.customer} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-base-content">{order.customer}</p>
              <a
                href={`tel:${order.customer_phone || order.phone || ""}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                {order.customer_phone || order.phone || "—"}
              </a>
              <p className="mt-1 flex items-center gap-1 text-xs text-base-content/50">
                <CalendarClock className="h-3.5 w-3.5" />
                Ordered {fmtDate(order.created_at)}
              </p>
            </div>
            <a
              href={`tel:${order.customer_phone || order.phone || ""}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-content"
              title="Contact customer"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Right: items + actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-xl border border-base-300 p-3">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-base-content/40" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40">
                Items
              </p>
              <p className="mt-1 text-sm text-base-content">
                {Array.isArray(order.items_detail) && order.items_detail.length
                  ? order.items_detail.map((it) => (
                      <span key={it.food_id || it.food_name} className="mr-3">
                        {it.food_name || "Item"} × {it.quantity ?? 1}
                      </span>
                    ))
                  : order.items || "—"}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <span className="text-base-content/60">
                  Subtotal <b className="text-base-content">{fmtMoney(order.total - order.delivery_fee)}</b>
                </span>
                <span className="text-base-content/60">
                  Your fee <b className="text-emerald-600">{fmtMoney(order.earnings)}</b>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <a
              href={`tel:${order.customer_phone || order.phone || ""}`}
              className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content hover:bg-base-200"
            >
              <Phone className="h-4 w-4 text-primary" /> Contact Customer
            </a>
            <a
              href={mapsUrl(order)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content hover:bg-base-200"
            >
              <Navigation className="h-4 w-4 text-emerald-600" /> Start Navigation
            </a>
            {next && (
              <button
                onClick={() => handleAction(next.label)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
              >
                {busy === next.label && <Loader2 className="h-4 w-4 animate-spin" />}
                {next.cta}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="border-t border-base-300 bg-base-200/40 px-5 py-4">
        <DeliveryProgress current={current} delivered={delivered} busy={busy === next?.label} />
      </div>
    </div>
  );
};

export default ActiveDeliveryCard;