import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Banknote } from "lucide-react";

const RANGES = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const RANGE_COLORS = {
  week: "bg-primary text-primary-content shadow-md shadow-primary/30",
  month: "bg-primary text-primary-content shadow-md shadow-primary/30",
  year: "bg-primary text-primary-content shadow-md shadow-primary/30",
};

const fmt = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Admin Commission card driven by real MongoDB data: total 5% commission,
// restaurant payout, completed sub-orders, and an Area chart of the commission
// series (week / month / year).
const AdminCommissionCard = ({ stats = {}, revenue = {}, className = "" }) => {
  const [range, setRange] = useState("week");

  const series = useMemo(() => revenue[range] || [], [revenue, range]);
  const periodTotal = series.reduce((s, d) => s + Number(d.current || 0), 0);

  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-content">
              <Banknote className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-base-content">Admin Commission (5%)</h3>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-base-content">
            {fmt(stats.total_revenue)}
          </p>
          <p className="mt-1 text-xs text-base-content/50">
            {fmt(stats.restaurant_payout)} paid to restaurants · {stats.completed_orders ?? 0}{" "}
            completed sub-order{(stats.completed_orders ?? 0) === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl bg-base-200 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.key
                  ? RANGE_COLORS[r.key]
                  : "text-base-content/60 hover:bg-base-100 hover:text-base-content"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        {series.length === 0 ? (
          <p className="py-16 text-center text-sm text-base-content/50">No commission data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="commissionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#570df8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#570df8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e7ee" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                width={54}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={54}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <Tooltip
                formatter={(value, name) => [fmt(value), name]}
                labelFormatter={(label) => `Period: ${label}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #d9d7e3",
                  boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                dataKey="current"
                name="Admin Commission (৳)"
                fill="#570df8"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="payout"
                name="Restaurant Payout (৳)"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="previous"
                name="Previous (৳)"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#commissionFill)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-base-200 pt-3 text-xs text-base-content/60">
        <span>Commission so far</span>
        <span className="font-bold text-base-content">{fmt(periodTotal)}</span>
      </div>
    </div>
  );
};

export default AdminCommissionCard;