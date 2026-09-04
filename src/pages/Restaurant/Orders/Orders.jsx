import { useCallback, useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchOwnerOrders, updateOwnerOrderStatus } from "../../../services/restaurantService";
import { TableSkeleton } from "../../../components/dashboard/Skeleton";

const statusBadge = {
  Pending: "badge-warning",
  Preparing: "badge-info",
  "On The Way": "badge-primary",
  Delivered: "badge-success",
  Cancelled: "badge-error",
};

// URL segment -> backend status. (restaurant "On The Way" == sidebar "Ready"
// row badge maps to the internal status column.)
const ROUTE_TO_STATUS = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "On The Way",
  completed: "Delivered",
  cancelled: "Cancelled",
};

const FILTER_TABS = [
  { route: "", label: "All" },
  { route: "pending", label: "Pending" },
  { route: "preparing", label: "Preparing" },
  { route: "ready", label: "Ready" },
  { route: "completed", label: "Completed" },
  { route: "cancelled", label: "Cancelled" },
];

const FLOW_INDEX = { Pending: 0, Preparing: 1, "On The Way": 2 };

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const RestaurantOrders = ({ base = "/restaurant" } = {}) => {
  const { status = "" } = useParams();
  const targetStatus = ROUTE_TO_STATUS[status] || null;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchOwnerOrders();
      setOrders(list);
    } catch {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = targetStatus
    ? orders.filter((o) => o.status === targetStatus)
    : orders;

  const countFor = (route) => {
    const s = ROUTE_TO_STATUS[route];
    return s ? orders.filter((o) => o.status === s).length : orders.length;
  };

  const handleStatus = async (order, nextStatus) => {
    if (nextStatus === order.status) return;
    setUpdatingId(order.id);
    try {
      await updateOwnerOrderStatus(order.order_no || order.order_id, nextStatus);
      toast.success(`Order ${order.order_no || order.order_id} marked as ${nextStatus}`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const title = FILTER_TABS.find((t) => t.route === status)?.label || "All";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title} Orders</h1>
        <p className="text-base-content/60 mt-1">
          View and update the status of your restaurant's orders.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((t) => (
          <NavLink
            key={t.route}
            to={t.route ? `${base}/orders/${t.route}` : `${base}/orders`}
            className={({ isActive }) =>
              `btn btn-sm ${isActive ? "btn-primary" : "btn-ghost border border-base-300"}`
            }
          >
            {t.label} ({countFor(t.route)})
          </NavLink>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : visible.length === 0 ? (
        <p className="text-center text-base-content/50 py-16">
          {orders.length === 0
            ? "No orders yet. Orders placed by customers will appear here."
            : `No ${title.toLowerCase()} orders right now.`}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((o) => (
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
                        {item.food_name || item.name} × {item.quantity || item.qty || 1}
                      </span>
                      <span>
                        ৳
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
                  <span>৳{Number(o.total || 0).toFixed(2)}</span>
                </div>
                <div className="mt-3">
                  {o.status === "Delivered" || o.status === "Cancelled" ? (
                    <p className="text-xs text-base-content/40">
                      {o.status === "Delivered"
                        ? `Delivered by ${o.rider_name || "rider"}. Order is complete.`
                        : "This order was cancelled."}
                    </p>
                  ) : (
                    <select
                      className="select select-bordered select-sm w-full"
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) => handleStatus(o, e.target.value)}
                    >
                      {["Pending", "Preparing", "On The Way"].map((s) => (
                        <option
                          key={s}
                          value={s}
                          disabled={FLOW_INDEX[s] < FLOW_INDEX[o.status]}
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantOrders;