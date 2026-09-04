import { create } from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import {
  signupUser,
  loginUser,
  getMe,
  logoutFirebase,
} from "../services/authService";
import { useCartStore } from "../store/cartStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { useThemeStore } from "../store/themeStore";
import { CUSTOMER_LS_KEYS } from "../services/customerService";
import { auth } from "../firebase/config";

const AUTH_TOKEN_KEY = "mamun_auth_token";
const AUTH_USER_KEY = "mamun_auth_user";
const AUTH_PROFILE_KEY = "mamun_profile";
const PLACED_ORDERS_KEY = "mamun_placed_orders";

function readStored() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    return { user, role: user?.role || null, token };
  } catch {
    return { user: null, role: null, token: null };
  }
}

function readLocalProfile() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveLocalProfile(data) {
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(data));
}

const stored = readStored();

let rejectedLogin = false;

// After the session user changes (login/switch/logout), re-read the scoped
// cart + favorites from their own localStorage keys so the previous user's
// in-memory items never leak into the next user's UI.
function rehydrateUserScopedState() {
  requestAnimationFrame(() => {
    useCartStore.persist.rehydrate();
    useFavoritesStore.persist.rehydrate();
  });
}

export const useAuthStore = create((set, get) => ({
  user: stored.user,
  role: stored.role,
  token: stored.token,
  loading: false,
  initializing: true,

  setSession: (token, user) => {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    if (user?.theme) useThemeStore.getState().setTheme(user.theme);
    set({ user, role: user?.role || null, token, loading: false });
    rehydrateUserScopedState();
  },

  saveProfile: (data) => {
    const current = get().user;
    saveLocalProfile({ ...data, _userId: current?.id || null });
  },

  signup: async (payload) => {
    set({ loading: true });
    try {
      const { token, user } = await signupUser(payload);
      get().setSession(token, user);
      return user;
    } finally {
      set({ loading: false });
    }
  },

  login: async (payload) => {
    set({ loading: true });
    rejectedLogin = false;
    try {
      const { token, user } = await loginUser(payload);
      get().setSession(token, user);
      return user;
    } catch (err) {
      rejectedLogin = true;
      get().clearSession();
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchMe: async () => {
    try {
      const { user } = await getMe();
      const local = readLocalProfile();
      const sameUser = local && local._userId === user.id;
      const merged = {
        ...user,
        name: sameUser && local.name ? local.name : user.name,
        avatar_url:
          sameUser && local.avatar_url ? local.avatar_url : user.avatar_url,
      };
      get().setSession(null, merged);
      set({ initializing: false });
      return merged;
    } catch {
      get().clearSession();
      set({ initializing: false });
      return null;
    }
  },

  clearSession: () => {
    // Capture the current user id BEFORE auth keys are removed so we can wipe
    // their per-user preference keys without touching other users' data.
    const userId = get().user?.id || (() => {
      try {
        return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null")?.id;
      } catch {
        return null;
      }
    })();

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);

    if (userId) {
      for (const key of CUSTOMER_LS_KEYS) {
        localStorage.removeItem(`${key}_${userId}`);
      }
    }
    localStorage.removeItem(PLACED_ORDERS_KEY);

    useThemeStore.getState().resetTheme();

    set({ user: null, role: null, token: null, loading: false, initializing: false });
    // The scoped cart/favorites stores now read from the guest key.
    rehydrateUserScopedState();
  },

  logout: async () => {
    try {
      await logoutFirebase();
    } catch {
      // Even if Firebase sign-out fails, clear the local session.
    }
    get().clearSession();
  },
}));

export function initAuthListener() {
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      if (rejectedLogin) return;
      await useAuthStore.getState().fetchMe();
    } else {
      useAuthStore.getState().clearSession();
    }
  });
}