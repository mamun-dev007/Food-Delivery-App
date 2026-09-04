// Central navigation config for the Customer dashboard sidebar.
// Destinations point at real, working pages. New top-level aliases
// (/customer/orders, /customer/favorites, …) are registered in Routes so both
// URL flavours keep working.
import {
  Bell,
  ClipboardList,
  CreditCard,
  Heart,
  History,
  LayoutDashboard,
  MapPin,
  Settings,
  ShoppingCart,
  Truck,
  User,
  UtensilsCrossed,
} from "lucide-react";

export const CUSTOMER_NAV = {
  main: [
    {
      to: "/customer/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      end: true,
    },
    { to: "/customer/dashboard/my-orders", label: "My Orders", icon: ClipboardList },
    { to: "/customer/dashboard/active-orders", label: "Active Orders", icon: Truck },
    { to: "/customer/dashboard/order-history", label: "Order History", icon: History },
    {
      to: "/customer/dashboard/favorite-restaurants",
      label: "Favorite Restaurants",
      icon: Heart,
    },
    { to: "/customer/favorites", label: "Favorite Foods", icon: UtensilsCrossed },
    { to: "/customer/cart", label: "My Cart", icon: ShoppingCart },
  ],
  account: [
    {
      to: "/customer/dashboard/notifications",
      label: "Notifications",
      icon: Bell,
    },
    { to: "/customer/dashboard/profile", label: "Profile", icon: User },
    { to: "/customer/dashboard/addresses", label: "Addresses", icon: MapPin },
    {
      to: "/customer/dashboard/payment-methods",
      label: "Payment Methods",
      icon: CreditCard,
    },
    { to: "/customer/dashboard/settings", label: "Settings", icon: Settings },
  ],
};