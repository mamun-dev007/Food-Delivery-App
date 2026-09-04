import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import DashboardCard from "./DashboardCard";

const OrdersTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 shadow-lg text-xs text-base-content">
      <p className="font-semibold text-base-content">{label}</p>
      <p>Orders: <span className="font-semibold">{payload[0].value}</span></p>
    </div>
  );
};

const OrdersOverviewChart = ({ data }) => (
  <DashboardCard title="Orders Overview" subtitle="Daily orders this week">
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
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
            width={40}
            allowDecimals={false}
          />
          <Tooltip content={<OrdersTooltip />} cursor={{ fill: "#570df81a" }} />
          <Bar
            dataKey="orders"
            name="Orders"
            fill="#f000b8"
            radius={[6, 6, 0, 0]}
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </DashboardCard>
);

export default OrdersOverviewChart;