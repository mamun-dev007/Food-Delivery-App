import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Bike, CheckCircle2, ClipboardList, Clock } from "lucide-react";
import { fetchMyOrders } from "../../../services/riderService";
import RiderStatCard from "../../../components/rider/RiderStatCard";
import ActiveDeliveryCard from "../../../components/rider/ActiveDeliveryCard";
import StatusBadge from "../../../components/rider/StatusBadge";
import EmptyState from "../../../components/rider/EmptyState";
import { fmtDate, fmtMoney } from "../../../components/rider/shared";

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

const Deliveries = () => {
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyOrders();
      setActive(data.active || []);
      setHistory(data.history || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    if (tab === "active") return active;
    if (tab === "completed") return history;
    return [
      ...history.map((o) => ({ ...o, done: true })),
      ...active.map((o) => ({ ...o, done: false })),
    ];
  }, [tab, active, history]);

  const earningToday = history.reduce(
    (s, o) => s + (new Date(o.created_at).toDateString() === new Date().toDateString() ? Number(o.earnings || 0) : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <h2 className="text-lg font-bold tracking-tight text-base-content">My Deliveries</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <RiderStatCard label="Active" value={active.length} icon={Clock} tint="blue" />
        <RiderStatCard label="Completed" value={history.length} icon={CheckCircle2} tint="green" />
        <RiderStatCard label="Earned Today" value={fmtMoney(earningToday)} icon={Bike} tint="orange" />
      </div>

      <div className="mt-6 flex gap-1 rounded-xl border border-base-300 bg-base-200/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-content shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${tab === t.key ? "text-primary-content/70" : "text-base-content/40"}`}>
              {t.key === "active" ? active.length : t.key === "completed" ? history.length : active.length + history.length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
          ))
        ) : shown.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tab === "completed" ? "No completed deliveries yet" : "No deliveries here yet"}
            message={
              tab === "active"
                ? "Accept an order to start delivering."
                : "Your completed deliveries will appear here."
            }
            action={
              tab !== "completed" ? (
                <Link
                  to="/rider/orders"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-focus"
                >
                  <ClipboardList className="h-4 w-4" /> Browse Orders
                </Link>
              ) : null
            }
          />
        ) : (
          shown.map((o) =>
            o.done ? (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-primary">{o.order_no}</p>
                    <StatusBadge status="Delivered" />
                  </div>
                  <p className="mt-1 text-sm font-medium text-base-content">{o.restaurant}</p>
                  <p className="mt-0.5 text-xs text-base-content/50">
                    {o.customer} · {o.distance_km} km · {fmtDate(o.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{fmtMoney(o.earnings)}</p>
                  <p className="text-xs text-base-content/40">earned</p>
                </div>
              </div>
            ) : (
              <ActiveDeliveryCard key={o.id} order={o} onChanged={load} />
            ),
          )
        )}
      </div>
    </div>
  );
};

export default Deliveries;