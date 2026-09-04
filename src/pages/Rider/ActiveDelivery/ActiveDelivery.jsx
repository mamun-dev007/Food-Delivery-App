import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bike, RefreshCw } from "lucide-react";
import { fetchMyOrders, fetchOverview } from "../../../services/riderService";
import ActiveDeliveryCard from "../../../components/rider/ActiveDeliveryCard";
import EmptyState from "../../../components/rider/EmptyState";

const ActiveDelivery = () => {
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [mine, overview] = await Promise.all([fetchMyOrders(), fetchOverview()]);
      const fromOverview = overview.active_orders || [];
      const fromMine = mine.active || [];
      const merged = [...fromMine];
      const seen = new Set(fromMine.map((o) => o.order_no));
      fromOverview.forEach((o) => {
        if (!seen.has(o.order_no)) {
          merged.push(o);
          seen.add(o.order_no);
        }
      });
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setActive(merged);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load active deliveries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-base-content">Active Delivery</h2>
          <p className="text-sm text-base-content/50">
            {active.length > 0 ? `${active.length} order(s) you're handling right now` : "No active deliveries"}
          </p>
        </div>
        {active.length > 0 && (
          <button
            onClick={async () => {
              setRefreshing(true);
              await load(true);
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        )}
      </div>

      <div className="mt-5 space-y-6">
        {active.length === 0 ? (
          <EmptyState
            icon={Bike}
            title="Nothing to deliver right now"
            message="Accept an order from Available Orders and it will show up here with live status updates."
          />
        ) : (
          active.map((order) => (
            <ActiveDeliveryCard key={order.id} order={order} onChanged={() => load(true)} />
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveDelivery;