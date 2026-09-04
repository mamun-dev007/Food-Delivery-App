import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { ClipboardList, RefreshCw } from "lucide-react";
import { acceptOrder, fetchAvailableOrders } from "../../../services/riderService";
import AvailableOrderCard from "../../../components/rider/AvailableOrderCard";
import EmptyState from "../../../components/rider/EmptyState";
import RiderStatCard from "../../../components/rider/RiderStatCard";

const Available = () => {
  const { isOnline } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setOrders(await fetchAvailableOrders());
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (orderNo) => {
    if (!isOnline) {
      toast.error("You're offline. Go online to accept orders.");
      return;
    }
    setAccepting(orderNo);
    try {
      await acceptOrder(orderNo);
      toast.success("Delivery accepted! Check Active Delivery.");
      await load(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not accept the order.");
      await load(true);
    } finally {
      setAccepting(null);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  const activeCount = orders.filter((o) => o.status === "On The Way").length;
  const preparingCount = orders.length - activeCount;

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-base-content">Available Orders</h2>
          <p className="text-sm text-base-content/50">
            {orders.length} orders ready to be claimed{isOnline ? " · You're online" : " · You're offline"}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RiderStatCard
          label="Ready for Pickup"
          value={preparingCount}
          icon={ClipboardList}
          tint="orange"
          sub="Preparing orders"
        />
        <RiderStatCard
          label="Out for Delivery"
          value={activeCount}
          icon={ClipboardList}
          tint="blue"
          sub="On The Way"
        />
        <RiderStatCard
          label="Avg. Distance"
          value={orders.length ? `${(orders.reduce((s, o) => s + Number(o.distance_km || 0), 0) / orders.length).toFixed(1)} km` : "—"}
          icon={ClipboardList}
          tint="purple"
        />
        <RiderStatCard
          label="Max Fee"
          value={
            orders.length
              ? `৳${Math.max(...orders.map((o) => Number(o.delivery_fee || 0)))}`
              : "—"
          }
          icon={ClipboardList}
          tint="green"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
          ))}
        {!loading && orders.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={ClipboardList}
              title="No orders available right now"
              message="New delivery requests will appear here as soon as restaurants prepare them. Pull to refresh."
              action={
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-focus"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              }
            />
          </div>
        )}
        {orders.map((order) => (
          <AvailableOrderCard
            key={order.id}
            order={order}
            busy={accepting === order.order_no}
            onAccept={() => handleAccept(order.order_no)}
          />
        ))}
      </div>
    </div>
  );
};

export default Available;