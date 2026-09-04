import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const AUTH_USER_KEY = "mamun_auth_user";
const FAV_KEY = "food-favorites";

function currentUserFavKey() {
  try {
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    return `${FAV_KEY}_${user?.id || "guest"}`;
  } catch {
    return `${FAV_KEY}_guest`;
  }
}

const scopedFavStorage = {
  getItem: () => localStorage.getItem(currentUserFavKey()),
  setItem: (_name, value) => localStorage.setItem(currentUserFavKey(), value),
  removeItem: () => localStorage.removeItem(currentUserFavKey()),
};

export const useFavoritesStore = create(
  persist(
    (set) => ({
      favorites: [],
      toggleFavorite: (food) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.id === food.id);
          return {
            favorites: exists
              ? state.favorites.filter((f) => f.id !== food.id)
              : [...state.favorites, food],
          };
        }),
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: FAV_KEY,
      storage: createJSONStorage(() => scopedFavStorage),
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);
