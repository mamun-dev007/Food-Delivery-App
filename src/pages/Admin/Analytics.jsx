import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, ClipboardList, Banknote, CalendarRange, Wallet, BarChart3, PieChart, Waypoints, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RPieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchAdminAnalytics } from "../../services/adminService";
import { StatGridSkeleton, ChartCardSkeleton } from "../../components/dashboard/Skeleton";

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtMonth = (m) => {
  if (!m) return "";
  const [y, mo] = String(m).split("-");
  return `${MONTHS[Number(mo) - 1] || mo || ""} ${String(y).slice(-2)}`;
};

const STATUS_BAR_COLORS = {
  Pending: "bg-amber-500",
  Confirmed: "bg-sky-500",
  Preparing: "bg-violet-500",
  "Ready for Pickup": "bg-cyan-500",
  "On the Way": "bg-blue-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-rose-500",
};

const ORDER_FLOW = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready for Pickup",
  "On the Way",
  "Delivered",
];

const TILE_TINTS = {
  orders: "bg-primary/10 text-primary",
  revenue: "bg-info/10 text-info",
  months: "bg-success/10 text-success",
  payment: "bg-warning/10 text-warning",
};

const PAY_COLORS = ["#570df8", "#f000b8", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa"];

const TooltipStyle = {
  borderRadius: 12,
  border: "1px solid #d9d7e3",
  boxShadow: "0 8px 24px rgba(15,23,42,.08)",
  fontSize: 12,
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalytics();
      setData(res);
    } catch (err) {
      toast.error(err?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reload = () => load();

  const monthly = Array.isArray(data?.monthly) ? data.monthly : [];
  const payEntries = Object.entries(data?.revenue_by_payment || {}).sort((a, b) => b[1] - a[1]);
  const topPay = payEntries.length ? payEntries[0][0] : "—";
  const statusEntries = Object.entries(data?.status_counts || {});
  const statusTotal = statusEntries.reduce((s, [, c]) => s + Number(c || 0), 0);

  const tiles = [
    { label: "Total Orders", value: Number(data?.total_orders || 0).toLocaleString("en-IN"), icon: ClipboardList, tint: TILE_TINTS.orders },
    { label: "Total Revenue", value: fmtMoney(data?.total_revenue), icon: Banknote, tint: TILE_TINTS.revenue },
    { label: "Months Count", value: monthly.length, icon: CalendarRange, tint: TILE_TINTS.months },
    { label: "Top Payment Method", value: topPay, icon: Wallet, tint: TILE_TINTS.payment },
  ];

  if (loading)
    return (
      <div className="space-y-4">
        <StatGridSkeleton count={4} />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Analytics</h1>
          <p className="mt-0.5 text-sm text-base-content/50">Monthly performance, payments and order health</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-base-content/60">{t.label}</p>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.tint}`}>
                <t.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 truncate text-2xl font-bold tracking-tight text-base-content">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-base-content">Monthly Revenue & Orders</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-base-content/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Orders
            </span>
          </div>
        </div>
        <p className="mt-0.5 text-sm text-base-content/50">Revenue (area) vs orders (line) per month</p>
        <div className="mt-4 h-72 w-full">
          {monthly.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/50">No monthly data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthly.map((m) => ({ ...m, monthLabel: fmtMonth(m.month) }))}
                margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#570df8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#570df8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f000b8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f000b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e7ee" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#8b8b9e" }}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#8b8b9e" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fontSize: 11, fill: "#8b8b9e" }}
                  tickFormatter={(v) => (v >= 10000 ? `${Math.round(v / 1000)}k` : v)}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === "revenue" ? [fmtMoney(value), "Revenue"] : [Number(value).toLocaleString("en-IN"), "Orders"]
                  }
                  contentStyle={TooltipStyle}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#570df8"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  activeDot={{ r: 4 }}
                  name="Revenue"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#f000b8"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#f000b8", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-base-content">Revenue by Payment Method</h3>
          </div>
          {payEntries.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/50">No payment data yet</p>
          ) : (
            <div className="mt-2">
              <div className="relative mx-auto h-56 w-full max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={payEntries.map(([name, amount], i) => ({
                        name,
                        value: Number(amount || 0),
                        color: PAY_COLORS[i % PAY_COLORS.length],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {payEntries.map(([name], i) => (
                        <Cell key={name} fill={PAY_COLORS[i % PAY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [fmtMoney(value), name]}
                      contentStyle={TooltipStyle}
                    />
                  </RPieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold tracking-tight text-base-content">
                    {fmtMoney(data?.total_revenue)}
                  </span>
                  <span className="text-xs text-base-content/50">Payment revenue</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {payEntries.map(([name, amount], i) => {
                  const total = Number(data?.total_revenue || 0);
                  const pct = total ? Math.round((Number(amount) / total) * 100) : 0;
                  return (
                    <div key={name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PAY_COLORS[i % PAY_COLORS.length] }}
                      />
                      <span className="flex-1 font-medium text-base-content">{name}</span>
                      <span className="text-base-content/70">{fmtMoney(amount)}</span>
                      <span className="w-10 text-right text-xs font-semibold text-base-content/50">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-base-content">Orders by Status</h3>
          </div>
          <div className="mt-4 space-y-4">
            {statusEntries.length === 0 ? (
              <p className="py-10 text-center text-sm text-base-content/50">No order data yet</p>
            ) : (
              statusEntries.map(([status, count]) => {
                const pct = statusTotal ? Math.round((Number(count) / statusTotal) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-base-content">{status}</span>
                      <span className="text-base-content/70">
                        {Number(count).toLocaleString("en-IN")} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-base-200">
                      <div
                        className={`h-2 rounded-full ${STATUS_BAR_COLORS[status] || "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Waypoints className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-base-content">Order Flow</h3>
          </div>
          <p className="text-sm text-base-content/50">Simplified order lifecycle with stage conversion</p>
        </div>

        <div className="mt-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            {ORDER_FLOW.map((s, i) => {
              const n = Number(data?.status_counts?.[s] || 0);
              const pct = statusTotal ? Math.round((n / statusTotal) * 100) : 0;
              const prev = i > 0 ? Number(data?.status_counts?.[ORDER_FLOW[i - 1]] || 0) : 0;
              const conv = prev ? Math.round((n / prev) * 100) : 0;
              const isLast = i === ORDER_FLOW.length - 1;
              const device = STATUS_BAR_COLORS[s] || "bg-primary";
              return (
                <div
                  key={s}
                  className={`flex h-full w-full flex-col items-center gap-1 rounded-2xl border p-3 text-center ${
                    isLast ? "border-success bg-success/10" : "border-base-300 bg-base-100"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isLast ? "bg-success/15 text-success" : "bg-base-200 text-base-content/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-base-content">
                    <span className={`h-2 w-2 rounded-full ${device}`} /> {s}
                  </span>
                  <p
                    className={`text-2xl font-extrabold tracking-tight ${isLast ? "text-success" : "text-base-content"}`}
                  >
                    {n.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-base-content/50">{pct}% of total</p>
                  {i > 0 ? (
                    <div className="mt-auto flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <ArrowRight className="h-3 w-3" />
                      {conv}% from previous
                    </div>
                  ) : (
                    <div className="mt-auto" />
                  )}
                </div>
              );
            })}
            <div className="flex h-full w-full flex-col items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                !
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Cancelled
              </span>
              <p className="text-2xl font-extrabold tracking-tight text-rose-600">
                {Number(data?.status_counts?.Cancelled || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-rose-500/70">
                {statusTotal ? Math.round(((Number(data?.status_counts?.Cancelled || 0)) / statusTotal) * 100) : 0}%
                of total
              </p>
              <div className="mt-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;