import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { fmtMoney } from "../rider/shared";

const DELIVERY_FEE = 40;

const CartWidget = () => {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const navigate = useNavigate();

  const subtotal = items.reduce((s, i) => s + Number(i.price || 0) * (i.qty || 1), 0);
  const [discount, setDiscount] = useState(0);
  const grandTotal = Math.max(0, subtotal + (subtotal > 0 ? DELIVERY_FEE : 0) - discount);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-200 text-base-content/30">
          <UtensilsCrossed className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-base-content/70">Your cart is empty.</p>
        <Link
          to="/menu"
          className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-content transition-colors hover:bg-primary-focus"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3">
          <img
            src={it.image}
            alt={it.name}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-base-content/90">{it.name}</p>
            <p className="text-xs text-base-content/40">{fmtMoney(it.price)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if ((it.qty || 1) <= 1) removeItem(it.id);
                else updateQty(it.id, (it.qty || 1) - 1);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-base-300 text-base-content/60 transition-colors hover:border-primary/60 hover:text-primary"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center text-sm font-bold text-base-content/90">{it.qty}</span>
            <button
              onClick={() => addItem({ ...it, qty: (it.qty || 1) + 1 })}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-base-300 text-base-content/60 transition-colors hover:border-primary/60 hover:text-primary"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => removeItem(it.id)}
            className="text-base-content/30 transition-colors hover:text-error"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {/* Totals */}
      <div className="space-y-1.5 border-t border-base-300/60 pt-3 text-sm">
        <div className="flex justify-between text-base-content/60">
          <span>Subtotal</span>
          <span className="font-semibold text-base-content/90">{fmtMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base-content/60">
          <span>Delivery Fee</span>
          <span className="font-semibold text-base-content/90">{fmtMoney(DELIVERY_FEE)}</span>
        </div>
        <div className="flex justify-between text-base-content/60">
          <span>Discount</span>
          <span className="font-semibold text-success">
            {discount > 0 ? `-${fmtMoney(discount)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between border-t border-base-300/60 pt-1.5">
          <span className="font-bold text-base-content">Grand Total</span>
          <span className="text-base font-bold text-base-content">{fmtMoney(grandTotal)}</span>
        </div>
      </div>

      <button
        onClick={() => navigate("/checkout")}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
      >
        Checkout
      </button>
      <button
        onClick={() => setDiscount(subtotal * 0.1)}
        className="w-full rounded-xl border border-base-300 py-2 text-xs font-semibold text-base-content/60 transition-colors hover:border-primary/40 hover:text-primary"
      >
        Apply 10% promo
      </button>
    </div>
  );
};

export default CartWidget;