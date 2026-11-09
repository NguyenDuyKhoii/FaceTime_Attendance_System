/**
 * FILE: src/service/attendance.service.ts
 * MỤC ĐÍCH: Service layer cho Attendance
 * - Xử lý business logic, caching, formatting dữ liệu
 */

import { attendanceApi } from "../api/attendance.api";
import {
  AttendanceDetailDto,
  AttendanceHistoryListDto,
  AttendanceQueryParams,
  UpdateAttendancePayload,
} from "../types/api.types";

export const attendanceService = {
  async getAttendanceHistory(
    params?: AttendanceQueryParams,
  ): Promise<AttendanceHistoryListDto> {
    try {
      return await attendanceApi.getAttendanceHistory(params);
    } catch (error) {
      throw error;
    }
  },

  async getAttendanceDetail(id: string): Promise<AttendanceDetailDto> {
    try {
      return await attendanceApi.getAttendanceDetail(id);
    } catch (error) {
      throw error;
    }
  },

  async updateAttendance(
    id: string,
    payload: UpdateAttendancePayload,
  ): Promise<{ message: string }> {
    try {
      return await attendanceApi.updateAttendance(id, payload);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Format thời gian ISO 8601 thành dạng dễ đọc
   * "2026-03-15T08:05:00Z" -> "08:05"
   */
  formatTime(isoDateTime: string): string {
    try {
      const date = new Date(isoDateTime);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return isoDateTime;
    }
  },

  /**
   * Format ngày ISO 8601 thành dạng dễ đọc
   * "2026-03-15T00:00:00Z" -> "15/03/2026"
   */
  formatDate(isoDate: string): string {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoDate;
    }
  },

  /**
   * Xác định màu status dựa vào trạng thái
   */
  getStatusColor(status: string): string {
    switch (status) {
      case "OnTime":
      case "Present":
        return "#10B981"; // green
      case "Late":
        return "#F59E0B"; // amber
      case "EarlyLeave":
        return "#EC4899"; // pink
      case "OnLeave":
        return "#3B82F6"; // blue
      case "SickLeave":
        return "#A855F7"; // violet
      case "Absent":
        return "#EF4444"; // red
      case "ExceptionPending":
        return "#8B5CF6"; // purple
      default:
        return "#6B7280"; // gray
    }
  },

  /**
   * Dịch trạng thái sang tiếng Việt
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      OnTime: "On Time",
      Present: "Present",
      Late: "Late",
      EarlyLeave: "Early Leave",
      OnLeave: "On Leave",
      SickLeave: "Sick Leave",
      Absent: "Absent",
      ExceptionPending: "Pending Review",
    };
    return labels[status] || status;
  },
};
