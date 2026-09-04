import { Link } from "react-router-dom";
import { LayoutGrid, Percent, Store, Truck } from "lucide-react";

const ITEMS = [
  { to: "/restaurants", label: "Restaurants", icon: Store },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/offers", label: "Offers", icon: Percent },
  { to: "/customer/dashboard/active-orders", label: "Track Orders", icon: Truck },
];

const QuickShop = () => (
  <div className="grid grid-cols-2 gap-2">
    {ITEMS.map((item) => (
      <Link
        key={item.label}
        to={item.to}
        className="group flex items-center gap-2.5 rounded-xl border border-base-300/60 bg-base-200 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/10"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-base-100 text-base-content/50 shadow-sm transition-colors group-hover:text-primary">
          <item.icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold text-base-content/80 group-hover:text-primary">
          {item.label}
        </span>
      </Link>
    ))}
  </div>
);

export default QuickShop;