const TINTS = {
  violet: { bg: "bg-primary/10", text: "text-primary" },
  amber: { bg: "bg-warning/15", text: "text-warning" },
  green: { bg: "bg-success/15", text: "text-success" },
  orange: { bg: "bg-accent/15", text: "text-accent" },
};

const StatCard = ({ label, value, icon, tint = "violet", sub }) => {
  const t = TINTS[tint] || TINTS.violet;
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-base-content/60">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-base-content lg:text-3xl">
            {value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.bg}`}>
          <Icon className={`h-5 w-5 ${t.text}`} />
        </span>
      </div>
      {sub && <p className="mt-2 text-xs text-base-content/40">{sub}</p>}
    </div>
  );
};

export default StatCard;