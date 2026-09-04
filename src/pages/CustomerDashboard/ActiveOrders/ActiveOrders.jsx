import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useOrderSummary } from "../../../hooks/useOrderSummary";
import OrderCard from "../../../components/customer/OrderCard";
import { orderIsActive } from "../../../utils/order";
import CustomerEmptyState from "../../../components/customer/EmptyState";
import { ListSkeleton } from "../../../components/dashboard/Skeleton";

const POLL_MS = 30000;

const ActiveOrders = () => {
  const { orders, loading, error, reload } = useOrderSummary("year");
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const activeOrders = orders.filter((o) => orderIsActive(o.status));

  // Live refresh: poll every 30s so statuses/tracking stay current without a
  // manual reload. Cleared on unmount.
  useEffect(() => {
    timerRef.current = setInterval(async () => {
      setRefreshing(true);
      try {
        await reload();
      } catch {
        // keep last data
      } finally {
        setRefreshing(false);
      }
    }, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [reload]);

  useEffect(() => {
    if (error) toast.error(error || "Failed to load orders.");
  }, [error]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
      toast.success("Orders refreshed.");
    } catch {
      toast.error("Could not refresh orders.");
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Active Orders</h1>
          <p className="text-sm text-base-content/50">
            Orders that are being prepared or delivered — auto-refresh every 30s.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content/70 transition-colors hover:bg-base-200 disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          {refreshing ? "Refreshing..." : "Refresh Now"}
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : activeOrders.length === 0 ? (
        <CustomerEmptyState
          icon={Truck}
          title="No active orders right now"
          message="All caught up! Once a new order starts being prepared, it will appear here with live tracking."
          action={
            <Link
              to="/menu"
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
            >
              Order Something New
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {activeOrders.map((o) => (
            <OrderCard key={o.id} order={o} showTracker />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveOrders;