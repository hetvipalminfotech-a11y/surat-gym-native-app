import { createMMKV } from "react-native-mmkv";
import { User } from "../types/auth.types";

export interface StorageInterface {
  set(key: string, value: string | boolean | number | Uint8Array): void;
  getString(key: string): string | undefined;
  contains(key: string): boolean;
  clearAll(): void;
  addOnValueChangedListener(
    callback: (key: string) => void
  ): { remove: () => void };
}

const getStorageInstance = (): StorageInterface => {
  try {
    return createMMKV() as unknown as StorageInterface;
  } catch (e) {
    console.warn(
      "MMKV native module not found (Expo Go environment detected)."
    );
    return {} as StorageInterface;
  }
};

export const storage: StorageInterface = getStorageInstance();

// export const storage = createMMKV();

// TOKEN
export const setToken = (token: string): void => {
  storage.set("token", token);
};

export const getToken = (): string | undefined => {
  return storage.getString("token");
};

export const setRefreshToken = (token: string): void => {
  storage.set("refreshToken", token);
};

export const getRefreshToken = (): string | undefined => {
  return storage.getString("refreshToken");
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

export const getDeviceId = (): string => {
  let deviceId = storage.getString("deviceId");
  if (!deviceId) {
    deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    storage.set("deviceId", deviceId);
  }
  return deviceId;
};
