import axiosClient from "./axiosClient";
import {
  DepartmentAttendanceReportDto,
  MonthlyAttendanceReportItemDto,
  ProductionLineAttendanceReportDto,
} from "../types/api.types";

export interface MonthlyReportQueryParams {
  month: number;
  year: number;
  departmentId?: number;
}

export const reportsApi = {
  async getMonthlyAttendanceReport(
    params: MonthlyReportQueryParams,
  ): Promise<MonthlyAttendanceReportItemDto[]> {
    const response = await axiosClient.get<
      any,
      MonthlyAttendanceReportItemDto[]
    >("/Reports/monthly-attendance", { params });
    return response;
  },

  async getProductionLineReport(
    departmentId?: number,
  ): Promise<ProductionLineAttendanceReportDto[]> {
    const response = await axiosClient.get<
      any,
      ProductionLineAttendanceReportDto[]
    >("/Reports/production-lines", {
      params: departmentId ? { departmentId } : undefined,
    });
    return response;
  },

  async getDepartmentReport(): Promise<DepartmentAttendanceReportDto[]> {
    const response = await axiosClient.get<
      any,
      DepartmentAttendanceReportDto[]
    >("/Reports/departments");
    return response;
  },
};
