import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Bike,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Navigation,
  Settings,
  Star,
  TrendingUp,
  User,
  X,
  Gauge,
} from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import { useAuthStore } from "../../store/authStore";
import logo from "../../assets/logo.png";

const NAV_TOP = [
  { to: "/rider/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/rider/orders", label: "Available Orders", icon: ClipboardList },
  { to: "/rider/active-delivery", label: "Active Delivery", icon: Navigation },
  { to: "/rider/deliveries", label: "My Deliveries", icon: Bike },
  { to: "/rider/history", label: "Delivery History", icon: History },
  { to: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/rider/performance", label: "Performance", icon: Gauge },
  { to: "/rider/reviews", label: "Reviews", icon: Star },
];

const NAV_BOTTOM = [
  { to: "/rider/notifications", label: "Notifications", icon: Bell },
  { to: "/rider/profile", label: "Profile", icon: User },
  { to: "/rider/settings", label: "Settings", icon: Settings },
];

const Brand = ({ isOnline }) => (
  <div className="flex items-center gap-3">
    <img src={logo} alt="Foodie" className="h-11 w-11 rounded-xl object-cover shadow-sm" />
    <div>
      <p className="text-base font-extrabold tracking-tight text-base-content">
        <span className="text-primary">Foo</span>
        <span className="text-secondary">die</span>
      </p>
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
          isOnline ? "text-emerald-600" : "text-base-content/40"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-base-content/30"}`} />
        {isOnline ? "Online" : "Offline"} Rider
      </span>
    </div>
  </div>
);

const SidebarContent = ({ onClose, isOnline = false }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/rider/login";
  };

  const NavItem = ({ item }) => (
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
  );

  return (
    <div className="flex h-full flex-col bg-base-200">
      <div className="flex items-center justify-between border-b border-base-300 px-5 py-5">
        <Brand isOnline={isOnline} />
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-base-content/60 hover:bg-base-300 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_TOP.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
        <p className="px-3 pb-1 pt-4 text-xs uppercase tracking-wider text-base-content/40">
          Account
        </p>
        {NAV_BOTTOM.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
        <button
          onClick={() => {
            navigate("/");
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/70 transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </nav>

      {/* <div className="border-t border-base-300 p-4">
        <NavLink
          to="/rider/profile"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl bg-base-100 p-3 transition-colors hover:bg-base-300/40"
        >
          <Avatar src={user?.avatar_url} name={user?.name || "Rider"} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-base-content">
              {user?.name || "Rider"}
            </p>
            <p className="truncate text-xs text-base-content/50">
              {user?.email || "rider@foodie.app"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base-content/50 transition-colors hover:bg-error/10 hover:text-error"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </NavLink>
      </div> */}
    </div>
  );
};

const RiderSidebar = ({ open, onClose, isOnline = false }) => (
  <>
    <aside className="hidden lg:block lg:w-72 lg:shrink-0">
      <div className="sticky top-0 h-screen border-r border-base-300 bg-base-200">
        <SidebarContent onClose={onClose} isOnline={isOnline} />
      </div>
    </aside>

    {open && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-y-0 left-0 w-72 border-r border-base-300 shadow-2xl">
          <SidebarContent onClose={onClose} isOnline={isOnline} />
        </div>
      </div>
    )}
  </>
);

export default RiderSidebar;