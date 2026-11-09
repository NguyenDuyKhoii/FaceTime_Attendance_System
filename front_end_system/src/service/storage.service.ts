import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/api.types";
import { STORAGE_KEYS } from "../utils/constants";

export const storageService = {
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error("Error saving token:", error);
      throw error;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },
};
