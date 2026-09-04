import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import DashboardCard from "./DashboardCard";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-base-content">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-xs text-base-content/70">
          <span className="h-2 w-2 rounded-full" style={{ background: p.stroke }} />
          {p.name}: ৳{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const SalesOverviewChart = ({ data }) => {
  const [range, setRange] = useState("week");
  const series = data?.[range];

  return (
    <DashboardCard
      title="Sales Overview"
      subtitle="Revenue compared to the previous period"
      className="lg:col-span-2"
      action={
        <div className="flex rounded-lg border border-base-300 bg-base-200 p-0.5">
          {[
            { k: "week", label: "This Week" },
            { k: "month", label: "This Month" },
            { k: "year", label: "This Year" },
          ].map((r) => (
            <button
              key={r.k}
              onClick={() => setRange(r.k)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.k
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={(v) => `৳${v >= 1000 ? `${v / 1000}k` : v}`}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend formatter={(v) => <span className="text-xs text-base-content/60">{v}</span>} />
            <Line
              type="monotone"
              dataKey="current"
              name="This Week"
              stroke="#570df8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#570df8", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Last Week"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};

export default SalesOverviewChart;