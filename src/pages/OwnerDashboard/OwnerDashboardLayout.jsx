import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  fetchOwnerRestaurantProfile,
  fetchOwnerNotifications,
  markOwnerNotificationsRead,
} from "../../services/restaurantService";
import { useAuthStore } from "../../store/authStore";

const OwnerDashboardLayout = () => {
  const [restaurant, setRestaurant] = useState({ name: "", logo: null });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useAuthStore((s) => s.user);

  const load = useCallback(async () => {
    const r = await fetchOwnerRestaurantProfile().catch(() => ({}));
    setRestaurant({
      name: r.restaurant_name || r.name || user?.name || "My Restaurant",
      logo: r.logo_url || null,
    });
    const n = await fetchOwnerNotifications().catch(() => ({
      notifications: [],
      unread_count: 0,
    }));
    setNotifications(n.notifications || []);
    setUnreadCount(n.unread_count || 0);
  }, [user?.name]);

  const handleNotificationsRead = useCallback(async () => {
    await markOwnerNotificationsRead().catch(() => {});
    setUnreadCount(0);
    load();
  }, [load]);

  const handleNotificationRead = useCallback(
    async (time) => {
      await markOwnerNotificationsRead(time).catch(() => {});
      load();
    },
    [load]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      restaurant={restaurant}
      notifications={notifications}
      unreadCount={unreadCount}
      onNotificationsRead={handleNotificationsRead}
      onNotificationRead={handleNotificationRead}
    />
  );
};

export default OwnerDashboardLayout;