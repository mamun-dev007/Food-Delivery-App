import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Package, ChefHat, Truck, CheckCircle2 } from "lucide-react";
import { fetchOrder } from "../../services/orderService";
import { useAuthStore } from "../../store/authStore";

const STEPS = [
  { key: "Pending", label: "Order Placed", icon: Package },
  { key: "Preparing", label: "Preparing", icon: ChefHat },
  { key: "On The Way", label: "On The Way", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

const STEP_INDEX = { Pending: 0, Preparing: 1, "On The Way": 2, Delivered: 3 };

const riderSteps = ["Accepted", "At Restaurant", "Picked Up", "On The Way", "Delivered"];
const RIDER_STEP_INDEX = {};
riderSteps.forEach((s, i) => (RIDER_STEP_INDEX[s] = i));

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TrackOrder = () => {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const preseed = searchParams.get("order") || "";
  const [orderId, setOrderId] = useState(preseed);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Not logged in -> prompt to login before allowing order tracking.
  if (!user) {
    return (
      <div className="my-16 max-w-md mx-auto card bg-base-100 shadow-md p-10 text-center">
        <p className="text-5xl">🔐</p>
        <h1 className="text-2xl font-bold mt-4">Login Required</h1>
        <p className="text-base-content/60 mt-2">
          You need to be logged in to track your order.
        </p>
        <Link to="/login" className="btn btn-primary mt-6">
          Login / Sign Up
        </Link>
      </div>
    );
  }

  const track = async (val) => {
    const q = val || orderId;
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const data = await fetchOrder(q.trim());
      if (!data) {
        setError("Order not found. Please check your order number.");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Failed to fetch order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preseed) track(preseed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preseed]);

  const currentIdx = order ? (STEP_INDEX[order.status] ?? -1) : -1;
  const riderIdx = order?.rider_status ? (RIDER_STEP_INDEX[order.rider_status] ?? -1) : -1;

  return (
    <div className="my-8 max-w-xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Track Your Order</h1>
        <p className="text-base-content/60 mt-2">
          Enter your order ID to see its live status.
        </p>
      </div>

      <div className="card bg-base-100 shadow-md p-6">
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder="e.g. ORD-20260904-1234"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && track()}
          />
          <button
            className="btn btn-primary"
            onClick={() => track()}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8 text-base-content/50 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Tracking order...
          </div>
        )}

        {order && !loading && (
          <div className="mt-8">
            {/* Order info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-bold text-lg">{order.order_no}</p>
                <p className="text-sm text-base-content/60">
                  {order.restaurant_name} • {fmtDate(order.created_at)}
                </p>
              </div>
              <span className={`badge badge-lg ${
                order.status === "Delivered" ? "badge-success"
                  : order.status === "Cancelled" ? "badge-error"
                    : "badge-primary"
              }`}>
                {order.status}
              </span>
            </div>

            {/* Main status steps */}
            <div className="flex flex-col gap-4">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDone
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content/40"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span
                        className={isDone ? "font-semibold" : "text-base-content/40"}
                      >
                        {step.label}
                      </span>
                      {isCurrent && order.status !== "Delivered" && (
                        <span className="badge badge-primary badge-sm ml-2 animate-pulse">
                          Current
                        </span>
                      )}
                    </div>
                    {isDone && idx < currentIdx && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rider status (if assigned) */}
            {order.rider_assigned && (
              <div className="mt-6 p-4 bg-base-200 rounded-lg">
                <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Rider Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {riderSteps.map((rs, idx) => (
                    <span
                      key={rs}
                      className={`badge ${
                        idx <= riderIdx ? "badge-primary" : "badge-ghost"
                      }`}
                    >
                      {rs}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery details */}
            {order.delivery && (
              <div className="mt-4 p-4 bg-base-200 rounded-lg text-sm">
                <p className="font-semibold mb-1">Delivery Address</p>
                <p className="text-base-content/70">
                  {order.delivery.address}
                  {order.delivery.city ? `, ${order.delivery.city}` : ""}
                </p>
              </div>
            )}

            <p className="mt-6 text-sm text-base-content/60">
              {order.status === "Delivered"
                ? "Your order has been delivered. Enjoy your meal!"
                : order.status === "Cancelled"
                  ? "This order has been cancelled."
                  : `Currently: ${order.status}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
