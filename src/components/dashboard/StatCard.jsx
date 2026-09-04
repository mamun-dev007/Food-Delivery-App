import { ShoppingBag, Users, Wallet, ShoppingCart } from "lucide-react";

const ICONS = {
  total_orders: { icon: ShoppingBag, bg: "bg-primary/10 text-primary" },
  total_customers: { icon: Users, bg: "bg-secondary/10 text-secondary" },
  total_earnings: { icon: Wallet, bg: "bg-info/10 text-info" },
  pending_orders: { icon: ShoppingCart, bg: "bg-warning/10 text-warning" },
};

const StatCard = ({ stat }) => {
  const meta = ICONS[stat.key] || ICONS.total_orders;
  const Icon = meta.icon;
  const up = stat.trend !== "down";
  const display =
    stat.currency && typeof stat.value === "number"
      ? `৳${stat.value.toLocaleString()}`
      : typeof stat.value === "number"
        ? stat.value.toLocaleString()
        : stat.value;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.bg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
            up ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
            {up ? (
              <path d="M6 2l4 4H7v4H5V6H2z" />
            ) : (
              <path d="M6 10L2 6h3V2h2v4h3z" />
            )}
          </svg>
          {Math.abs(stat.change)}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-base-content">{display}</p>
      <p className="mt-1 text-sm font-medium text-base-content/60">{stat.label}</p>
      <p className="mt-1 text-xs text-base-content/50">{stat.compare}</p>
    </div>
  );
};

export default StatCard;