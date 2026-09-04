import { create } from "zustand";

const statuses = ["Pending", "Preparing", "On The Way", "Delivered", "Cancelled"];

const seedOrders = [
  { id: "ORD-1001", customer: "Rafsan", items: [{ name: "Margherita Pizza", qty: 2, price: 8.99 }], total: 17.98, status: "Pending", date: "2026-09-03", payment: "Cash on Delivery" },
  { id: "ORD-1002", customer: "Sadia", items: [{ name: "Cheese Burger", qty: 1, price: 6.49 }, { name: "French Fries", qty: 2, price: 3.99 }], total: 14.47, status: "Preparing", date: "2026-09-03", payment: "bKash" },
  { id: "ORD-1003", customer: "Tanvir", items: [{ name: "Pasta Alfredo", qty: 3, price: 10.99 }], total: 32.97, status: "On The Way", date: "2026-09-02", payment: "Card" },
  { id: "ORD-1004", customer: "Nusrat", items: [{ name: "Chicken Wings", qty: 2, price: 9.49 }, { name: "Chocolate Cake", qty: 1, price: 5.49 }], total: 24.47, status: "Delivered", date: "2026-09-02", payment: "Cash on Delivery" },
  { id: "ORD-1005", customer: "Arif", items: [{ name: "Veggie Salad", qty: 1, price: 7.99 }], total: 7.99, status: "Delivered", date: "2026-09-01", payment: "Card" },
  { id: "ORD-1006", customer: "Mim", items: [{ name: "Margherita Pizza", qty: 1, price: 8.99 }, { name: "Chocolate Cake", qty: 2, price: 5.49 }], total: 19.97, status: "Cancelled", date: "2026-08-31", payment: "bKash" },
];

export const useOrdersStore = create((set) => ({
  orders: seedOrders,
  updateStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status } : o
      ),
    })),
}));

export { statuses };
