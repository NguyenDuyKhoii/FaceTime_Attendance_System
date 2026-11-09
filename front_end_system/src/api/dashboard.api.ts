/**
 * FILE: src/api/dashboard.api.ts
 * MỤC ĐÍCH: API endpoints cho Dashboard
 * - Get today attendance summary
 * - Get department summary
 * - Get production line summary
 */

import axiosClient from "./axiosClient";
import {
  DepartmentSummaryDto,
  ProductionLineSummaryDto,
  TodayAttendanceDto,
} from "../types/api.types";

export const dashboardApi = {
  /**
   * GET /api/Dashboard/today
   * Lấy tổng quan chấm công hôm nay
   * Quyền: Admin, HR, Manager
   * Cache: 30s
   */
  async getTodayAttendance(): Promise<TodayAttendanceDto> {
    const response = await axiosClient.get<any, TodayAttendanceDto>(
      "/Dashboard/today",
    );
    return response;
  },

  /**
   * GET /api/Dashboard/department-summary
   * Lấy thống kê theo phòng ban
   * Quyền: Admin, HR
   */
  async getDepartmentSummary(): Promise<DepartmentSummaryDto[]> {
    const response = await axiosClient.get<any, DepartmentSummaryDto[]>(
      "/Dashboard/department-summary",
    );
    return response;
  },

  /**
   * GET /api/Dashboard/production-line-summary
   * Lấy thống kê theo dây chuyền sản xuất
   * Quyền: Admin, HR
   */
  async getProductionLineSummary(): Promise<ProductionLineSummaryDto[]> {
    const response = await axiosClient.get<any, ProductionLineSummaryDto[]>(
      "/Dashboard/production-line-summary",
    );
    return response;
  },
};
