import { NavLink } from "react-router-dom";
import { Bike, ClipboardList, History, Home, TrendingUp } from "lucide-react";

const TABS = [
  { to: "/rider/dashboard", label: "Dashboard", icon: Home, end: true },
  { to: "/rider/orders", label: "Orders", icon: ClipboardList },
  { to: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/rider/history", label: "History", icon: History },
  { to: "/rider/profile", label: "Profile", icon: Bike },
];

const MobileBottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
    <div className="grid grid-cols-5">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
              isActive ? "text-[#570df8]" : "text-base-content/50"
            }`
          }
        >
          <t.icon className="h-5 w-5" />
          {t.label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileBottomNav;