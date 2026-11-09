import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
import { reportsApi, MonthlyReportQueryParams } from "../api/reports.api";
import {
  DepartmentAttendanceReportDto,
  MonthlyAttendanceReportItemDto,
  ProductionLineAttendanceReportDto,
} from "../types/api.types";
import { API_BASE_URL } from "../utils/constants";
import { storageService } from "./storage.service";

const toQueryString = (params: Record<string, string | number | undefined>) => {
  return Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
};

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const REPORTS_ANDROID_DIRECTORY_URI_KEY = "reports.android.directoryUri.v1";

const getHeaderValue = (
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined => {
  if (!headers) return undefined;
  const lowerName = name.toLowerCase();
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === lowerName,
  );
  return entry?.[1];
};

const toTimestampedFileName = (fileName: string): string => {
  const timestamp = Date.now();
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${fileName}-${timestamp}`;
  }

  const baseName = fileName.slice(0, dotIndex);
  const extension = fileName.slice(dotIndex);
  return `${baseName}-${timestamp}${extension}`;
};

const requestAndroidDirectoryPermission = async (): Promise<string> => {
  const permission =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permission.granted || !permission.directoryUri) {
    throw new Error(
      "Please allow folder access so the exported file can be saved and shown in Files.",
    );
  }

  await AsyncStorage.setItem(
    REPORTS_ANDROID_DIRECTORY_URI_KEY,
    permission.directoryUri,
  );

  return permission.directoryUri;
};

const writeFileToAndroidSharedFolder = async (
  directoryUri: string,
  localFileUri: string,
  fileName: string,
): Promise<string> => {
  const targetFileName = toTimestampedFileName(fileName);
  const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
    directoryUri,
    targetFileName,
    EXCEL_MIME_TYPE,
  );

  const contentBase64 = await FileSystem.readAsStringAsync(localFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await FileSystem.writeAsStringAsync(targetUri, contentBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return targetUri;
};

const saveToAndroidSharedFolder = async (
  localFileUri: string,
  fileName: string,
): Promise<string> => {
  let directoryUri = await AsyncStorage.getItem(
    REPORTS_ANDROID_DIRECTORY_URI_KEY,
  );

  if (!directoryUri) {
    directoryUri = await requestAndroidDirectoryPermission();
  }

  try {
    return await writeFileToAndroidSharedFolder(
      directoryUri,
      localFileUri,
      fileName,
    );
  } catch {
    await AsyncStorage.removeItem(REPORTS_ANDROID_DIRECTORY_URI_KEY);
    const newDirectoryUri = await requestAndroidDirectoryPermission();
    return await writeFileToAndroidSharedFolder(
      newDirectoryUri,
      localFileUri,
      fileName,
    );
  }
};

interface ExportMonthlyAttendanceResult {
  uri: string;
  savedToSharedFolder: boolean;
}

export const reportsService = {
  async getMonthlyAttendanceReport(
    params: MonthlyReportQueryParams,
  ): Promise<MonthlyAttendanceReportItemDto[]> {
    return reportsApi.getMonthlyAttendanceReport(params);
  },

  async getProductionLineReport(
    departmentId?: number,
  ): Promise<ProductionLineAttendanceReportDto[]> {
    return reportsApi.getProductionLineReport(departmentId);
  },

  async getDepartmentReport(): Promise<DepartmentAttendanceReportDto[]> {
    return reportsApi.getDepartmentReport();
  },

  async exportMonthlyAttendance(
    params: MonthlyReportQueryParams,
  ): Promise<ExportMonthlyAttendanceResult> {
    const token = await storageService.getToken();
    if (!token) {
      throw new Error("You are not logged in.");
    }

    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const query = toQueryString({
      month: params.month,
      year: params.year,
      departmentId: params.departmentId,
    });

    const requestUrl = `${baseUrl}/Reports/export-attendance${query ? `?${query}` : ""}`;
    const month = String(params.month).padStart(2, "0");
    const fileName = `attendance-report-${params.year}-${month}.xlsx`;
    const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

    if (!targetDir) {
      throw new Error(
        "Unable to resolve a writable directory for the exported file.",
      );
    }

    const exportDir = `${targetDir}exports/`;
    const exportDirInfo = await FileSystem.getInfoAsync(exportDir);
    if (!exportDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    }

    const fileUri = `${exportDir}${fileName}`;

    const result = await FileSystem.downloadAsync(requestUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status !== 200) {
      throw new Error(`Download failed (HTTP ${result.status}).`);
    }

    const contentType = getHeaderValue(result.headers, "content-type")
      ?.toLowerCase()
      .trim();

    if (contentType) {
      const isExcelContent =
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ) ||
        contentType.includes("application/vnd.ms-excel") ||
        contentType.includes("application/octet-stream");

      if (!isExcelContent) {
        throw new Error(
          `Downloaded file is invalid (Content-Type: ${contentType}).`,
        );
      }
    }

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    if (!fileInfo.exists || !fileInfo.size || fileInfo.size <= 0) {
      throw new Error("Downloaded file is empty or corrupted.");
    }

    if (Platform.OS === "android") {
      const sharedUri = await saveToAndroidSharedFolder(result.uri, fileName);
      return {
        uri: sharedUri,
        savedToSharedFolder: true,
      };
    }

    return {
      uri: result.uri,
      savedToSharedFolder: false,
    };
  },

  async openExportedFile(uri: string): Promise<boolean> {
    try {
      if (Platform.OS === "web") {
        return false;
      }

      if (Platform.OS === "android") {
        const contentUri = uri.startsWith("content://")
          ? uri
          : await FileSystem.getContentUriAsync(uri);
        const flags = 1 | 268435456;
        const openWithIntent = async (
          type: string,
          packageName?: string,
        ): Promise<boolean> => {
          try {
            await IntentLauncher.startActivityAsync(
              "android.intent.action.VIEW",
              {
                data: contentUri,
                type,
                packageName,
                flags,
              },
            );
            return true;
          } catch {
            return false;
          }
        };

        const preferredPackages = [
          "com.microsoft.office.excel",
          "cn.wps.moffice_eng",
          "cn.wps.moffice_i18n",
          "com.google.android.apps.docs",
        ];

        for (const packageName of preferredPackages) {
          if (await openWithIntent(EXCEL_MIME_TYPE, packageName)) {
            return true;
          }
        }

        if (await openWithIntent(EXCEL_MIME_TYPE)) {
          return true;
        }

        if (await openWithIntent("application/vnd.ms-excel")) {
          return true;
        }

        return await openWithIntent("*/*");
      }

      const canOpen = await Linking.canOpenURL(uri);
      if (!canOpen) {
        return false;
      }

      await Linking.openURL(uri);
      return true;
    } catch (error) {
      console.warn("Unable to open exported file:", error);
      return false;
    }
  },
};
