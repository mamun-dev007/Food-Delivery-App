import { create } from "zustand";

// delivery: { id, customer, restaurant, items, earnings, pickup, dropoff, distance, status }
const availableDeliveries = [
  { id: "D-501", customer: "Rafsan", restaurant: "Pizza Palace", items: "Margherita Pizza ×2", earnings: 5.5, pickup: "Pizza Palace, Gulshan", dropoff: "Dhanmondi 27", distance: "4.2 km", status: "Available" },
  { id: "D-502", customer: "Sadia", restaurant: "Burger Barn", items: "Cheese Burger ×1", earnings: 4.0, pickup: "Burger Barn, Banani", dropoff: "Uttara Sector 7", distance: "6.1 km", status: "Available" },
  { id: "D-503", customer: "Tanvir", restaurant: "Green Garden", items: "Veggie Salad ×1", earnings: 4.5, pickup: "Green Garden, Badda", dropoff: "Mirpur 12", distance: "5.0 km", status: "Available" },
  { id: "D-504", customer: "Nusrat", restaurant: "Sushi House", items: "Sushi Platter ×1", earnings: 6.0, pickup: "Sushi House, Gulshan", dropoff: "Mohammadpur", distance: "7.3 km", status: "Available" },
];

const deliveryHistory = [
  { id: "D-410", customer: "Arif", items: "Pasta Alfredo ×1", earnings: 5.0, status: "Delivered", date: "Sep 02, 2026" },
  { id: "D-412", customer: "Mim", items: "Chicken Wings ×2", earnings: 5.5, status: "Delivered", date: "Sep 02, 2026" },
  { id: "D-400", customer: "Farhan", items: "Cheese Burger ×2", earnings: 4.5, status: "Delivered", date: "Sep 01, 2026" },
  { id: "D-398", customer: "Rima", items: "Chocolate Cake ×1", earnings: 3.5, status: "Delivered", date: "Aug 31, 2026" },
  { id: "D-391", customer: "Jubayer", items: "Veggie Salad ×1", earnings: 4.0, status: "Delivered", date: "Aug 30, 2026" },
];

export const DELIVERY_STATUS = [
  "Accepted",
  "At Restaurant",
  "Picked Up",
  "On The Way",
  "Delivered",
];

export const useRiderStore = create((set) => ({
  available: availableDeliveries,
  accepted: [],
  history: deliveryHistory,

  acceptDelivery: (id) =>
    set((state) => {
      const delivery = state.available.find((d) => d.id === id);
      if (!delivery) return state;
      return {
        available: state.available.filter((d) => d.id !== id),
        accepted: [
          { ...delivery, dstatus: "At Restaurant" },
          ...state.accepted,
        ],
      };
    }),

  updateStatus: (id, status) =>
    set((state) => ({
      accepted: state.accepted.map((d) =>
        d.id === id ? { ...d, dstatus: status } : d
      ),
    })),

  completeDelivery: (id) =>
    set((state) => {
      const delivery = state.accepted.find((d) => d.id === id);
      if (!delivery) return state;
      return {
        accepted: state.accepted.filter((d) => d.id !== id),
        history: [
          {
            id: delivery.id,
            customer: delivery.customer,
            items: delivery.items,
            earnings: delivery.earnings,
            status: "Delivered",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          },
          ...state.history,
        ],
      };
    }),
}));
