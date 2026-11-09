/**
 * FILE: src/service/employee.service.ts
 * MỤC ĐÍCH: Service layer - Xử lý business logic cho Employee
 * - Thêm các logic xử lý dữ liệu trước/sau khi gọi API
 * - Có thể cache, format data, handle error...
 */

import { employeeApi } from "../api/employee.api";
import {
  Employee,
  EmployeeQueryParams,
  EnrollEmployeeFaceResponse,
} from "../types/api.types";

export const employeeService = {
  async getEmployees(params?: EmployeeQueryParams): Promise<Employee[]> {
    try {
      const employees = await employeeApi.getEmployees(params);
      return employees;
    } catch (error) {
      throw error;
    }
  },

  async getActiveEmployees(): Promise<Employee[]> {
    try {
      return await this.getEmployees({ isActive: true });
    } catch (error) {
      throw error;
    }
  },

  async createEmployee(data: Omit<Employee, "id">): Promise<Employee> {
    try {
      const newEmployee = await employeeApi.createEmployee(data);
      return newEmployee;
    } catch (error) {
      throw error;
    }
  },
  async enrollFace(id: string, file: any): Promise<EnrollEmployeeFaceResponse> {
    try {
      return await employeeApi.enrollFace(id, file);
    } catch (error) {
      throw error;
    }
  },

  async getEnrolledImages(id: string): Promise<any> {
    try {
      return await employeeApi.getEnrolledImages(id);
    } catch (error) {
      console.log("Error fetching enrolled images:", error);
      return null;
    }
  }
};
