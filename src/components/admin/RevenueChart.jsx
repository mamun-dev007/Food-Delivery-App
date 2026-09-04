import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

const fmt = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Admin revenue by company: each restaurant (company) on the X axis, with the
// 5% admin commission as bars and the restaurant's 95% payout as a line, all
// in Taka (৳). Data comes from the real MongoDB orders (delivered sub-orders).
const RevenueChart = ({ restaurants = [], className = "" }) => {
  const data = useMemo(
    () =>
      (restaurants || [])
        .slice(0, 8)
        .map((r) => ({
          day: r.name || r.restaurant_id || "Restaurant",
          commission: Number(r.commission_amount ?? r.commission ?? 0),
          payout: Number(r.revenue_amount ?? 0),
        })),
    [restaurants]
  );

  const total = data.reduce((s, d) => s + d.commission, 0);
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.commission, d.payout)));

  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-base-content">Revenue by Company</h3>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">{fmt(total)}</p>
          <p className="mt-0.5 text-xs text-base-content/50">
            5% admin commission · restaurant payout 95%
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-base-content/50">No revenue data yet</p>
      ) : (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e7ee" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={38}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                domain={[0, Math.ceil(maxVal * 1.15)]}
              />
              <Tooltip
                formatter={(value) => [fmt(value)]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #d9d7e3",
                  boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="commission"
                name="Admin Commission (৳)"
                fill="#570df8"
                radius={[4, 4, 0, 0]}
                barSize={26}
              />
              <Line
                type="monotone"
                dataKey="payout"
                name="Restaurant Payout (৳)"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;