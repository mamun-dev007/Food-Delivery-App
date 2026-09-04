import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Users } from "lucide-react";

const SLICES = [
  { key: "customers", label: "Customers", color: "#570df8" },
  { key: "owners", label: "Restaurant Owners", color: "#38bdf8" },
  { key: "riders", label: "Riders", color: "#a78bfa" },
];

const UserDistributionChart = ({ distribution = {}, className = "" }) => {
  const total = distribution.total || 0;
  const data = SLICES.map((s) => ({
    name: s.label,
    value: Number(distribution[s.key] || 0),
    color: s.color,
  })).filter((d) => d.value > 0);

  return (
    <div className={`relative rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">User Distribution</h3>
      </div>
      <p className="mt-0.5 text-sm text-base-content/50">Platform accounts by role</p>

      <div className="relative mt-2 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value.toLocaleString(), name]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #d9d7e3",
                boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight text-base-content">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-base-content/50">Total users</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {SLICES.map((s) => {
          const v = Number(distribution[s.key] || 0);
          const p = total ? Math.round((v / total) * 100) : 0;
          return (
            <div key={s.key} className="rounded-xl bg-base-200 p-2 text-center">
              <span
                className="mx-auto mb-1 block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <p className="text-sm font-bold text-base-content">{p}%</p>
              <p className="truncate text-[11px] text-base-content/50">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserDistributionChart;