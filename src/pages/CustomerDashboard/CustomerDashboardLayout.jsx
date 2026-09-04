import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CustomerSidebar from "../../components/customer/CustomerSidebar";
import CustomerNavbar from "../../components/customer/CustomerNavbar";
import MobileBottomNav from "../../components/customer/MobileBottomNav";
import { fetchCustomerNotifications, markNotificationsRead } from "../../services/customerService";

const TITLES = {
  "/customer/dashboard": "Dashboard",
  "/customer/dashboard/my-orders": "My Orders",
  "/customer/dashboard/active-orders": "Active Orders",
  "/customer/dashboard/order-history": "Order History",
  "/customer/dashboard/favorite-restaurants": "Favorite Restaurants",
  "/customer/dashboard/notifications": "Notifications",
  "/customer/dashboard/profile": "My Profile",
  "/customer/dashboard/addresses": "Addresses",
  "/customer/dashboard/payment-methods": "Payment Methods",
  "/customer/dashboard/settings": "Settings",
  // Top-level aliases (/customer/orders, /customer/profile, …).
  "/customer/orders": "My Orders",
  "/customer/profile": "My Profile",
  "/customer/addresses": "Addresses",
  "/customer/payments": "Payment Methods",
  "/customer/notifications": "Notifications",
  "/customer/settings": "Settings",
};

const CustomerDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const title = TITLES[location.pathname] || "Customer Panel";

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await fetchCustomerNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Non-blocking (badge just stays hidden).
    }
  }, []);

  const handleNotificationRead = useCallback(
    async (time) => {
      try {
        await markNotificationsRead(time);
        await refreshNotifications();
      } catch {
        // Non-blocking — badge stays until next fetch.
      }
    },
    [refreshNotifications]
  );

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications, location.pathname]);

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="flex min-h-screen">
        <CustomerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <CustomerNavbar
            title={title}
            notifications={notifications}
            unreadCount={unreadCount}
            onOpenSidebar={() => setSidebarOpen(true)}
            onNotificationRead={handleNotificationRead}
          />
          <main className="flex-1 overflow-x-hidden px-4 py-6 pb-24 lg:px-8 lg:pb-10">
            <Outlet context={{ refreshNotifications, markOneRead: handleNotificationRead }} />
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default CustomerDashboardLayout;