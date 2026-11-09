import { ProductionLine } from "../types/api.types";
import axiosClient from "./axiosClient";

const getStatusCode = (error: any): number | undefined => {
  const directStatus = error?.response?.status;
  if (typeof directStatus === "number") return directStatus;

  const message = typeof error?.message === "string" ? error.message : "";
  const matched = message.match(/status code\s*(\d{3})/i);
  return matched ? Number(matched[1]) : undefined;
};

export interface ProductionLinePayload {
  lineName: string;
  departmentId: number;
  capacity?: number | null;
  machineCount?: number | null;
  status: "Active" | "Inactive" | "Maintenance" | string;
}

export const productionLineApi = {
  async getProductionLines(): Promise<ProductionLine[]> {
    try {
      const response = await axiosClient.get<any, ProductionLine[]>(
        "/ProductionLines",
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getById(id: number): Promise<ProductionLine> {
    try {
      const response = await axiosClient.get<any, ProductionLine>(
        `/ProductionLines/${id}`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async createProductionLine(
    data: ProductionLinePayload,
  ): Promise<{ id: number; message: string }> {
    try {
      const response = await axiosClient.post<
        any,
        { id: number; message: string }
      >("/ProductionLines", data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async updateProductionLine(
    id: number,
    data: ProductionLinePayload,
  ): Promise<{ message: string }> {
    try {
      const response = await axiosClient.put<any, { message: string }>(
        `/ProductionLines/${id}`,
        {
          id,
          ...data,
        },
      );
      return response;
    } catch (error) {
      const status = getStatusCode(error);
      if (status === 404 || status === 405) {
        throw new Error(
          "API BE chua ho tro cap nhat Production Line (PUT /api/ProductionLines/{id}).",
        );
      }
      throw error;
    }
  },

  async deleteProductionLine(id: number): Promise<{ message: string }> {
    try {
      const response = await axiosClient.delete<any, { message: string }>(
        `/ProductionLines/${id}`,
      );
      return response;
    } catch (error) {
      const status = getStatusCode(error);
      if (status === 404 || status === 405) {
        throw new Error(
          "API BE chua ho tro xoa Production Line (DELETE /api/ProductionLines/{id}).",
        );
      }
      throw error;
    }
  },
};
