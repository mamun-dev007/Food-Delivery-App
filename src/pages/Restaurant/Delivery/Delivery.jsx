import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Bike, Clock } from "lucide-react";
import {
  fetchOwnerOrders,
  updateOwnerOrderStatus,
} from "../../../services/restaurantService";

const DELIVERY_STATUSES = ["Delivered"];

const statusBadge = {
  Preparing: "badge-info",
  "On The Way": "badge-primary",
  Delivered: "badge-success",
};

const riderBadge = {
  Accepted: "badge-warning",
  "At Restaurant": "badge-info",
  "Picked Up": "badge-primary",
  "On The Way": "badge-secondary",
  Delivered: "badge-success",
};

// Forward-only: Preparing -> On The Way -> (rider delivers) Delivered.
const FLOW_INDEX = { Preparing: 0, "On The Way": 1, Delivered: 2 };

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const Deliveries = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchOwnerOrders();
      // Only delivered orders appear here — moved from Orders page after rider delivery.
      setOrders(list.filter((o) => DELIVERY_STATUSES.includes(o.status)));
    } catch {
      toast.error("Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (order, nextStatus) => {
    if (nextStatus === order.status) return;
    setUpdatingId(order.id);
    try {
      await updateOwnerOrderStatus(order.order_no || order.order_id, nextStatus);
      toast.success(
        `Order ${order.order_no || order.order_id} marked as ${nextStatus}`,
      );
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bike className="w-7 h-7 text-primary" /> Deliveries
        </h1>
        <p className="text-base-content/60 mt-1">
          Orders that have been delivered by riders. Once a rider marks an order
          as <span className="font-semibold">Delivered</span>, it appears here
          for your records.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16 text-base-content/50 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading deliveries...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-base-content/50 py-16 flex flex-col items-center gap-2">
          <Clock className="w-8 h-8" />
          <p>No delivered orders yet.</p>
          <p className="text-sm">
            When a rider completes delivery, the order will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((o) => (
            <div key={o.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{o.order_no || o.order_id}</p>
                  <span className={`badge ${statusBadge[o.status] || "badge-ghost"}`}>
                    {o.status}
                  </span>
                </div>
                <p className="text-sm text-base-content/60">
                  {o.customer || "Customer"} • {fmtDate(o.date)} • {o.payment}
                  {o.address ? ` • ${o.address}` : ""}
                </p>
                <div className="divider my-2" />
                <div className="space-y-1 text-sm">
                  {(o.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.food_name || item.name} ×{" "}
                        {item.quantity || item.qty || 1}
                      </span>
                      <span>
                        $
                        {(
                          (item.unit_price ?? item.price ?? 0) *
                          (item.quantity || item.qty || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="divider my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${Number(o.total || 0).toFixed(2)}</span>
                </div>

                {/* Rider claim status */}
                <div className="flex items-center justify-between mt-3 bg-base-200 rounded-lg px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-base-content/70">
                    <Bike className="w-4 h-4" /> Rider
                  </span>
                  {o.rider_assigned ? (
                    <span
                      className={`badge ${
                        riderBadge[o.rider_status] || "badge-success"
                      }`}
                    >
                      {o.rider_status || "Assigned"}
                    </span>
                  ) : (
                    <span className="badge badge-ghost">Not claimed yet</span>
                  )}
                </div>

                <div className="mt-3">
                  <select
                    className="select select-bordered select-sm w-full"
                    value={o.status}
                    disabled={
                      updatingId === o.id ||
                      o.status === "On The Way" ||
                      o.status === "Delivered"
                    }
                    onChange={(e) => handleStatus(o, e.target.value)}
                  >
                    {["Preparing", "On The Way", "Delivered"].map((s) => (
                      <option
                        key={s}
                        value={s}
                        disabled={FLOW_INDEX[s] < FLOW_INDEX[o.status]}
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-base-content/40 mt-1">
                  {o.status === "Delivered"
                    ? `Delivered by ${o.rider_name || "rider"}. Order complete — locked.`
                    : o.status === "On The Way"
                      ? "Rider requested. Waiting for delivery — locked."
                      : "Move forward to hand this order to a rider."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Deliveries;
