// Reusable, auth-guarded "Add to Cart" action.
//
// A customer MUST be logged in before an item can be added to the cart.
// This guard runs BEFORE any cart state is updated:
//   - Not logged in          -> redirect to /customer/login (preserving the
//                               current page so the user can return after
//                               login) and show a login-required message.
//   - Logged in, not customer -> deny (restaurantOwner/rider/admin).
//   - Logged in customer      -> add the item to the cart.
//
// The role is read from the authenticated backend/MongoDB user (authStore),
// never from localStorage/URL/req.body.

import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { ROLES } from "../utils/roles";

export const useAddToCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const initializing = useAuthStore((s) => s.initializing);
  const addItems = useCartStore((s) => s.addItems);

  const addToCart = useCallback(
    (food, qty = 1) => {
      // Wait until Firebase/backend has confirmed the auth state before acting.
      if (initializing) return false;

      // Not logged in -> redirect to the customer login, remembering where the
      // user clicked so they can return to the same page after logging in.
      if (!user) {
        const from = location.pathname + location.search;
        navigate("/customer/login", {
          state: { from },
        });
        toast("Please login to add items to your cart.");
        return false;
      }

      // Logged in but not a customer -> never allow customer cart use.
      if (role !== ROLES.customer) {
        toast.error("Only customer accounts can add food to the cart.");
        return false;
      }

      // Allowed: add the item to the cart normally.
      addItems(food, qty);
      toast.success(`${food.name} added to cart`);
      return true;
    },
    [initializing, user, role, navigate, location.pathname, location.search, addItems]
  );

  return addToCart;
};

export default useAddToCart;
