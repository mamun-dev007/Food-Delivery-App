import { create } from "zustand";
import {
  fetchRestaurantRequests,
  approveRestaurantRequest,
  rejectRestaurantRequest,
  fetchRiderRequests,
  approveRiderRequest,
  rejectRiderRequest,
} from "../services/adminService";
import {
  fetchAdminCoupons,
  createAdminCoupon,
  deleteAdminCoupon,
} from "../services/couponService";

const seedUsers = [
  { id: 1, name: "Mamun Ahmed", email: "mamun@example.com", role: "Customer", status: "Active", joined: "2026-01-12" },
  { id: 2, name: "Rafsan", email: "rafsan@example.com", role: "Customer", status: "Active", joined: "2026-02-03" },
  { id: 3, name: "Sadia", email: "sadia@example.com", role: "Customer", status: "Active", joined: "2026-03-18" },
  { id: 4, name: "Tanvir", email: "tanvir@example.com", role: "Customer", status: "Inactive", joined: "2026-04-09" },
  { id: 5, name: "Nusrat", email: "nusrat@example.com", role: "Customer", status: "Active", joined: "2026-05-21" },
];

const seedRestaurants = [
  { id: 1, name: "MAMUN Kitchen", owner: "Mamun", cuisine: "Mixed", status: "Active", rating: 4.9 },
  { id: 2, name: "Pizza Palace", owner: "Alex", cuisine: "Italian", status: "Active", rating: 4.8 },
  { id: 3, name: "Burger Barn", owner: "Sara", cuisine: "Fast Food", status: "Active", rating: 4.6 },
  { id: 4, name: "Green Garden", owner: "Mina", cuisine: "Healthy", status: "Suspended", rating: 4.4 },
  { id: 5, name: "Sushi House", owner: "Kenji", cuisine: "Japanese", status: "Active", rating: 4.9 },
];

const seedRiders = [
  { id: 1, name: "Rakib Hasan", phone: "01811111111", vehicle: "Motorcycle", status: "Active", deliveries: 142 },
  { id: 2, name: "Jubayer", phone: "01822222222", vehicle: "Bicycle", status: "Active", deliveries: 88 },
  { id: 3, name: "Rima", phone: "01833333333", vehicle: "Motorcycle", status: "Active", deliveries: 201 },
  { id: 4, name: "Farhan", phone: "01844444444", vehicle: "Scooter", status: "Inactive", deliveries: 57 },
];

const seedCoupons = [
  { id: 1, code: "MAMUN20", type: "Percentage", value: 20, usage: 340, expires: "2026-12-31" },
  { id: 2, code: "FREEDEL", type: "Free Delivery", value: 0, usage: 512, expires: "2026-11-30" },
  { id: 3, code: "WEEKEND50", type: "Percentage", value: 50, usage: 128, expires: "2026-10-31" },
  { id: 4, code: "PASTA15", type: "Percentage", value: 15, usage: 95, expires: "2026-09-30" },
];

export const useAdminStore = create((set) => ({
  users: seedUsers,
  restaurants: seedRestaurants,
  riders: seedRiders,
  categories: [
    "Pizza",
    "Burger",
    "Salad",
    "Pasta",
    "Dessert",
    "Snacks",
    "Sushi",
    "Drinks",
    "Main",
  ],
  coupons: seedCoupons,
  couponsLoading: false,
  orders: 1284,
  revenue: 48250.75,

  restaurantRequests: [],
  requestsLoading: false,

  riderRequests: [],
  riderRequestsLoading: false,

  // Load coupons from MongoDB.
  loadCoupons: async () => {
    set({ couponsLoading: true });
    try {
      const coupons = await fetchAdminCoupons();
      set({ coupons, couponsLoading: false });
    } catch (err) {
      set({ couponsLoading: false });
      throw err;
    }
  },

  addCoupon: async (coupon) => {
    const created = await createAdminCoupon(coupon);
    set((state) => ({
      coupons: [created, ...state.coupons],
    }));
    return created;
  },
  deleteCoupon: async (id) => {
    await deleteAdminCoupon(id);
    set((state) => ({
      coupons: state.coupons.filter((c) => c.id !== id),
    }));
  },

  // Load pending/rejected restaurant-owner verification requests.
  loadRequests: async () => {
    set({ requestsLoading: true });
    try {
      const requests = await fetchRestaurantRequests();
      set({ restaurantRequests: requests, requestsLoading: false });
    } catch (err) {
      set({ restaurantRequests: [], requestsLoading: false });
      throw err;
    }
  },

  // Approve/reject a request and update the local list.
  reviewRequest: async (id, action) => {
    if (action === "approve") await approveRestaurantRequest(id);
    else await rejectRestaurantRequest(id);
    set((state) => ({
      restaurantRequests: state.restaurantRequests.filter((r) => r.id !== id),
    }));
  },

  // Load pending/rejected rider verification requests.
  loadRiderRequests: async () => {
    set({ riderRequestsLoading: true });
    try {
      const requests = await fetchRiderRequests();
      set({ riderRequests: requests, riderRequestsLoading: false });
    } catch (err) {
      set({ riderRequests: [], riderRequestsLoading: false });
      throw err;
    }
  },

  // Approve/reject a rider request and update the local list.
  reviewRiderRequest: async (id, action) => {
    if (action === "approve") await approveRiderRequest(id);
    else await rejectRiderRequest(id);
    set((state) => ({
      riderRequests: state.riderRequests.filter((r) => r.id !== id),
    }));
  },
}));
