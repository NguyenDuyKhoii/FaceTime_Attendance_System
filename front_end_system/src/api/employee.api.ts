/**
 * FILE: src/api/employee.api.ts
 * MỤC ĐÍCH: API layer - Gọi các endpoint liên quan đến Employee
 * - getEmployees(): Lấy danh sách nhân viên (có filter)
 * - createEmployee(): Tạo nhân viên mới (Admin/HR only)
 */

import {
  Employee,
  EmployeeQueryParams,
  EnrollEmployeeFaceResponse,
} from "../types/api.types";
import { API_ENDPOINTS } from "../utils/constants";
import axiosClient from "./axiosClient";

export const employeeApi = {
  async getEmployees(params?: EmployeeQueryParams): Promise<Employee[]> {
    try {
      const response = await axiosClient.get<any, Employee[]>(
        API_ENDPOINTS.EMPLOYEES,
        { params },
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async createEmployee(data: Omit<Employee, "id">): Promise<Employee> {
    try {
      const response = await axiosClient.post<any, Employee>(
        API_ENDPOINTS.EMPLOYEES,
        data,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
  async enrollFace(id: string, file: any): Promise<EnrollEmployeeFaceResponse> {
    try {
      const formData = new FormData();
      formData.append("File", file);

      const response = await axiosClient.post<any, EnrollEmployeeFaceResponse>(
        `${API_ENDPOINTS.EMPLOYEES}/${id}/enroll-face`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getEnrolledImages(id: string): Promise<any> {
    try {
      const response = await axiosClient.get(
        `${API_ENDPOINTS.EMPLOYEES}/${id}/images`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
};
