import { create } from "zustand";
import { updateProfile } from "../services/authService";

const THEME_KEY = "foodie_theme";

function readInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // matchMedia unavailable
  }
  return "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

const initial = readInitialTheme();
applyTheme(initial);

export const useThemeStore = create((set, get) => ({
  theme: initial,

  toggleTheme: async () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
    try {
      await updateProfile({ theme: next });
    } catch {
      // Best-effort — theme still applies locally.
    }
  },

  setTheme: (theme) => {
    const next = theme === "dark" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next });
  },

  setThemeAndSync: async (theme) => {
    const next = theme === "dark" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next });
    try {
      await updateProfile({ theme: next });
    } catch {
      // Best-effort.
    }
  },

  resetTheme: () => {
    let system = "light";
    try {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) system = "dark";
    } catch {
      // noop
    }
    applyTheme(system);
    set({ theme: system });
  },
}));
