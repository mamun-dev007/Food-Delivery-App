import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import RiderSidebar from "../../components/rider/RiderSidebar";
import RiderNavbar from "../../components/rider/RiderNavbar";
import MobileBottomNav from "../../components/rider/MobileBottomNav";
import { fetchRiderNotifications, fetchRiderProfile } from "../../services/riderService";

const TITLES = {
  "/rider": "Dashboard",
  "/rider/dashboard": "Dashboard",
  "/rider/orders": "Available Orders",
  "/rider/available": "Available Orders",
  "/rider/active-delivery": "Active Delivery",
  "/rider/deliveries": "My Deliveries",
  "/rider/history": "Delivery History",
  "/rider/earnings": "Earnings",
  "/rider/performance": "Performance",
  "/rider/reviews": "Reviews",
  "/rider/notifications": "Notifications",
  "/rider/profile": "Profile",
  "/rider/settings": "Settings",
};

const RiderLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const title = TITLES[location.pathname] || "Rider Panel";

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchRiderNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Non-blocking (badge just stays hidden).
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await fetchRiderProfile();
      setIsOnline(Boolean(profile?.isOnline));
    } catch {
      // Non-blocking.
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadProfile();
  }, [loadNotifications, loadProfile, location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#570df8]/[0.05] via-base-200 to-[#f000b8]/[0.05]">
      <div className="flex">
        <RiderSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isOnline={isOnline} />
        <div className="flex min-w-0 flex-1 flex-col">
          <RiderNavbar
            title={title}
            isOnline={isOnline}
            notifications={notifications}
            unreadCount={unreadCount}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-10">
            <Outlet context={{ isOnline, setIsOnline, refreshNotifications: loadNotifications }} />
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default RiderLayout;