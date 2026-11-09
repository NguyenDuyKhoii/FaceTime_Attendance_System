import { authApi } from "../api/auth.api";
import {
  Login,
  LoginResponse,
  Register,
  RegisterResponse,
} from "../types/api.types";
import { storageService } from "./storage.service";

export const authService = {
  async login(userData: Login): Promise<LoginResponse> {
    try {
      const response = await authApi.login(userData);
      await storageService.saveToken(response.token);
      await storageService.saveUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async register(data: Register): Promise<RegisterResponse> {
    try {
      // Gọi API register
      const response = await authApi.register(data);
      // Return response (API sẽ trả về message hoặc thông tin đăng ký)
      return response;
    } catch (error) {
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await storageService.clearAll();
    } catch (error) {
      await storageService.clearAll();
      throw error;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storageService.getToken();
    return !!token;
  },

  async getToken(): Promise<string | null> {
    return await storageService.getToken();
  },
};
