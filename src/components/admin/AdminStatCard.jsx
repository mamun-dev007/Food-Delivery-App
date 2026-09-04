const ICONS = {
  orders: { color: "bg-primary/10 text-primary" },
  customers: { color: "bg-secondary/10 text-secondary" },
  restaurants: { color: "bg-info/10 text-info" },
  riders: { color: "bg-warning/10 text-warning" },
  revenue: { color: "bg-success/10 text-success" },
  pending: { color: "bg-warning/10 text-warning" },
};

const AdminStatCard = ({ label, value, icon: Icon, tone = "orders", change, hint }) => {
  const c = ICONS[tone] || ICONS.orders;
  const up = change > 0;
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {typeof change === "number" && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              up ? "bg-success/10 text-success" : change < 0 ? "bg-error/10 text-error" : "bg-base-200 text-base-content/60"
            }`}
          >
            {up ? "↑" : change < 0 ? "↓" : ""}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-base-content">{value}</p>
      <p className="mt-1 text-sm font-medium text-base-content/60">{label}</p>
      {hint && <p className="mt-1 text-xs text-base-content/50">{hint}</p>}
    </div>
  );
};

export default AdminStatCard;