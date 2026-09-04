import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Trash2, Loader2, Ticket, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { createOrder } from "../../services/orderService";
import { validateCoupon } from "../../services/couponService";

const PAYMENT_METHODS = [
  { label: "Cash on Delivery", value: "Cash on Delivery", note: "Pay when your food arrives." },
  { label: "bKash", value: "bKash", note: "Pay via bKash personal / merchant." },
  { label: "Nagad", value: "Nagad", note: "Pay via Nagad." },
  { label: "Card", value: "Card", note: "Visa / Mastercard / Amex." },
];

const ESTIMATED_MINUTES = 35;

// Saved addresses are persisted locally so they survive navigation.
const SAVED_ADDRESSES_KEY = "mamun_saved_addresses";

function readSavedAddresses() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_ADDRESSES_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSavedAddresses(list) {
  try {
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(list));
  } catch {
    // non-critical
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    phone: user?.phone || "",
    house: user?.deliveryAddress || "",
    roadArea: user?.area || "",
    city: user?.city || "",
    instructions: "",
    payment: "Cash on Delivery",
    note: "",
  });
  const [savedAddresses, setSavedAddresses] = useState(() =>
    readSavedAddresses()
  );
  const [placing, setPlacing] = useState(false);

  // ---- coupon state ----
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type, value, discount }
  const [couponLoading, setCouponLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddSavedAddress = () => {
    if (!form.house.trim() || !form.city.trim()) {
      toast.error("House/Flat and City are required to save an address.");
      return;
    }
    const addr = {
      id: Date.now().toString(),
      house: form.house.trim(),
      roadArea: form.roadArea.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      instructions: form.instructions.trim(),
    };
    const next = [addr, ...savedAddresses];
    setSavedAddresses(next);
    writeSavedAddresses(next);
    toast.success("Address added");
  };

  const applySavedAddress = (addr) => {
    setForm((prev) => ({
      ...prev,
      house: addr.house,
      roadArea: addr.roadArea || "",
      city: addr.city || "",
      phone: addr.phone || prev.phone,
      instructions: addr.instructions || prev.instructions,
    }));
    toast.success("Address selected");
  };

  const removeSavedAddress = (id) => {
    const next = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(next);
    writeSavedAddresses(next);
  };

  // ---- totals ----
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = Math.round(subtotal * 0.1 * 100) / 100;

  // Free Delivery coupons waive the delivery fee; other coupons discount the
  // subtotal (the backend already computed the exact discount amount).
  const couponDiscount = appliedCoupon?.discount || 0;
  const freeDelivery =
    appliedCoupon?.type === "Free Delivery" ? delivery : 0;
  const discount = Math.round((couponDiscount + freeDelivery) * 100) / 100;
  const total = Math.round((subtotal + delivery - discount) * 100) / 100;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }
    setCouponLoading(true);
    try {
      const coupon = await validateCoupon(code, subtotal);
      const finalCoupon = {
        ...coupon,
        discount:
          coupon.type === "Free Delivery"
            ? Math.round(delivery * 100) / 100
            : coupon.discount,
      };
      setAppliedCoupon(finalCoupon);
      toast.success(`Coupon ${code} applied!`);
    } catch (err) {
      toast.error(
        err?.response?.data?.error || err?.message || "Invalid coupon code."
      );
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  // The order is attributed to the first item's restaurant (cart may span
  // multiple restaurants; the backend splits it into per-restaurant sub-orders).
  const primaryRestaurant =
    items[0]?.restaurant || { id: null, name: "Food Delivery", logo: "" };

  // Per-restaurant subtotal groups shown in the summary sidebar.
  const restaurantGroups = items.reduce((acc, it) => {
    const name = it.restaurant?.name || primaryRestaurant.name;
    const key = it.restaurant?.id || name;
    if (!acc[key]) acc[key] = { id: it.restaurant?.id || null, name, subtotal: 0 };
    acc[key].subtotal += it.price * it.qty;
    return acc;
  }, {});
  const restaurantList = Object.values(restaurantGroups);
  const restaurantCount = restaurantList.length;

  const isComplete =
    form.house &&
    form.city &&
    form.phone &&
    items.length > 0;

  const handlePlaceOrder = async () => {
    if (!isComplete || placing) return;

    const payload = {
      restaurant: {
        id: primaryRestaurant.id,
        name: primaryRestaurant.name,
        logo: primaryRestaurant.logo,
      },
      items: items.map((it) => ({
        food_id: it.id,
        name: it.name,
        image: it.image,
        qty: it.qty,
        unit_price: it.price,
        restaurant: it.restaurant
          ? {
              id: it.restaurant.id,
              name: it.restaurant.name,
              logo: it.restaurant.logo,
            }
          : null,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      coupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            type: appliedCoupon.type,
          }
        : null,
      delivery_fee: Math.round(delivery * 100) / 100,
      payment_method: form.payment,
      note: form.note.trim(),
      delivery: {
        name: user?.name || "",
        phone: form.phone,
        address: [form.house, form.roadArea, form.city].filter(Boolean).join(", "),
        city: form.city,
        instructions: form.instructions,
      },
    };

    setPlacing(true);
    try {
      const order = await createOrder(payload);
      clearCart();
      toast.success("Order placed successfully! 🎉");
      navigate(`/invoice/${order.order_no}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to place order");
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="my-16 max-w-md mx-auto card bg-base-100 shadow-md p-10 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="text-2xl font-bold mt-4">Your cart is empty</h1>
        <p className="text-base-content/60 mt-2">
          Add items before checking out.
        </p>
        <Link to="/menu" className="btn btn-primary mt-6">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="my-8 max-w-4xl mx-auto">
      <Link to="/cart" className="btn btn-ghost btn-sm gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ======= Delivery Address ======= */}
          <section className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Address
            </h2>

            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-base-content/60 mb-2">Saved addresses</p>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-center justify-between gap-2 border border-base-300 rounded-lg p-3"
                    >
                      <button
                        type="button"
                        onClick={() => applySavedAddress(addr)}
                        className="text-left flex-1"
                      >
                        <p className="font-medium text-sm">
                          {[addr.house, addr.roadArea, addr.city].filter(Boolean).join(", ")}
                        </p>
                        {addr.phone && (
                          <p className="text-xs text-base-content/50">{addr.phone}</p>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => removeSavedAddress(addr.id)}
                        aria-label="Remove saved address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-base-content/60 mb-3">Add new address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">House / Flat</span>
                </label>
                <input
                  name="house"
                  className="input input-bordered"
                  value={form.house}
                  onChange={handleChange}
                  placeholder="House, building, flat"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Road / Area</span>
                </label>
                <input
                  name="roadArea"
                  className="input input-bordered"
                  value={form.roadArea}
                  onChange={handleChange}
                  placeholder="Road, block, area"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">City</span>
                </label>
                <input
                  name="city"
                  className="input input-bordered"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone number</span>
                </label>
                <input
                  name="phone"
                  className="input input-bordered"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+8801XXXXXXXXX"
                />
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text">Delivery instructions</span>
                </label>
                <input
                  name="instructions"
                  className="input input-bordered"
                  value={form.instructions}
                  onChange={handleChange}
                  placeholder="e.g. Ring the bell twice, leave at the gate"
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm btn-primary mt-4 gap-1"
              onClick={handleAddSavedAddress}
            >
              <Plus className="w-4 h-4" />
              Save this address
            </button>
          </section>

          {/* ======= Order Summary ======= */}
          <section className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border border-base-200 rounded-xl p-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-base-content/50">
                      {item.restaurant?.name || primaryRestaurant.name}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {item.discount > 0 ? (
                        <>
                          <span className="text-base-content/40 line-through">
                            ৳{Number(item.originalPrice).toFixed(2)}
                          </span>{" "}
                          <span className="badge badge-error badge-xs mr-1">
                            -{item.discount}%
                          </span>
                        </>
                      ) : null}
                      Unit ৳{item.price.toFixed(2)} × {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-circle btn-xs"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                    >
                      -
                    </button>
                    <span className="font-semibold w-6 text-center">{item.qty}</span>
                    <button
                      className="btn btn-circle btn-xs"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary w-16 text-right">
                      ৳{(item.price * item.qty).toFixed(2)}
                    </span>
                    <button
                      className="btn btn-ghost btn-circle btn-xs text-error"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ======= Payment ======= */}
          <section className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`label cursor-pointer justify-start gap-3 border rounded-lg p-3 ${
                    form.payment === m.value ? "border-primary bg-primary/5" : "border-base-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="radio radio-primary"
                    checked={form.payment === m.value}
                    onChange={() => setForm((p) => ({ ...p, payment: m.value }))}
                  />
                  <span>
                    <span className="block font-medium">{m.label}</span>
                    <span className="block text-xs text-base-content/50">{m.note}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="alert alert-info mt-4 text-sm">
              <span>
                Online payment status:{" "}
                <span className="font-semibold">Pending</span> — marked "Paid"
                after confirmation for online methods, or on delivery for Cash on
                Delivery.
              </span>
            </div>
          </section>
        </div>

        {/* ======= Order Information / Summary sidebar ======= */}
        <div className="space-y-6">
          <section className="card bg-base-100 shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Information</h2>
            <dl className="text-sm space-y-3">
              <div className="flex justify-between">
                <dt className="text-base-content/60">Estimated delivery</dt>
                <dd className="font-medium">{ESTIMATED_MINUTES} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/60">Delivery fee (10%)</dt>
                <dd className="font-medium">৳{delivery.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/60">
                  Restaurant{restaurantCount > 1 ? "s" : ""}
                </dt>
                <dd className="font-medium text-right max-w-[200px]">
                  {restaurantList.map((g) => (
                    <span key={g.name} className="block truncate text-sm">
                      {g.name}
                      <span className="text-base-content/50">
                        {" "}
                        · ৳{g.subtotal.toFixed(2)}
                      </span>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="divider my-3" />

            <div className="form-control">
              <label className="label">
                <span className="label-text">Order note</span>
              </label>
              <textarea
                name="note"
                className="textarea textarea-bordered text-sm"
                rows={2}
                value={form.note}
                onChange={handleChange}
                placeholder="e.g. No onions, extra spicy"
              />
            </div>

            <div className="divider my-3" />

            {/* ======= Coupon / Discount ======= */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-1">
                  <Ticket className="w-4 h-4 text-primary" />
                  Apply Coupon / Promo Code
                </span>
              </label>
              {appliedCoupon ? (
                <div className="flex items-center gap-2 justify-between border border-success/40 bg-success/5 rounded-lg p-2.5">
                  <div className="min-w-0">
                    <p className="font-bold text-success text-sm truncate">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-xs text-base-content/60 truncate">
                      {appliedCoupon.type === "Percentage" &&
                        `${appliedCoupon.value}% off`}
                      {appliedCoupon.type === "Flat Amount" &&
                        `৳${appliedCoupon.value} off`}
                      {appliedCoupon.type === "Free Delivery" &&
                        "Free delivery"}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-circle btn-xs text-base-content/60"
                    onClick={handleRemoveCoupon}
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    name="coupon"
                    className="input input-bordered flex-1 uppercase text-sm"
                    placeholder="e.g. WELCOME30"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-primary btn-sm"
                    disabled={couponLoading || !couponInput.trim()}
                    onClick={handleApplyCoupon}
                  >
                    {couponLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}
              <label className="label">
                <span className="label-text text-xs text-base-content/50">
                  Use codes from the Offers page for real discounts.
                </span>
              </label>
            </div>

            <div className="divider my-3" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery (10%)</span>
                <span>৳{delivery.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    Discount
                    {appliedCoupon ? ` (${appliedCoupon.code})` : ""}
                  </span>
                  <span>-৳{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn btn-primary w-full mt-5"
              disabled={!isComplete || placing}
              onClick={handlePlaceOrder}
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing order...
                </>
              ) : (
                "Place Order"
              )}
            </button>
            {!isComplete && !placing && (
              <p className="text-xs text-base-content/50 text-center mt-2">
                Fill in your delivery address and phone to place the order.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
