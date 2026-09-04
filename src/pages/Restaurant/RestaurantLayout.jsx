import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import logo from "../../assets/logo.png";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Plus,
  List,
  Tags,
  ClipboardList,
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  Star,
  Percent,
  BarChart3,
  DollarSign,
  Store,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

const menuGroups = [
  { type: "link", to: "/restaurant", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    type: "group",
    parent: { label: "Food Management", icon: UtensilsCrossed },
    children: [
      { to: "/restaurant/foods/add", label: "Add Food", icon: Plus },
      { to: "/restaurant/foods", label: "Manage Foods", icon: List },
    ],
  },
  { type: "link", to: "/restaurant/categories", label: "Categories", icon: Tags },
  {
    type: "group",
    parent: { label: "Orders", icon: ClipboardList },
    children: [
      { to: "/restaurant/orders", label: "All Orders", icon: ClipboardList, end: true },
      { to: "/restaurant/orders/pending", label: "Pending Orders", icon: Clock },
      { to: "/restaurant/orders/preparing", label: "Preparing Orders", icon: ChefHat },
      { to: "/restaurant/orders/ready", label: "Ready Orders", icon: CheckCircle },
      { to: "/restaurant/orders/completed", label: "Completed Orders", icon: CheckCircle },
      { to: "/restaurant/orders/cancelled", label: "Cancelled Orders", icon: XCircle },
    ],
  },
  { type: "link", to: "/restaurant/reviews", label: "Reviews", icon: Star },
  { type: "link", to: "/restaurant/offers", label: "Offers / Coupons", icon: Percent },
  { type: "link", to: "/restaurant/analytics", label: "Sales Analytics", icon: BarChart3 },
  { type: "link", to: "/restaurant/earnings", label: "Earnings", icon: DollarSign },
  { type: "link", to: "/restaurant/profile", label: "Restaurant Profile", icon: Store },
  { type: "link", to: "/restaurant/notifications", label: "Notifications", icon: Bell },
  { type: "link", to: "/restaurant/settings", label: "Settings", icon: Settings },
];

const isPathInGroup = (group, pathname) =>
  group.children?.some((c) => pathname === c.to || (!c.end && pathname.startsWith(c.to + "/")));

const SidebarNav = () => {
  const { pathname } = useLocation();

  return (
    <ul className="menu gap-0.5">
      {menuGroups.map((item) => {
        if (item.type === "link") {
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 text-sm ${
                    isActive ? "bg-primary text-primary-content font-medium" : ""
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            </li>
          );
        }
        const open = isPathInGroup(item, pathname);
        return (
          <li key={item.parent.label}>
            <details open={open}>
              <summary className="flex items-center gap-3 text-sm cursor-pointer">
                <item.parent.icon className="w-4 h-4" />
                {item.parent.label}
              </summary>
              <ul>
                {item.children.map((child) => (
                  <li key={child.to}>
                    <NavLink
                      to={child.to}
                      end={child.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 text-sm ${
                          isActive ? "bg-primary text-primary-content font-medium" : ""
                        }`
                      }
                    >
                      <child.icon className="w-4 h-4" />
                      {child.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
};

const RestaurantLayout = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out!");
    navigate("/");
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="restaurant-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Mobile top bar */}
        <div className="navbar bg-base-100 shadow-sm lg:hidden px-4">
          <div className="flex-none">
            <label htmlFor="restaurant-drawer" className="btn btn-ghost btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </label>
          </div>
          <div className="flex-1 text-lg font-bold flex items-center gap-2">
            <img src={logo} alt="Foodie" className="h-8 w-auto object-contain" />
            <span>
              <span className="text-primary">Foo</span>
              <span className="text-secondary">die</span>
            </span>
          </div>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user?.name || "profile"} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </label>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow">
              <li>
                <NavLink to="/restaurant/profile" className="gap-2">
                  <Store className="w-4 h-4" />
                  My Restaurant
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="gap-2 text-error">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="restaurant-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="bg-base-200 min-h-full w-72">
          {/* Header + profile */}
          <div className="p-5 border-b border-base-300">
            <a href="/" className="text-2xl font-extrabold block flex items-center gap-2">
              <img src={logo} alt="Foodie" className="h-10 w-auto object-contain" />
              <span>
                <span className="text-primary">Foo</span>
                <span className="text-secondary">die</span>
              </span>
            </a>
            <span className="badge badge-primary mt-2">Restaurant Owner</span>

            <div className="dropdown dropdown-end mt-4 w-full">
              <label tabIndex={0} className="btn btn-ghost justify-start w-full gap-3 cursor-pointer px-2">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user?.name || "profile"} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold truncate max-w-[140px]">{user?.name || "Owner"}</p>
                  <p className="text-xs text-base-content/50 truncate max-w-[140px]">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </label>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 w-52 p-2 shadow">
                <li>
                  <NavLink to="/restaurant/profile" className="gap-2">
                    <Store className="w-4 h-4" />
                    My Restaurant
                  </NavLink>
                </li>
                <li>
                  <a href="/" className="gap-2">View Site</a>
                </li>
                <li>
                  <button onClick={handleLogout} className="gap-2 text-error">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-3 overflow-y-auto max-h-[calc(100vh-180px)]">
            <p className="px-3 pb-2 text-xs uppercase tracking-wider text-base-content/50">
              Restaurant Panel
            </p>
            <SidebarNav />

            <div className="divider my-3" />
            <ul className="menu">
              <li>
                <NavLink to="/" className="flex items-center gap-3">
                  ← Back to Site
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default RestaurantLayout;