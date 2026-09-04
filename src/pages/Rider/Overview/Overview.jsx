import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { Bike, CheckCircle2, Clock, Star, Wallet, ClipboardList } from "lucide-react";
import {
  acceptOrder,
  fetchAvailableOrders,
  fetchEarnings,
  fetchOverview,
  fetchPerformance,
  setRiderOnline,
} from "../../../services/riderService";
import { useAuthStore } from "../../../store/authStore";
import OnlineStatusToggle from "../../../components/rider/OnlineStatusToggle";
import RiderStatCard from "../../../components/rider/RiderStatCard";
import ActiveDeliveryCard from "../../../components/rider/ActiveDeliveryCard";
import AvailableOrderCard from "../../../components/rider/AvailableOrderCard";
import EarningsChart from "../../../components/rider/EarningsChart";
import PerformanceCard from "../../../components/rider/PerformanceCard";
import WeeklyBonus from "../../../components/rider/WeeklyBonus";
import AchievementCard from "../../../components/rider/AchievementCard";
import EmptyState from "../../../components/rider/EmptyState";
import ConfirmDialog from "../../../components/rider/ConfirmDialog";
import RiderSkeleton from "../../../components/rider/RiderSkeleton";
import { fmtMoney } from "../../../components/rider/shared";

const pctDelta = (arr) => {
  const nums = Array.isArray(arr) ? arr.map((d) => Number(d || 0)) : [];
  if (nums.length < 2) return null;
  const last = nums[nums.length - 1];
  const prev = nums.slice(0, -1);
  const avg = prev.reduce((s, v) => s + v, 0) / prev.length;
  if (!avg) return null;
  return Math.round(((last - avg) / avg) * 100);
};

const RiderDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const { isOnline, setIsOnline } = useOutletContext();

  const [overview, setOverview] = useState(null);
  const [available, setAvailable] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyOnline, setBusyOnline] = useState(false);
  const [confirmOffline, setConfirmOffline] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, av, ea] = await Promise.all([
        fetchOverview(),
        fetchAvailableOrders(),
        fetchEarnings(),
      ]);
      setOverview(ov);
      setAvailable(av);
      setEarnings(ea);
      let pf = null;
      try {
        pf = await fetchPerformance();
      } catch {
        pf = null;
      }
      setPerformance(pf);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleOnline = async () => {
    if (isOnline) {
      if ((overview?.pending_deliveries || 0) > 0 || (overview?.active_orders?.length || 0) > 0) {
        setConfirmOffline(true);
        return;
      }
      await goOnline(false);
    } else {
      await goOnline(true);
    }
  };

  const goOnline = async (online) => {
    setBusyOnline(true);
    try {
      const state = await setRiderOnline(online);
      setIsOnline(state);
      toast.success(state ? "You are now online." : "You are now offline.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not update availability.");
    } finally {
      setBusyOnline(false);
      setConfirmOffline(false);
    }
  };

  const handleAccept = async (orderNo) => {
    if (!isOnline) {
      toast.error("You're offline. Go online to accept orders.");
      return;
    }
    setAccepting(orderNo);
    try {
      await acceptOrder(orderNo);
      toast.success("Delivery accepted! Check Active Delivery.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not accept the order.");
      await load();
    } finally {
      setAccepting(null);
    }
  };

  const weeklyDeliveries = useMemo(() => {
    const w = (performance?.weekly || []).map((d) => ({
      key: d.day,
      value: d.deliveries,
    }));
    return w;
  }, [performance]);

  const o = overview || {};
  const weekDeliveries = (weeklyDeliveries || []).reduce((s, d) => s + Number(d.value || 0), 0);
  const rating = Number(o.rating || 0);
  const todayDelta = pctDelta(weeklyDeliveries.map((d) => d.value));

  const stats = [
    {
      label: "Today's Deliveries",
      value: o.today_deliveries ?? 0,
      icon: Bike,
      tint: "blue",
      delta: todayDelta != null ? `${todayDelta >= 0 ? "+" : ""}${todayDelta}% vs week avg` : null,
      deltaType: todayDelta != null && todayDelta < 0 ? "down" : "up",
    },
    {
      label: "Completed",
      value: o.completed_deliveries ?? 0,
      icon: CheckCircle2,
      tint: "green",
      sub: weekDeliveries ? `${weekDeliveries} this week` : null,
    },
    {
      label: "Pending Orders",
      value: o.pending_deliveries ?? 0,
      icon: Clock,
      tint: "amber",
      sub: (o.active_orders?.length || 0) ? "in your queue" : null,
    },
    {
      label: "Today's Earnings",
      value: fmtMoney(o.today_earnings),
      icon: Wallet,
      tint: "orange",
      sub: earnings ? `${fmtMoney(earnings.this_week)} this week` : null,
    },
    {
      label: "Rating",
      value: rating ? rating.toFixed(1) : "—",
      icon: Star,
      tint: "amber",
      delta: rating ? "Great!" : null,
      deltaType: "up",
      sub: o.total_reviews ? `${o.total_reviews} reviews` : null,
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <RiderSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Availability */}
      <OnlineStatusToggle
        isOnline={isOnline}
        busy={busyOnline}
        onToggle={handleToggleOnline}
      />

      {/* Stat cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <RiderStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            tint={s.tint}
            delta={s.delta}
            deltaType={s.deltaType}
            sub={s.sub}
          />
        ))}
      </div>

      {/* Active delivery + right column */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-base-content">Active Delivery</h2>
            <Link
              to="/rider/active-delivery"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View Details →
            </Link>
          </div>
          {o.active_delivery ? (
            <ActiveDeliveryCard order={o.active_delivery} onChanged={load} />
          ) : (
            <EmptyState
              icon={Bike}
              title="No active delivery"
              message="Accept an order from Available Orders and it will show up here live."
              action={
                <Link
                  to="/rider/orders"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-focus"
                >
                  <ClipboardList className="h-4 w-4" /> Browse Orders
                </Link>
              }
            />
          )}
        </div>

        <div className="space-y-4">
          <PerformanceCard rates={performance?.rates || {}} loading={false} />
          <WeeklyBonus
            weekDeliveries={weekDeliveries}
            weekEarnings={earnings?.this_week || 0}
          />
          <AchievementCard name={user?.name?.split(" ")[0]} rating={rating} />
        </div>
      </div>

      {/* Earnings + available orders */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsChart data={earnings} loading={false} />
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-base-content">Available Orders</h2>
            <Link to="/rider/orders" className="text-sm font-semibold text-primary hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {available.length === 0 ? (
              <p className="py-8 text-center text-sm text-base-content/40">
                No orders available right now.
              </p>
            ) : (
              available.slice(0, 3).map((ord) => (
                <AvailableOrderCard
                  key={ord.id}
                  order={ord}
                  busy={accepting === ord.order_no}
                  onAccept={() => handleAccept(ord.order_no)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Offline confirmation */}
      <ConfirmDialog
        open={confirmOffline}
        title="Go offline?"
        message={`You still have ${o.pending_deliveries || 0} active delivery. Going offline means you won't receive new orders until you're back online.`}
        confirmLabel="Go Offline"
        busy={busyOnline}
        onConfirm={() => goOnline(false)}
        onCancel={() => setConfirmOffline(false)}
      />
    </div>
  );
};

export default RiderDashboard;