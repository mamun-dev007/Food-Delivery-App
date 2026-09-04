import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Crown, DollarSign, Package, Star } from "lucide-react";
import { fetchPerformance } from "../../../services/riderService";
import { EMPTY_PERFORMANCE } from "../../../services/riderService";
import PerformanceCard from "../../../components/rider/PerformanceCard";
import RiderStatCard from "../../../components/rider/RiderStatCard";
import { fmtMoney } from "../../../components/rider/shared";

const TooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid hsl(var(--bc) / 0.1)",
  background: "hsl(var(--b1))",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
};

const ChartCard = ({ title, sub, data, dataKey, color }) => (
  <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <h3 className="text-base font-bold text-base-content">{title}</h3>
    <p className="text-xs text-base-content/50">{sub}</p>
    <div className="mt-4 h-56">
      {data.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-base-content/40">
          No data yet
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.07)" vertical={false} />
            <XAxis
              dataKey={dataKey}
              tick={{ fontSize: 10, fill: "hsl(var(--bc) / 0.5)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--bc) / 0.5)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={TooltipStyle} cursor={{ fill: "hsl(var(--bc) / 0.04)" }} />
            <Bar dataKey="deliveries" fill={color} radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const Performance = () => {
  const [data, setData] = useState(EMPTY_PERFORMANCE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchPerformance());
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load performance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <h2 className="text-lg font-bold tracking-tight text-base-content">Performance</h2>
      <p className="text-sm text-base-content/50">Your delivery activity and quality stats</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RiderStatCard
          label="Total Deliveries"
          value={data.totals.deliveries}
          icon={Package}
          tint="blue"
          loading={loading}
        />
        <RiderStatCard
          label="Total Earnings"
          value={fmtMoney(data.totals.earnings)}
          icon={DollarSign}
          tint="orange"
          loading={loading}
        />
        <RiderStatCard
          label="Avg. per Delivery"
          value={fmtMoney(data.totals.avg_order)}
          icon={Crown}
          tint="amber"
          loading={loading}
        />
        <RiderStatCard
          label="Rating"
          value={data.rates.rating ? Number(data.rates.rating).toFixed(1) : "—"}
          icon={Star}
          tint="purple"
          sub={data.rates.rating ? "Great!" : null}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PerformanceCard rates={data.rates} loading={loading} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <ChartCard
            title="Last 7 Days"
            sub="Deliveries per day"
            data={data.weekly}
            dataKey="day"
            color="#570df8"
          />
          <ChartCard
            title="Last 6 Months"
            sub="Deliveries per month"
            data={data.monthly}
            dataKey="month"
            color="#f000b8"
          />
        </div>
      </div>
    </div>
  );
};

export default Performance;