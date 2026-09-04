import { create } from "zustand";

export const useRestaurantProfileStore = create((set) => ({
  profile: {
    name: "MAMUN Kitchen",
    tagline: "Delicious food, delivered fast",
    cuisine: "Mixed",
    address: "123 Food Street, Dhaka",
    phone: "+8801XXXXXXXXX",
    email: "owner@mamunkitchen.com",
    deliveryTime: "25 min",
    minOrder: 5,
    open: true,
  },
  updateProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
}));
