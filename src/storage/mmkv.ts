import { createMMKV } from "react-native-mmkv";
import { User } from "../types/auth.types";

export interface StorageInterface {
  set(key: string, value: string | boolean | number | Uint8Array): void;
  getString(key: string): string | undefined;
  contains(key: string): boolean;
  clearAll(): void;
  addOnValueChangedListener(callback: (key: string) => void): { remove: () => void };
}

const getStorageInstance = (): StorageInterface => {
  try {
    return createMMKV() as unknown as StorageInterface;
  } catch (e) {
    console.warn(
      "MMKV native module not found (Expo Go environment detected). Falling back to dynamic in-memory store for testing."
    );
    
    // High-fidelity in-memory Mock storage for Expo Go compatibility
    const memoryStore = new Map<string, string>();
    const changeListeners = new Set<(key: string) => void>();

    return {
      set: (key: string, value: string | boolean | number | Uint8Array) => {
        memoryStore.set(key, String(value));
        changeListeners.forEach((cb) => cb(key));
      },
      getString: (key: string) => {
        return memoryStore.get(key);
      },
      contains: (key: string) => {
        return memoryStore.has(key);
      },
      clearAll: () => {
        memoryStore.clear();
        // Notify listeners of cleared keys
        changeListeners.forEach((cb) => cb("token"));
        changeListeners.forEach((cb) => cb("user"));
      },
      addOnValueChangedListener: (cb: (key: string) => void) => {
        changeListeners.add(cb);
        return {
          remove: () => {
            changeListeners.delete(cb);
          },
        };
      },
    };
  }
};

export const storage: StorageInterface = getStorageInstance();

// TOKEN
export const setToken = (token: string): void => {
  storage.set("token", token);
};

export const getToken = (): string | undefined => {
  return storage.getString("token");
};

// USER
export const setUser = (user: User): void => {
  storage.set("user", JSON.stringify(user));
};

export const getUser = (): User | null => {
  try {
    const data = storage.getString("user");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

// CLEAR
export const clearStorage = (): void => {
  storage.clearAll();
};
