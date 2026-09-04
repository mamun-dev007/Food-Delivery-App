import { NavLink, Link } from "react-router-dom";
import { X, ArrowLeft } from "lucide-react";
import { CUSTOMER_NAV } from "./customerNav";
import logo from "../../assets/logo.png";

// Brand block with the tagline from the design brief.
const Brand = () => (
  <div className="flex items-center gap-3">
    <img
      src={logo}
      alt="Foodie"
      className="h-11 w-11 rounded-xl object-cover shadow-sm"
    />
    <div>
      <p className="text-base font-extrabold tracking-tight text-base-content">
        <span className="text-primary">Foo</span>
        <span className="text-primary/70">die</span>
      </p>
      <p className="text-[11px] font-medium text-base-content/40">Good Food, Happy Mood</p>
    </div>
  </div>
);

// Nav item placeholder while the layout is loading.
const NavItem = ({ item, onClose }) => (
  <NavLink
    key={item.to}
    to={item.to}
    end={item.end}
    onClick={onClose}
    className={({ isActive }) =>
      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-base-content/80 hover:bg-base-200 hover:text-primary"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <item.icon
          className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-base-content/40 group-hover:text-primary/80"}`}
        />
        <span className="truncate">{item.label}</span>
        {isActive && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </>
    )}
  </NavLink>
);

const SidebarContent = ({ onClose }) => (
  <div className="flex h-full flex-col bg-base-100">
    <div className="flex items-center justify-between px-5 py-5">
      <Brand />
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-200 text-base-content/60 transition-colors hover:bg-base-300 lg:hidden"
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
      {CUSTOMER_NAV.main.map((item) => (
        <NavItem key={item.to} item={item} onClose={onClose} />
      ))}
      <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">
        Account
      </p>
      {CUSTOMER_NAV.account.map((item) => (
        <NavItem key={item.to} item={item} onClose={onClose} />
      ))}
    </nav>

    <div className="border-t border-base-300/60 p-4">
      <div className="flex items-center gap-3 rounded-xl bg-base-200 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-sm font-bold">24</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-base-content/50">Avg. Delivery</p>
          <p className="text-sm font-bold text-base-content/90">25 minutes</p>
        </div>
      </div>
      <Link
        to="/"
        onClick={onClose}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-base-300 bg-base-100 py-2.5 text-sm font-medium text-base-content/70 transition-colors hover:border-primary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Site
      </Link>
    </div>
  </div>
);

const CustomerSidebar = ({ open, onClose }) => (
  <>
    <aside className="hidden lg:block lg:w-72 lg:shrink-0">
      <div className="sticky top-0 flex h-screen flex-col border-r border-base-300/60 bg-base-100">
        <SidebarContent onClose={onClose} />
      </div>
    </aside>

    {open && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute inset-y-0 left-0 w-72 border-r border-base-300/60 bg-base-100 shadow-2xl">
          <SidebarContent onClose={onClose} />
        </div>
      </div>
    )}
  </>
);

export default CustomerSidebar;