/**
 * FILE: src/service/signalr.service.ts
 * MỤC ĐÍCH: Service quản lý SignalR connections
 * - Kết nối tới /attendanceHub
 * - Lắng nghe sự kiện AttendanceUpdated
 * - Thông báo cho listeners khi có dữ liệu mới
 */

import * as signalR from "@microsoft/signalr";
import { Platform } from "react-native";
import { API_BASE_URL } from "../utils/constants";

type AttendanceUpdateCallback = () => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Set<AttendanceUpdateCallback> = new Set();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Khởi tạo kết nối SignalR
   */
  async connect(token: string): Promise<void> {
    if (this.isConnected || this.connection) {
      return;
    }

    try {
      const hubUrl = this.buildHubUrl();

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 0, 1000, 3000, 5000, 10000, 30000])
        .withHubProtocol(new signalR.JsonHubProtocol())
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Register event handlers
      this.connection.on("AttendanceUpdated", () => {
        console.log("[SignalR] AttendanceUpdated event received");
        this.notifyListeners();
      });

      this.connection.onreconnecting((error: any) => {
        console.log("[SignalR] Attempting to reconnect...", error);
      });

      this.connection.onreconnected((connectionId?: string) => {
        console.log("[SignalR] Reconnected with id:", connectionId);
        this.reconnectAttempts = 0;
      });

      this.connection.onclose((error: any) => {
        console.log("[SignalR] Connection closed", error);
        this.isConnected = false;
      });

      await this.connection.start();
      this.isConnected = true;
      console.log("[SignalR] Connected successfully");
    } catch (error) {
      console.warn(
        "[SignalR] Connection failed, dashboard will continue without realtime updates",
      );
      this.isConnected = false;
      throw error;
    }
  }

  private buildHubUrl(): string {
    let baseUrl = API_BASE_URL.replace(/\/api\/?$/i, "");

    // Android emulator cannot use localhost of host machine.
    if (Platform.OS === "android") {
      baseUrl = baseUrl
        .replace("localhost", "10.0.2.2")
        .replace("127.0.0.1", "10.0.2.2");
    }

    return `${baseUrl}/attendanceHub`;
  }

  /**
   * Ngắt kết nối SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log("[SignalR] Disconnected");
      } catch (error) {
        console.error("[SignalR] Disconnect error:", error);
      }
    }
  }

  /**
   * Đăng ký listener cho events
   */
  subscribe(callback: AttendanceUpdateCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Thông báo cho tất cả listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("[SignalR] Error in listener callback:", error);
      }
    });
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  getConnectionStatus(): boolean {
    return (
      this.isConnected &&
      this.connection?.state === signalR.HubConnectionState.Connected
    );
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
