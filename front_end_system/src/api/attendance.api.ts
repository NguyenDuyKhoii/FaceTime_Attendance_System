/**
 * FILE: src/api/attendance.api.ts
 * MỤC ĐÍCH: API endpoints cho Attendance History & Detail
 * - Get attendance history list (với pagination & filter)
 * - Get attendance detail
 */

import axiosClient from "./axiosClient";
import {
  AttendanceDetailDto,
  AttendanceHistoryListDto,
  AttendanceQueryParams,
  UpdateAttendancePayload,
} from "../types/api.types";

export const attendanceApi = {
  /**
   * GET /api/attendance
   * Lấy danh sách lịch sử chấm công
   * Quyền: Admin, HR, Manager
   * Query params: employeeId, departmentId, productionLineId, fromDate, toDate, pageNumber, pageSize
   */
  async getAttendanceHistory(
    params?: AttendanceQueryParams,
  ): Promise<AttendanceHistoryListDto> {
    const response = await axiosClient.get<any, AttendanceHistoryListDto>(
      "/attendance",
      { params },
    );
    return response;
  },

  /**
   * GET /api/attendance/{id}
   * Lấy chi tiết bản ghi chấm công
   * Quyền: Admin, HR, Manager
   */
  async getAttendanceDetail(id: string): Promise<AttendanceDetailDto> {
    const response = await axiosClient.get<any, AttendanceDetailDto>(
      `/attendance/${id}`,
    );
    return response;
  },

  /**
   * PUT /api/attendance/{id}
   * Cập nhật bản ghi chấm công (HR/Admin)
   */
  async updateAttendance(
    id: string,
    payload: UpdateAttendancePayload,
  ): Promise<{ message: string }> {
    const response = await axiosClient.put<any, { message: string }>(
      `/attendance/${id}`,
      payload,
    );
    return response;
  },
};
