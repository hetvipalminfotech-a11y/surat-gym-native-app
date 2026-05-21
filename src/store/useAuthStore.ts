import { create } from "zustand";
import { User } from "../types/auth.types";
import {
  getToken,
  getUser,
  setToken,
  setUser,
  setRefreshToken,
  clearStorage,
} from "../storage/mmkv";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state based on persistent MMKV storage
  const initialToken = getToken();
  const initialUser = getUser();

  return {
    user: initialUser,
    isLoggedIn: !!(initialToken && initialUser),

    login: (user, accessToken, refreshToken) => {
      // 1. Store BOTH tokens and user ONLY in MMKV persistent disk storage
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);

      // 2. Sync only reactive UI variables (user, logged-in status) to Zustand RAM
      set({
        user,
        isLoggedIn: true,
      });
    },

    logout: () => {
      // 1. Wipe MMKV disk storage completely
      clearStorage();

      // 2. Clear Zustand RAM state
      set({
        user: null,
        isLoggedIn: false,
      });
    },

    updateUser: (updatedFields) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updatedFields };
        
        // Sync updated user profile to MMKV
        setUser(updatedUser);
        
        return { user: updatedUser };
      });
    },
  };
});
