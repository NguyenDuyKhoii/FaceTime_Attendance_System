import { API_ENDPOINTS } from "../utils/constants";
import axiosClient from "./axiosClient";

export interface Department {
  id: number;
  departmentCode: string;
  name: string;
  description?: string;
}

export const departmentApi = {
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await axiosClient.get<any, Department[]>(
        API_ENDPOINTS.DEPARTMENTS,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async createDepartment(data: Omit<Department, "id">): Promise<Department> {
    try {
      const response = await axiosClient.post<any, Department>(
        API_ENDPOINTS.DEPARTMENTS,
        data,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getDepartmentById(id: number): Promise<Department> {
    try {
      const response = await axiosClient.get<any, Department>(
        `${API_ENDPOINTS.DEPARTMENTS}/${id}`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async updateDepartment(
    id: number,
    data: Omit<Department, "id">,
  ): Promise<Department> {
    try {
      const response = await axiosClient.put<any, Department>(
        `${API_ENDPOINTS.DEPARTMENTS}/${id}`,
        {
          id,
          ...data,
        },
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async deleteDepartment(id: number): Promise<{ message: string }> {
    try {
      const response = await axiosClient.delete<any, { message: string }>(
        `${API_ENDPOINTS.DEPARTMENTS}/${id}`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};
