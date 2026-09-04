import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  CartesianGrid,
} from "recharts";
import DashboardCard from "./DashboardCard";

const statusColor = {
  ok: "#570df8",
  low: "#f0a10b",
  out: "#ff5670",
};

const StockTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-base-content">{d.name}</p>
      <p className="mt-0.5 text-base-content/70">
        Stock:{" "}
        <span className="font-semibold text-base-content">{d.stock}</span>
      </p>
      <p className="text-base-content/50">
        {d.status === "out"
          ? "Out of stock"
          : d.status === "low"
            ? "Low stock"
            : "In stock"}
      </p>
    </div>
  );
};

const StockChart = ({ data }) => {
  const chartData = data?.top?.length ? data.top : [];

  return (
    <DashboardCard
      title="Stock Overview"
      subtitle="Current stock levels of your top items"
      className="lg:col-span-2"
      action={
        <a
          href="/dashboard/stock"
          className="text-sm font-medium text-primary"
        >
          View Full Stock
        </a>
      }
    >
      {chartData.length === 0 ? (
        <div className="flex h-60 items-center justify-center text-sm text-base-content/50">
          No foods in your menu yet.
        </div>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <Tooltip content={<StockTooltip />} cursor={{ fill: "#570df81a" }} />
              <Bar dataKey="stock" name="Stock" radius={[0, 6, 6, 0]} maxBarSize={16}>
                {chartData.map((d) => (
                  <Cell key={d.id || d.name} fill={statusColor[d.status] || statusColor.ok} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
};

export default StockChart;