import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import {
  ShoppingCart,
  User,
  ChevronDown,
  LogOut,
  Search,
  X,
  Home,
  UtensilsCrossed,
  Tags,
  Heart,
  ClipboardList,
  Package,
  Star,
  LayoutDashboard,
  Store,
  Utensils,
  BarChart3,
  Bike,
  Wallet,
  Percent,
  Users,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const getLinkStyle = ({ isActive }) => ({
  color: isActive ? "#2563eb" : "",
  borderBottom: isActive ? "2px solid #2563eb" : "none",
  paddingBottom: "2px",
});

const roleNavItems = {
  customer: [
    { to: "/", label: "Home", icon: Home },
    { to: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { to: "/categories", label: "Food Categories", icon: Utensils },
    { to: "/offers", label: "Offers & Discounts", icon: Tags },
    { to: "/my-orders", label: "My Orders", icon: ClipboardList },
    { to: "/track-order", label: "Track Order", icon: Package },
  ],
  restaurantOwner: [
    { to: "/", label: "Home", icon: Home },
    { to: "/restaurants", label: "Restaurant", icon: Store },
    { to: "/menu", label: "Foods", icon: Utensils },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/dashboard/orders", label: "Orders", icon: ClipboardList },
    { to: "/dashboard/reviews", label: "Reviews", icon: Star },
    { to: "/dashboard/reports", label: "Analytics", icon: BarChart3 },
    { to: "/dashboard/coupons", label: "Offers", icon: Percent },
    { to: "/dashboard/sales", label: "Earnings", icon: Wallet },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
  rider: [
    { to: "/", label: "Home", icon: Home },
    { to: "/restaurants", label: "Restaurant", icon: Store },
    { to: "/menu", label: "Foods", icon: Utensils },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/rider", label: "Dashboard", icon: LayoutDashboard },
    { to: "/rider/available", label: "Available Orders", icon: ClipboardList },
    { to: "/rider/deliveries", label: "My Deliveries", icon: Bike },
    { to: "/rider/earnings", label: "Earnings", icon: Wallet },
    { to: "/rider/performance", label: "Performance", icon: BarChart3 },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/restaurants", label: "Restaurants", icon: Store },
    { to: "/admin/riders", label: "Riders", icon: Bike },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
    { to: "/admin/revenue", label: "Analytics", icon: BarChart3 },
  ],
};

const Navbar = ({ children }) => {
  const cartCount = useCartStore((s) => s.items.length);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out!");
    navigate("/");
  };

  const items =
    role && roleNavItems[role] ? roleNavItems[role] : roleNavItems.customer;
  const primary = items.slice(0, 5);
  const secondary = items.slice(5);

  const renderLink = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/restaurant" || item.to === "/"}
      style={getLinkStyle}
      className="gap-1"
    >
      <item.icon className="w-4 h-4" />
      {item.label}
    </NavLink>
  );

  return (
    <div className="sticky top-0 z-50">
      <div className="navbar bg-base-100/70 backdrop-blur-xl shadow-md px-4 lg:px-8">
        <div className="navbar-start">
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100/90 backdrop-blur-xl rounded-box z-50 mt-3 w-64 p-2 shadow max-h-96 overflow-auto"
            >
              {items.map((item) => (
                <li key={`${item.to}-${item.label}`}>{renderLink(item)}</li>
              ))}
              {!user && (
                <li>
                  <NavLink to="/auth" style={getLinkStyle} className="gap-1">
                    <User className="w-4 h-4" />
                    Login / Sign Up
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
          <a className="btn btn-ghost px-1 gap-0" href="/">
            <img
              src={logo}
              alt="Foodie"
              className="h-8 w-auto object-contain"
            />
            <span className="text-primary font-extrabold text-xl sm:block hidden">Foo</span>
            <span className="text-secondary font-extrabold text-xl  sm:block hidden">die</span>
          </a>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-0.5">
            {primary.map((item) => (
              <li key={`${item.to}-${item.label}`}>{renderLink(item)}</li>
            ))}
            {secondary.length > 0 && (
              <li>
                <div className="dropdown dropdown-hover">
                  <label
                    tabIndex={0}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                    More
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100/90 backdrop-blur-xl rounded-box z-50 w-64 p-2 shadow-lg"
                  >
                    {secondary.map((item) => (
                      <li key={`${item.to}-${item.label}`}>
                        {renderLink(item)}
                      </li>
                    ))}
                    {!user && (
                      <li>
                        <NavLink
                          to="/auth"
                          style={getLinkStyle}
                          className="gap-1"
                        >
                          <User className="w-4 h-4" />
                          Login / Sign Up
                        </NavLink>
                      </li>
                    )}
                  </ul>
                </div>
              </li>
            )}
          </ul>
        </div>

        <div className="navbar-end gap-2">
          <ThemeToggle className="btn btn-ghost btn-circle" />

          <button
            onClick={() => setShowSearch((v) => !v)}
            className="btn btn-ghost hidden sm:block"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {role === "customer" && (
            <>
              {/* <NavLink
                to="/favorites"
                className="btn btn-ghost"
                aria-label="Favorites"
              >
                <Heart className="w-5 h-5" />
              </NavLink> */}
              <NavLink
                to="/cart"
                className="btn btn-ghost relative"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="badge badge-error badge-sm absolute -top-1 -right-1">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            </>
          )}

          {user ? (
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost gap-2 px-2 cursor-pointer"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-semibold max-w-[140px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100/90 backdrop-blur-xl rounded-box z-50 mt-3 w-64 p-2 shadow"
              >
                <li className="pointer-events-none">
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary text-primary-content flex items-center justify-center text-lg font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-base-content truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-base-content/50 truncate">
                        {user.email || role}
                      </p>
                    </div>
                  </div>
                </li>
                <li>
                  <NavLink
                    to={
                      {
                        customer: "/customer/dashboard",
                        restaurantOwner: "/dashboard",
                        rider: "/rider/dashboard",
                        admin: "/admin",
                      }[role] || "/"
                    }
                    className="gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={
                      {
                        customer: "/customer/dashboard/profile",
                        restaurantOwner: "/dashboard/profile",
                        rider: "/rider/profile",
                        admin: "/admin/profile",
                      }[role] || "/profile"
                    }
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-error"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <NavLink to="/auth" className="btn btn-primary gap-1">
              <User className="w-4 h-4" />
              Login
            </NavLink>
          )}
        </div>
      </div>
      {showSearch && (
        <div className="bg-base-100/70 backdrop-blur-xl shadow-md px-4 lg:px-8 py-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setShowSearch(false);
                setSearchQuery("");
              }
            }}
            className="max-w-xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
            <input
              autoFocus
              type="text"
              placeholder="Search food or restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-12 pr-12"
            />
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs "
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      {children}
    </div>
  );
};

export default Navbar;
