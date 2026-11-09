/**
 * FILE: src/service/dashboard.service.ts
 * MỤC ĐÍCH: Service layer cho Dashboard
 * - Xử lý business logic, caching, error handling
 */

import { dashboardApi } from "../api/dashboard.api";
import {
  DepartmentSummaryDto,
  ProductionLineSummaryDto,
  TodayAttendanceDto,
} from "../types/api.types";

export const dashboardService = {
  async getTodayAttendance(): Promise<TodayAttendanceDto> {
    try {
      return await dashboardApi.getTodayAttendance();
    } catch (error) {
      throw error;
    }
  },

  async getDepartmentSummary(): Promise<DepartmentSummaryDto[]> {
    try {
      return await dashboardApi.getDepartmentSummary();
    } catch (error) {
      throw error;
    }
  },

  async getProductionLineSummary(): Promise<ProductionLineSummaryDto[]> {
    try {
      return await dashboardApi.getProductionLineSummary();
    } catch (error) {
      throw error;
    }
  },
};
