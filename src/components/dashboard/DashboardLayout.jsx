import { createContext, useContext, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

const DashboardContext = createContext({ range: "This Week", setRange: () => {} });
export const useDashboardRange = () => useContext(DashboardContext);

const DashboardLayout = ({ restaurant, notifications, unreadCount, onNotificationsRead, onNotificationRead }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState("This Week");

  const ctx = useMemo(() => ({ range, setRange }), [range]);

  return (
    <DashboardContext.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden bg-base-100">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          restaurant={restaurant}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            onToggleSidebar={() => setSidebarOpen(true)}
            restaurant={restaurant}
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationsRead={onNotificationsRead}
            onNotificationRead={onNotificationRead}
            range={range}
            onRangeChange={setRange}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;