import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { fmtMoney } from "./shared";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const TooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid hsl(var(--bc) / 0.1)",
  background: "hsl(var(--b1))",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
};

const EarningsChart = ({ data, loading = false }) => {
  const [range, setRange] = useState("week");
  const weekly = Array.isArray(data?.weekly) ? data.weekly : [];

  const total = useMemo(
    () =>
      weekly.reduce((s, d) => s + Number(d.earnings || 0), 0),
    [weekly],
  );
  const today = Number(data?.today || data?.this_week || 0);

  const selected = {
    today: Number(data?.today || 0),
    week: Number(data?.this_week || total),
    month: Number(data?.this_month || 0),
    year: Number(data?.this_year || 0),
  }[range];

  // Real delta: today vs the average of the previous 6 chart days.
  const delta =
    range === "week" && weekly.length > 1
      ? (() => {
          const prev = weekly.slice(0, weekly.length - 1);
          const avg = prev.reduce((s, d) => s + Number(d.earnings || 0), 0) / prev.length;
          return avg ? Math.round(((today - avg) / avg) * 100) : 0;
        })()
      : null;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-base-content">Earnings Overview</h3>
          <p className="text-xs text-base-content/50">Daily delivery earnings</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-base-300 bg-base-200/50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.key
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-bold tracking-tight text-base-content">{fmtMoney(selected)}</p>
          <p className="text-xs text-base-content/50">Earned · {RANGES.find((r) => r.key === range)?.label}</p>
        </div>
        {delta != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            {delta >= 0 ? "+" : ""}
            {delta}% vs this week
          </span>
        )}
      </div>

      <div className="mt-5 h-60 overflow-hidden rounded-xl bg-gradient-to-br from-[#570df8]/50 via-transparent to-[#f000b8]/50 p-3 ring-1 ring-[#570df8]/20">
        <div className="h-full w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-base-content/40">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : weekly.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-base-content/40">
              No earnings data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#570df8" stopOpacity={0.35} />
                  <stop offset="55%" stopColor="#f000b8" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#f000b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="earningsStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#570df8" />
                  <stop offset="100%" stopColor="#f000b8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.07)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(var(--bc) / 0.5)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--bc) / 0.5)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `৳${v}`}
              />
              <Tooltip
                formatter={(value) => [fmtMoney(value), "Earnings"]}
                contentStyle={{
                  ...TooltipStyle,
                  border: "1px solid hsl(var(--p) / 0.15)",
                }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="url(#earningsStroke)"
                strokeWidth={2.5}
                fill="url(#earningsGradient)"
                dot={{ r: 3, fill: "#570df8", strokeWidth: 0, fillOpacity: 0.9 }}
                activeDot={{ r: 5, fill: "#f000b8" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsChart;