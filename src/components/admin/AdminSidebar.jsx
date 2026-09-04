import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Store,
  Bike,
  UtensilsCrossed,
  Tags,
  Star,
  Wallet,
  BarChart3,
  LineChart,
  Bell,
  Settings,
  LogOut,
  X,
  Home,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "./SmartImage";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/restaurants", label: "Restaurants", icon: Store },
  { to: "/admin/riders", label: "Riders", icon: Bike },
  { to: "/admin/foods", label: "Foods", icon: UtensilsCrossed },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const Brand = () => (
  <div className="flex items-center gap-3">
    <img src={logo} alt="Foodie" className="h-10 w-10 rounded-xl object-cover" />
    <div>
      <p className="text-sm font-bold text-base-content">
        <span className="text-primary">Foo</span>
        <span className="text-secondary">die</span>
      </p>
      <p className="text-xs text-base-content/50">Admin Panel</p>
    </div>
  </div>
);

const SidebarContent = ({ onClose }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full flex-col bg-base-200">
      <div className="flex items-center justify-between border-b border-base-300 px-5 py-5">
        <Brand />
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-base-content/60 hover:bg-base-300 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
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
        {/* <div className="flex items-center gap-3 rounded-xl bg-base-100 p-3">
          <Avatar src={user?.avatar_url} name={user?.name || "Admin"} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-base-content">
              {user?.name || "Administrator"}
            </p>
            <p className="truncate text-xs text-base-content/50">{user?.email || "admin@foodie.app"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base-content/50 transition-colors hover:bg-error/10 hover:text-error"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div> */}
        <NavLink
          to="/"
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/60 transition-colors hover:bg-base-100"
        >
          <Home className="h-4 w-4" />
          Back to Site
        </NavLink>
      </div>
    </div>
  );
};

const AdminSidebar = ({ open, onClose }) => (
  <>
    {/* Desktop */}
    <aside className="hidden lg:block lg:w-72 lg:shrink-0">
      <div className="sticky top-0 h-screen border-r border-base-300 bg-base-200">
        <SidebarContent onClose={onClose} />
      </div>
    </aside>

    {/* Mobile drawer */}
    {open && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-y-0 left-0 w-72 border-r border-base-300 shadow-2xl">
          <SidebarContent onClose={onClose} />
        </div>
      </div>
    )}
  </>
);

export default AdminSidebar;