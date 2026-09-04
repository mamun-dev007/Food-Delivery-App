import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, ClipboardList, Banknote, PackageCheck, TrendingUp } from "lucide-react";
import { fetchAdminReports } from "../../services/adminService";
import { StatGridSkeleton } from "../../components/dashboard/Skeleton";

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const KPIS = [
  {
    key: "total_orders",
    label: "Total Orders",
    icon: ClipboardList,
    tint: "bg-primary/10 text-primary",
    value: (r) => Number(r.total_orders || 0).toLocaleString("en-IN"),
    desc: "Every order placed on the platform across all statuses.",
  },
  {
    key: "total_revenue",
    label: "Total Revenue",
    icon: Banknote,
    tint: "bg-sky-100 text-sky-600",
    value: (r) => fmtMoney(r.total_revenue),
    desc: "Gross revenue collected from orders in the reporting window.",
  },
  {
    key: "delivered_orders",
    label: "Delivered Orders",
    icon: PackageCheck,
    tint: "bg-emerald-100 text-emerald-600",
    value: (r) => Number(r.delivered_orders || 0).toLocaleString("en-IN"),
    desc: "Orders that were successfully delivered to customers.",
  },
  {
    key: "avg_order_value",
    label: "Avg Order Value",
    icon: TrendingUp,
    tint: "bg-violet-100 text-violet-600",
    value: (r) => fmtMoney(r.avg_order_value),
    desc: "Average amount spent per order (revenue ÷ total orders).",
  },
];

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReports();
      setReport(data);
    } catch (err) {
      toast.error(err?.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reload = () => load();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Reports</h1>
          <p className="mt-0.5 text-sm text-base-content/50">Platform reporting snapshot</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <StatGridSkeleton count={4} />
      ) : !report ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="py-10 text-center text-sm text-base-content/50">No report yet</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.key} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-base-content/60">{k.label}</p>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.tint}`}>
                    <k.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-base-content">{k.value(report)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h3 className="text-base font-bold text-base-content">Report summary</h3>
            <p className="mt-0.5 text-sm text-base-content/50">How each metric is measured</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {KPIS.map((k) => (
                <div key={k.key} className="rounded-xl bg-base-200 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                    {k.label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-base-content">{k.value(report)}</dd>
                  <p className="mt-1 text-sm text-base-content/60">{k.desc}</p>
                </div>
              ))}
            </dl>
            {report.generated_at && (
              <p className="mt-4 text-xs text-base-content/50">
                Generated: {new Date(report.generated_at).toLocaleString()}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;