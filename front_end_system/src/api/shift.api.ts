import { Shift, ShiftAssignment } from "../types/api.types";
import { API_ENDPOINTS } from "../utils/constants";
import axiosClient from "./axiosClient";

const getStatusCode = (error: any): number | undefined => {
  const directStatus = error?.response?.status;
  if (typeof directStatus === "number") return directStatus;

  const message = typeof error?.message === "string" ? error.message : "";
  const matched = message.match(/status code\s*(\d{3})/i);
  return matched ? Number(matched[1]) : undefined;
};

export interface AssignShiftPayload {
  employeeId: string;
  shiftId: string;
  fromDate: string;
  toDate: string;
  productionLineId?: number;
}

export interface UpdateShiftAssignmentPayload {
  employeeId: string;
  shiftId: string;
  fromDate: string;
  toDate: string;
  productionLineId?: number;
}

export const shiftApi = {
  async getShifts(): Promise<Shift[]> {
    try {
      const response = await axiosClient.get<any, Shift[]>(
        API_ENDPOINTS.SHIFTS,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async createShift(
    data: Omit<Shift, "id">,
  ): Promise<{ id: string; message: string }> {
    try {
      const response = await axiosClient.post<
        any,
        { id: string; message: string }
      >(API_ENDPOINTS.SHIFTS, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async assignShift(
    data: AssignShiftPayload,
  ): Promise<{ assignmentId: string; message: string }> {
    try {
      const response = await axiosClient.post<
        any,
        { assignmentId: string; message: string }
      >(API_ENDPOINTS.SHIFT_ASSIGN, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async updateAssignment(
    id: string,
    data: UpdateShiftAssignmentPayload,
  ): Promise<{ message: string }> {
    try {
      const response = await axiosClient.put<any, { message: string }>(
        `${API_ENDPOINTS.SHIFT_ASSIGNMENTS}/${id}`,
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

  async deleteAssignment(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosClient.delete<any, { message: string }>(
        `${API_ENDPOINTS.SHIFT_ASSIGNMENTS}/${id}`,
      );
      return response;
    } catch (error) {
      const status = getStatusCode(error);
      if (status === 404 || status === 405) {
        throw new Error(
          "API BE chua ho tro xoa Shift Assignment (DELETE /api/Shifts/assignments/{id}).",
        );
      }
      throw error;
    }
  },

  async getAssignmentsByEmployee(
    employeeId: string,
  ): Promise<ShiftAssignment[]> {
    try {
      const response = await axiosClient.get<any, ShiftAssignment[]>(
        `${API_ENDPOINTS.SHIFT_ASSIGNMENTS}/employee/${employeeId}`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getAllAssignments(): Promise<ShiftAssignment[]> {
    try {
      const response = await axiosClient.get<any, ShiftAssignment[]>(
        API_ENDPOINTS.SHIFT_ASSIGNMENTS,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};
