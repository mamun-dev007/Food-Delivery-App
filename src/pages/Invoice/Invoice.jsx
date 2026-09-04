import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Truck,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchOrder } from "../../services/orderService";
import { SkeletonCard } from "../../components/dashboard/Skeleton";

const STATUS_STEPS = ["Pending", "Preparing", "On The Way", "Delivered"];

function statusIndex(status) {
  const idx = STATUS_STEPS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function formatMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Invoice = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Multi-restaurant orders carry per-restaurant sub_orders from the backend.
  const subs =
    Array.isArray(order?.sub_orders) && order.sub_orders.length > 0
      ? order.sub_orders
      : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await fetchOrder(orderId);
        if (!cancelled) setOrder(o);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.error || err?.message || "Order not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!order) return;
    const itemLines = (items) =>
      (Array.isArray(items) ? items : []).map((it) => {
        const st = (it.subtotal ?? it.unit_price * it.quantity) || 0;
        return `  - ${it.food_name || it.name} x${it.quantity} @ ${formatMoney(
          it.unit_price
        )} = ${formatMoney(st)}`;
      });
    const lines = [
      "FOOD DELIVERY - INVOICE",
      "========================",
      `Order ID: ${order.order_no}`,
      `Tracking ID: ${order.tracking_id}`,
      `Order date & time: ${formatDate(order.created_at)}`,
      "",
      ...(subs
        ? subs.flatMap((s) => [
            `Restaurant: ${s.restaurant_name}`,
            ...itemLines(s.items),
            `  Subtotal: ${formatMoney(s.subtotal)}`,
            "",
          ])
        : [
            `Restaurant: ${order.restaurant_name}`,
            "",
            "Ordered food:",
            ...itemLines(order.items),
            "",
          ]),
      `Subtotal: ${formatMoney(order.subtotal)}`,
      `Delivery fee: ${formatMoney(order.delivery_fee)}`,
      `Discount: -${formatMoney(order.discount || 0)}`,
      `Total amount: ${formatMoney(order.total_amount)}`,
      "",
      `Payment method: ${order.payment_method}`,
      `Payment status: ${order.payment_status}`,
      `Order status: ${order.status}`,
      `Delivery to: ${order.delivery?.address || "-"}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_no}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="my-16 max-w-md mx-auto card bg-base-100 shadow-md p-10 text-center">
        <p className="text-5xl">🧾</p>
        <h1 className="text-2xl font-bold mt-4">Invoice not found</h1>
        <p className="text-base-content/60 mt-2">{error || "This order could not be loaded."}</p>
        <Link to="/my-orders" className="btn btn-primary mt-6">
          Go to My Orders
        </Link>
      </div>
    );
  }

  const current = statusIndex(order.status);
  const itemSubtotal = order.items.reduce(
    (s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 1),
    0
  );

  return (
    <div className="my-8 max-w-3xl mx-auto px-4 print-area">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 no-print">
        <Link to="/my-orders" className="btn btn-ghost btn-sm gap-1">
          <ArrowLeft className="w-4 h-4" />
          My Orders
        </Link>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-1" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
          <button className="btn btn-outline btn-sm gap-1" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download Invoice
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md p-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-base-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="text-sm text-base-content/60">
              Order date &amp; time: {formatDate(order.created_at)}
            </p>
          </div>
          {order.restaurant_logo && (
            <img
              src={order.restaurant_logo}
              alt={order.restaurant_name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          )}
        </div>

        {/* IDs */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-base-200">
          <div>
            <p className="text-xs text-base-content/50 uppercase">Order ID</p>
            <p className="font-bold">{order.order_no}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50 uppercase">Tracking ID</p>
            <p className="font-bold">{order.tracking_id}</p>
          </div>
        </div>

        {/* Customer + delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-base-200">
          <div>
            <p className="text-xs text-base-content/50 uppercase mb-1">Customer</p>
            <p className="font-semibold">{order.delivery?.name || "Customer"}</p>
            <p className="text-sm text-base-content/60">{order.delivery?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50 uppercase mb-1">Delivery address</p>
            <p className="text-sm">{order.delivery?.address || "-"}</p>
            {order.delivery?.instructions && (
              <p className="text-xs text-base-content/50 mt-1">
                Instructions: {order.delivery.instructions}
              </p>
            )}
          </div>
        </div>

        {/* Restaurant */}
        <div className="py-4 border-b border-base-200">
          <p className="text-xs text-base-content/50 uppercase mb-1">
            Restaurant{subs && subs.length > 1 ? "s" : ""}
          </p>
          {subs ? (
            <div className="space-y-1">
              {subs.map((s) => (
                <div
                  key={s.subOrderId || s.restaurant_id}
                  className="flex items-center gap-2"
                >
                  {s.restaurant_logo && (
                    <img
                      src={s.restaurant_logo}
                      alt={s.restaurant_name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  )}
                  <span className="font-semibold">{s.restaurant_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-semibold">{order.restaurant_name}</p>
          )}
        </div>

        {/* Ordered food */}
        <div className="py-4 border-b border-base-200">
          <p className="text-xs text-base-content/50 uppercase mb-2">
            Ordered food
          </p>
          {subs ? (
            <div className="space-y-4">
              {subs.map((s) => (
                <div key={s.subOrderId || s.restaurant_id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="font-semibold text-sm">{s.restaurant_name}</p>
                    <p className="text-xs text-base-content/50">
                      {formatMoney(s.subtotal)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {s.items?.map((it, idx) => {
                      const st = it.subtotal ?? it.unit_price * it.quantity;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.food_name || it.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {it.food_name || it.name}
                            </p>
                            <p className="text-xs text-base-content/50">
                              Qty {it.quantity} × {formatMoney(it.unit_price)}
                            </p>
                          </div>
                          <p className="font-bold">{formatMoney(st)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {order.items.map((it, idx) => {
                const st = it.subtotal ?? it.unit_price * it.quantity;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    {it.image && (
                      <img
                        src={it.image}
                        alt={it.food_name || it.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {it.food_name || it.name}
                      </p>
                      <p className="text-xs text-base-content/50">
                        Qty {it.quantity} × {formatMoney(it.unit_price)}
                      </p>
                    </div>
                    <p className="font-bold">{formatMoney(st)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment + status */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-base-200">
          <div>
            <p className="text-xs text-base-content/50 uppercase">Payment</p>
            <p className="font-semibold">{order.payment_method}</p>
            <span
              className={`badge badge-sm mt-1 ${
                String(order.payment_status).toLowerCase() === "paid"
                  ? "badge-success"
                  : "badge-warning"
              }`}
            >
              {order.payment_status}
            </span>
          </div>
          <div>
            <p className="text-xs text-base-content/50 uppercase">Order status</p>
            <span className="badge badge-primary badge-sm">{order.status}</span>
            {order.order_note && (
              <p className="text-xs text-base-content/50 mt-2">
                Note: {order.order_note}
              </p>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="py-4 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal ?? itemSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>{formatMoney(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>-{formatMoney(order.discount || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-base-200 pt-2 mt-2">
            <span>Total amount</span>
            <span className="text-primary">{formatMoney(order.total_amount)}</span>
          </div>
        </div>

        {/* Track progress */}
        <div className="pt-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs text-base-content/50 uppercase">Tracking progress</p>
            <Link to={`/track-order?order=${order.order_no}`} className="btn btn-primary btn-sm gap-1">
              <Truck className="w-4 h-4" />
              Track Order
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= current;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-base-300" />
                  )}
                  <span className={`text-[10px] ${done ? "font-semibold" : "text-base-content/40"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
