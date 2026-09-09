import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getPaymentIntent, payOrder } from "../../services/orderService";
import { useCartStore } from "../../store/cartStore";

// Brand colors so the bKash / Nagad / Card tiles look like the real brands.
const METHOD_TINT = {
  bKash: "bg-[#e2136e]",
  Nagad: "bg-[#f79200]",
  Card: "bg-[#635bff]",
};
const DEFAULT_TINT = "bg-[#635bff]";

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const methodTint = METHOD_TINT[order?.payment_method] || DEFAULT_TINT;
  const isOnline = order && order.payment_method !== "Cash on Delivery";
  const alreadyPaid =
    order && String(order.payment_status).toLowerCase() === "paid";

  useEffect(() => {
    let mounted = true;
    getPaymentIntent(orderId)
      .then((o) => {
        if (mounted) setOrder(o);
      })
      .catch((e) => {
        if (mounted)
          setError(
            e?.response?.data?.error || e?.message || "Could not load the order."
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [orderId]);

  // COD orders never reach the Stripe-style step (paid on delivery).
  useEffect(() => {
    if (order && !isOnline) {
      navigate(`/invoice/${order.order_no}`, { replace: true });
    }
  }, [order, isOnline, navigate]);

  // Already paid → straight to the invoice.
  useEffect(() => {
    if (order && alreadyPaid) {
      navigate(`/invoice/${order.order_no}`, { replace: true });
    }
  }, [order, alreadyPaid, navigate]);

  const discount = Number(order?.discount) || 0;

  const handlePay = async () => {
    if (!order || paying) return;
    setPaying(true);
    try {
      // Small deliberate delay so the tap feels like a real gateway redirect.
      await new Promise((r) => setTimeout(r, 1200));
      const res = await payOrder(order.order_no);
      toast.success(
        res?.alreadyPaid
          ? "Payment already confirmed."
          : "Payment successful! 🎉"
      );
      // The order is now confirmed in MongoDB — the cart's job is done.
      clearCart();
      navigate(`/invoice/${order.order_no}`, { replace: true });
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-16 max-w-md mx-auto card bg-base-100 shadow-md p-10 text-center">
        <p className="text-5xl">⚠️</p>
        <h1 className="text-xl font-bold mt-4">Payment unavailable</h1>
        <p className="text-sm text-base-content/60 mt-2">{error}</p>
        <Link to="/menu" className="btn btn-primary mt-6">
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-slate-100">
      <div className="w-full max-w-2xl">
        {/* Back link — the customer can leave without paying; nothing is
            confirmed in MongoDB unless they actually hit "Pay". */}
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1"
            onClick={() => navigate("/checkout")}
            disabled={paying}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Checkout
          </button>
        </div>

        {/* Stripe-style header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 font-bold text-base-content">
            <Lock className="w-4 h-4" />
            <span className="tracking-tight">Foodie Secure Checkout</span>
          </div>
          <span className="text-xs text-base-content/50 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Encrypted
          </span>
        </div>

        <div className="card bg-base-100 shadow-2xl overflow-hidden">
          {/* Brand-colored top strip */}
          <div className={`${methodTint} h-1.5`} />

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">
                  Pay with {order.payment_method}
                </h1>
                <p className="text-sm text-base-content/60 mt-0.5">
                  Order <span className="font-semibold">{order.order_no}</span>
                </p>
              </div>
              <span
                className={`badge text-white border-0 ${methodTint}`}
              >
                {order.payment_method}
              </span>
            </div>

            {/* Order items */}
            <div className="mt-6 rounded-xl border border-base-200 divide-y divide-base-200">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <img
                    src={it.image}
                    alt={it.food_name || it.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {it.food_name || it.name}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {it.quantity} × ৳{Number(it.unit_price || it.price).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-sm">
                    ৳
                    {(
                      Number(it.unit_price || it.price) * Number(it.quantity)
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Subtotal</span>
                <span>৳{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Delivery fee</span>
                <span>৳{Number(order.delivery_fee).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-৳{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-base-200">
                <span>Total</span>
                <span>৳{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery detail */}
            <div className="mt-4 text-sm text-base-content/60">
              <p className="font-semibold text-base-content">Deliver to</p>
              <p>{order.delivery?.name}</p>
              <p>{order.delivery?.address}</p>
            </div>

            <button
              className="btn btn-primary w-full mt-8 h-12 text-base gap-2 text-white bg-[#635bff] hover:bg-[#5145e3] border-0 disabled:cursor-not-allowed"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ৳{Number(order.total_amount).toFixed(2)}
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-base-content/40 flex items-center justify-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              Secured by Foodie Payments. Demo checkout — no real money is moved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;