import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Activity } from "lucide-react";

const STATUS_COLORS = {
  Pending: "#fbbf24",
  Confirmed: "#38bdf8",
  Preparing: "#a78bfa",
  "Ready for Pickup": "#22d3ee",
  "On the Way": "#3b82f6",
  Delivered: "#34d399",
  Cancelled: "#fb7185",
};

const ORDER_ORDER = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready for Pickup",
  "On the Way",
  "Delivered",
  "Cancelled",
];

const OrderAnalyticsChart = ({ counts = {}, className = "" }) => {
  const data = ORDER_ORDER.map((k) => ({
    name: k.length > 14 ? k.replace(" for ", "\n") : k,
    status: k,
    count: counts[k] || 0,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Order Analytics</h3>
      </div>
      <p className="mt-0.5 text-sm text-base-content/50">All time order counts by status</p>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 0 }} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e7ee" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "#64748b" }}
              interval={0}
              angle={-24}
              textAnchor="end"
              height={44}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={30}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(value, _n, item) => [value, item?.payload?.status || "Orders"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #d9d7e3",
                boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Orders">
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status] || "#570df8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-base-content/50">Total tracked: {total.toLocaleString()} orders</p>
    </div>
  );
};

export default OrderAnalyticsChart;