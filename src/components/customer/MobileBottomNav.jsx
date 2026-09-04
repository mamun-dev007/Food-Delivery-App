import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, Heart, Home, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "../../store/cartStore";

const TABS = [
  { to: "/customer/dashboard", label: "Home", icon: Home, end: true },
  { to: "/customer/dashboard/my-orders", label: "Orders", icon: ClipboardList },
  { to: "/customer/cart", label: "Cart", icon: ShoppingCart, isCart: true },
  { to: "/customer/favorites", label: "Favorites", icon: Heart },
  { to: "/customer/dashboard/profile", label: "Profile", icon: User },
];

const MobileBottomNav = () => {
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + (i.qty || 1), 0));
  const navigate = useNavigate();

  const renderTab = (t) => {
    const inner = (
      <>
        {t.isCart ? (
          <span className="relative">
            <t.icon className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-content">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </span>
        ) : (
          <t.icon className="h-5 w-5" />
        )}
        <span className="text-[10px] font-semibold">{t.label}</span>
      </>
    );

    return (
      <NavLink
        key={t.to}
        to={t.to}
        end={t.end}
        onClick={() => {
          if (t.to === "/customer/cart" && t.isCart) navigate("/customer/cart");
        }}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-2.5 transition-colors ${
            isActive ? "text-primary" : "text-base-content/40"
          }`
        }
      >
        {inner}
      </NavLink>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300/60 bg-base-100 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-5">
        {TABS.map(renderTab)}
      </div>
    </nav>
  );
};

export default MobileBottomNav;