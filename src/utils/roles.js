// Central definition of roles and role → dashboard route mapping.
// Single source of truth used by RequireAuth, login/signup and the navbar.

export const ROLES = {
  customer: "customer",
  restaurantOwner: "restaurantOwner",
  rider: "rider",
  admin: "admin",
};

export const ROLE_LIST = Object.values(ROLES);

// The canonical dashboard route each role lands on after login/signup.
export const ROLE_DASHBOARD = {
  customer: "/customer/dashboard",
  restaurantOwner: "/dashboard",
  rider: "/rider/dashboard",
  admin: "/admin/dashboard",
};

// Human-readable labels (used by auth pages + navbar badge).
export const ROLE_LABELS = {
  customer: "Customer",
  restaurantOwner: "Restaurant Owner",
  rider: "Rider",
  admin: "Admin",
};

// Which roles are allowed to sign up publicly. Admin is intentionally excluded —
// admin accounts are only created via controlled backend/seed scripts.
export const PUBLIC_SIGNUP_ROLES = [
  ROLES.customer,
  ROLES.restaurantOwner,
  ROLES.rider,
];
