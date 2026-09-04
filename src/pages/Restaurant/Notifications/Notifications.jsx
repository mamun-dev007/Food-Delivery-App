import { useEffect, useState } from "react";
import { Bell, Loader2, Package, ShoppingCart } from "lucide-react";
import { fetchOwnerNotifications } from "../../../services/restaurantService";

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOwnerNotifications()
      .then((n) => {
        if (active) setNotifications(n);
      })
      .catch(() => {
        if (active) setNotifications([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-base-content/50 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading notifications...
      </div>
    );
  }

  const Icon = ({ type }) =>
    type === "stock" ? <Package className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />;

  return (
    <div>
      <h1 className="text-3xl font-bold">Notifications</h1>
      <p className="text-base-content/60 mt-1">
        Latest activity from your orders and menu.
      </p>

      <div className="space-y-3 mt-6">
        {notifications.length === 0 ? (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body text-center text-base-content/50 py-16">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No notifications yet.
            </div>
          </div>
        ) : (
          notifications.map((n, idx) => (
            <div key={idx} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 flex-row items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${
                    n.type === "stock"
                      ? "bg-warning/20 text-warning"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  <Icon type={n.type} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-base-content/60">{n.message}</p>
                  {n.time && (
                    <p className="text-xs text-base-content/40 mt-1">{fmtTime(n.time)}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;