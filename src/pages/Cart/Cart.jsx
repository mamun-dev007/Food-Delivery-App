import { useCartStore } from "../../store/cartStore";
import { Link } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";

const Cart = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + delivery;

  if (items.length === 0) {
    return (
      <div className="my-16 max-w-md mx-auto card bg-base-100 shadow-md p-10 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="text-2xl font-bold mt-4">Your cart is empty</h1>
        <p className="text-base-content/60 mt-2">
          Add some delicious food to get started.
        </p>
        <Link to="/menu" className="btn btn-primary mt-6">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="my-8 max-w-4xl mx-auto">
      <Link to="/menu" className="btn btn-ghost btn-sm gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Continue Shopping
      </Link>
      <h1 className="text-4xl font-bold mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card bg-base-100 shadow-md">
              <div className="card-body p-4 flex-row items-center gap-4 flex-wrap">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-40">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-base-content/60">
                    {item.discount > 0 && (
                      <>
                        <span className="text-base-content/40 line-through">
                          ৳{Number(item.originalPrice).toFixed(2)}
                        </span>{" "}
                        <span className="badge badge-error badge-xs mr-1">
                          -{item.discount}%
                        </span>
                      </>
                    )}
                    ৳{item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">
                    ৳{(item.price * item.qty).toFixed(2)}
                  </span>
                  <button
                    className="btn btn-ghost btn-circle btn-xs text-error"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm text-error" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className="card bg-base-100 shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery (10%)</span>
              <span>৳{delivery.toFixed(2)}</span>
            </div>
            <div className="divider my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn btn-primary w-full mt-4">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
