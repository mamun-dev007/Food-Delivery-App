const TINTS = {
  green: "bg-emerald-500/10 text-emerald-600",
  blue: "bg-sky-500/10 text-sky-600",
  amber: "bg-amber-500/10 text-amber-600",
  rose: "bg-rose-500/10 text-rose-600",
  purple: "bg-[#570df8]/10 text-[#570df8]",
  orange: "bg-orange-500/10 text-orange-600",
  sky: "bg-sky-500/10 text-sky-600",
};

const CustomerStatCard = ({ label, value, icon, tint = "green", sub, loading = false }) => {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-base-content/60">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TINTS[tint] || TINTS.green}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-base-200" />
      ) : (
        <p className="mt-2 text-2xl font-bold tracking-tight text-base-content">{value}</p>
      )}

      {sub && <p className="mt-1 text-xs text-base-content/50">{sub}</p>}
    </div>
  );
};

export default CustomerStatCard;