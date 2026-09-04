import { Loader2, MapPin, ReceiptText } from "lucide-react";
import { FoodPhoto } from "../admin/SmartImage";
import { fmtMoney } from "./shared";

const AvailableOrderCard = ({ order, onAccept, busy = false }) => (
  <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start gap-3">
      <FoodPhoto
        src={order.restaurant_logo}
        alt={order.restaurant}
        className="h-14 w-14 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-base-content">{order.restaurant}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-base-content/60">
              <ReceiptText className="h-3.5 w-3.5" />
              {order.order_no}
            </p>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-orange-500" />
            {order.distance_km} km away
          </span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600">
            {fmtMoney(order.delivery_fee)}
          </span>
          <span className="text-base-content/40">Fee</span>
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between gap-2 border-t border-base-200 pt-3">
      <p className="truncate text-xs text-base-content/50">
        {order.pickup || order.restaurant}
      </p>
      <button
        onClick={onAccept}
        disabled={busy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Accept
      </button>
    </div>
  </div>
);

export default AvailableOrderCard;