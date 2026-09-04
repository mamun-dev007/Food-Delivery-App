import { create } from "zustand";

const seedFoods = [
  { id: 1, name: "Margherita Pizza", category: "Pizza", price: 8.99, rating: 4.8, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80", stock: 50 },
  { id: 2, name: "Cheese Burger", category: "Burger", price: 6.49, rating: 4.6, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", stock: 80 },
  { id: 3, name: "Veggie Salad", category: "Salad", price: 7.99, rating: 4.5, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", stock: 60 },
  { id: 4, name: "Pasta Alfredo", category: "Pasta", price: 10.99, rating: 4.7, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80", stock: 40 },
  { id: 5, name: "Chocolate Cake", category: "Dessert", price: 5.49, rating: 4.9, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", stock: 30 },
  { id: 6, name: "Chicken Wings", category: "Snacks", price: 9.49, rating: 4.7, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80", stock: 70 },
];

export const useRestaurantStore = create((set) => ({
  foods: seedFoods,
  addFood: (food) =>
    set((state) => ({
      foods: [
        { ...food, id: Date.now(), rating: food.rating || 4.5 },
        ...state.foods,
      ],
    })),
  updateFood: (id, updates) =>
    set((state) => ({
      foods: state.foods.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),
  deleteFood: (id) =>
    set((state) => ({
      foods: state.foods.filter((f) => f.id !== id),
    })),
}));
