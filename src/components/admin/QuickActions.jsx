import { Link } from "react-router-dom";
import {
  ClipboardList,
  Store,
  Bike,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

const ACTIONS = [
  { to: "/admin/orders", label: "Manage Orders", desc: "View & track", icon: ClipboardList },
  { to: "/admin/restaurants/requests", label: "Verify Restaurants", desc: "Pending approvals", icon: Store },
  { to: "/admin/riders/requests", label: "Verify Riders", desc: "Pending approvals", icon: Bike },
  { to: "/admin/foods", label: "Food Catalogue", desc: "All foods", icon: UtensilsCrossed },
  { to: "/admin/users", label: "All Users", desc: "Accounts", icon: Users },
  { to: "/admin/customers", label: "Customers", desc: "Platform customers", icon: Users },
  { to: "/admin/payments", label: "Payments", desc: "Transactions", icon: Wallet },
  { to: "/admin/analytics", label: "Analytics", desc: "Deep insights", icon: BarChart3 },
];

const QuickActions = ({ className = "" }) => (
  <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
    <h3 className="text-base font-bold text-base-content">Quick Actions</h3>
    <p className="mt-0.5 text-sm text-base-content/50">Shortcuts to common tasks</p>

    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ACTIONS.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          className="group flex flex-col items-start gap-2 rounded-xl border border-base-300 p-3 transition-colors hover:border-primary/30 hover:bg-primary/10"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-base-200 text-base-content/60 transition-colors group-hover:bg-primary group-hover:text-primary-content">
            <a.icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-base-content group-hover:text-primary">{a.label}</p>
            <p className="text-xs text-base-content/50">{a.desc}</p>
          </div>
        </Link>
      ))}
    </div>

    <Link
      to="/admin/settings"
      className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-base-300 px-3 py-2 text-sm font-medium text-base-content/60 transition-colors hover:border-primary hover:text-primary"
    >
      <Settings className="h-4 w-4" />
      Platform Settings
    </Link>
  </div>
);

export default QuickActions;