export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
  username?: string;
  roleName?: string;
}

export interface User {
  id: string;
  username: string;
  fullName?: string; // Optional if not always returned
  roles: string[]; // List<string> in BE
  employeeId?: string | null;
}

export interface IoTDevice {
  id: number;
  deviceName: string;
  deviceType: string;
  lineId?: number;
  locationDesc?: string;
  ipAddress?: string;
  macAddress?: string;
  status: string;
  lastHeartbeat?: string;
  productionLineName?: string;
}

export interface IoTDeviceMonitoringDto {
  deviceId: number;
  location: string;
  status: string;
  lastHeartbeat?: string;
}

export interface IoTDeviceStatusDto {
  deviceId: number;
  status: string;
  lastHeartbeat?: string;
}

export interface ProductionLine {
  id: number;
  lineCode?: string;
  lineName: string;
  departmentId: number;
  departmentName?: string;
  managerId?: string | null;
  status: string;
  capacity?: number;
  machineCount?: number;
}

export type Login = {
  username: string; // API yêu cầu username, không phải email
  password: string;
};

export type Register = {
  username: string;
  password: string;
  confirmPassword: string;
  roleId: number; // 1=Admin, 2=HR, 3=Manager, 4=Employee
};

// ===== EMPLOYEE TYPES =====
// Interface cho Employee DTO từ API
export interface Employee {
  id: string; // GUID
  employeeCode: string; // Mã nhân viên (unique)
  fullName: string; // Họ tên
  dateOfBirth: string; // ISO 8601 date
  phoneNumber: string | null; // SĐT (optional)
  email: string | null; // Email (optional)
  identityNumber: string | null; // CMND/CCCD
  departmentId: number | null; // ID phòng ban
  hireDate: string; // Ngày vào làm (ISO 8601)
  isActive: boolean; // Trạng thái hoạt động
  productionLineName?: string;
  shiftName?: string;
}

// Query params cho GET /api/employees
export interface EmployeeQueryParams {
  isActive?: boolean; // Filter theo trạng thái
  departmentId?: number; // Filter theo phòng ban
}
export interface EnrollEmployeeFaceResponse {
  success: boolean;
  message: string;
  employeeCode?: string;
  employeeName?: string;
  label?: number;
}

// ===== SHIFT & ATTENDANCE TYPES =====
export interface Shift {
  id: string;
  shiftCode: string;
  name: string;
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
}

export interface ShiftAssignment {
  id: string; // GUID
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftName: string;
  fromDate: string;
  toDate: string;
  productionLineId?: number;
  productionLineName?: string;
}

export interface FaceCheckInResponse {
  success: boolean;
  message: string;
  employeeName?: string;
  checkInTime?: string;
  status?:
    | "CheckedIn"
    | "CheckedOut"
    | "WrongLocation"
    | "UnknownFace"
    | "AlreadyCheckedOut"
    | "NoShiftToday"
    | "WrongShiftTime"
    | "Error";
  confidence?: number;
}

// ===== DASHBOARD TYPES =====
export interface TodayAttendanceDto {
  date: string; // ISO 8601 date
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
}

export interface DepartmentSummaryDto {
  department: string;
  totalEmployees: number;
  present: number;
  late: number;
}

export interface ProductionLineSummaryDto {
  productionLine: string;
  totalEmployees: number;
  present: number;
  late: number;
}

// ===== ATTENDANCE TYPES =====
export interface AttendanceHistoryDto {
  id: string; // GUID
  employeeId?: string;
  employeeName: string;
  department?: string;
  productionLine?: string;
  checkInTime?: string; // ISO 8601 datetime
  checkOutTime?: string;
  totalHours?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  status:
    | "OnTime"
    | "Late"
    | "EarlyLeave"
    | "Absent"
    | "OnLeave"
    | "SickLeave"
    | "Present"
    | "ExceptionPending";
}

export interface AttendanceHistoryListDto {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  data: AttendanceHistoryDto[];
}

export interface AttendanceDetailDto {
  id: string; // GUID
  employeeId?: string;
  employeeName: string;
  department?: string;
  productionLine?: string;
  workDate: string; // ISO 8601 date
  checkInTime?: string; // ISO 8601 datetime
  checkOutTime?: string; // ISO 8601 datetime (optional)
  lateMinutes: number;
  earlyLeaveMinutes?: number;
  totalHours: number;
  status:
    | "OnTime"
    | "Late"
    | "EarlyLeave"
    | "Absent"
    | "OnLeave"
    | "SickLeave"
    | "Present"
    | "ExceptionPending";
  deviceId?: string;
  location?: string;
  note?: string;
  createdAt?: string;
  source: "FaceRecognition" | "IoTDevice" | "Manual" | "Import" | "MobileApp"; // Nguồn check-in
  confidenceScore?: number;
}

export interface UpdateAttendancePayload {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  note?: string | null;
}

export interface AttendanceQueryParams {
  employeeId?: string; // UUID
  departmentId?: number;
  productionLineId?: number;
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
  pageNumber?: number;
  pageSize?: number;
}

// ===== REPORT TYPES =====
export interface MonthlyAttendanceReportItemDto {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  productionLine: string;
  workingDays: number;
  late: number;
  earlyLeave: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeHours: number;
  totalHours: number;
}

export interface ProductionLineAttendanceReportDto {
  productionLineId?: number;
  productionLine: string;
  totalEmployees: number;
  present: number;
  late: number;
}

export interface DepartmentAttendanceReportDto {
  departmentId: number;
  department: string;
  totalEmployees: number;
  present: number;
  late: number;
}
