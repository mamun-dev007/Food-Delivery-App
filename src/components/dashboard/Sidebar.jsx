import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  PackageCheck,
  FolderPlus,
  Users,
  Star,
  Wallet,
  TicketPercent,
  BarChart3,
  Settings,
  X,
  ImageOff,
  Home,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/menu", label: "Food Management", icon: UtensilsCrossed },
  { to: "/dashboard/orders", label: "Orders", icon: ClipboardList },
  { to: "/dashboard/stock", label: "Stock Overview", icon: PackageCheck },
  { to: "/dashboard/categories", label: "Categories", icon: FolderPlus },
  { to: "/dashboard/customers", label: "Customers", icon: Users },
  { to: "/dashboard/reviews", label: "Reviews", icon: Star },
  { to: "/dashboard/sales", label: "Sales & Earnings", icon: Wallet },
  { to: "/dashboard/coupons", label: "Coupons", icon: TicketPercent },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const Brand = ({ restaurant }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {restaurant?.logo && !failed ? (
        <img
          src={restaurant.logo}
          alt={restaurant.name}
          onError={() => setFailed(true)}
          className="h-10 w-10 rounded-xl border border-base-300 object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <ImageOff className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-base-content">
          {restaurant?.name || "My Restaurant"}
        </p>
        <p className="text-xs text-base-content/50">Owner Dashboard</p>
      </div>
    </div>
  );
};

const SidebarContent = ({ restaurant }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between border-b border-base-300 px-5 py-5">
      <Brand restaurant={restaurant} />
    </div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-content shadow-sm"
                : "text-base-content/70 hover:bg-primary/10 hover:text-primary"
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
    <div className="border-t border-base-300 p-4">
      <NavLink
        to="/"
        className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/70 transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Home className="h-4 w-4" />
        Back to Site
      </NavLink>
      <p className="px-1 text-xs text-base-content/50">Foodie Owner Panel · v1.0</p>
    </div>
  </div>
);

const Sidebar = ({ open, onClose, restaurant }) => (
  <>
    {/* Desktop */}
    <aside className="hidden lg:block lg:w-72 lg:shrink-0">
      <div className="sticky top-0 h-screen border-r border-base-300 bg-base-200">
        <SidebarContent restaurant={restaurant} />
      </div>
    </aside>

    {/* Mobile drawer */}
    {open && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="absolute inset-y-0 left-0 w-72 bg-base-200 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-base-content/60 hover:bg-base-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent restaurant={restaurant} />
        </div>
      </div>
    )}
  </>
);

export default Sidebar;