import {
  IoTDevice,
  IoTDeviceMonitoringDto,
  IoTDeviceStatusDto,
} from "../types/api.types";
import { API_ENDPOINTS } from "../utils/constants";
import axiosClient from "./axiosClient";

export const iotApi = {
  async getDevices(): Promise<IoTDeviceMonitoringDto[]> {
    try {
      const response = await axiosClient.get<any, IoTDeviceMonitoringDto[]>(
        API_ENDPOINTS.IOT_DEVICES,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getDeviceStatus(deviceId: number): Promise<IoTDeviceStatusDto> {
    try {
      const response = await axiosClient.get<any, IoTDeviceStatusDto>(
        `${API_ENDPOINTS.IOT_DEVICES}/${deviceId}/status`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async registerDevice(data: {
    deviceName: string;
    deviceType: string;
    lineId?: number;
    locationDesc?: string;
    ipAddress?: string;
    macAddress?: string;
  }): Promise<{ deviceId: number; message: string }> {
    try {
      const response = await axiosClient.post<
        any,
        { deviceId: number; message: string }
      >(API_ENDPOINTS.IOT_REGISTER, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
