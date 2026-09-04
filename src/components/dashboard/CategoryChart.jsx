import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import DashboardCard from "./DashboardCard";

const COLORS = ["#570df8", "#f000b8", "#1fb2a6", "#f0a10b", "#3b9eff"];

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 shadow-lg text-xs text-base-content">
      {p.name}: <span className="font-semibold">{p.value}%</span>
    </div>
  );
};

const CategoryChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <DashboardCard title="Top Categories" subtitle="Share of your category sales">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={46}
              outerRadius={70}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-base-content/70">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {d.name}
            </span>
            <span className="font-semibold text-base-content">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default CategoryChart;