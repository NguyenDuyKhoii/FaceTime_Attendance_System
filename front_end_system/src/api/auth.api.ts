import { Login, LoginResponse, Register, RegisterResponse } from "../types/api.types";
import { API_ENDPOINTS } from "../utils/constants";
import axiosClient from "./axiosClient";

export const authApi = {
  async login(userData: Login): Promise<LoginResponse> {
    try {
      const response = await axiosClient.post<any, LoginResponse>(
        API_ENDPOINTS.LOGIN,
        userData,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async register(data: Register): Promise<RegisterResponse> {
    try {
      const response = await axiosClient.post<any, RegisterResponse>(
        API_ENDPOINTS.REGISTER,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.ME);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
