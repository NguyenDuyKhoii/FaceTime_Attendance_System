export type AppStackParamList = {
  Home: undefined;
  Dashboard: undefined;
  Reports: undefined;
  EmployeeList: undefined;
  AddEmployee: undefined;
  EnrollFace: { employeeId: string; employeeName: string };
  IoTDeviceList: undefined;
  AddIoTDevice: undefined;
  DepartmentList: undefined;
  AddDepartment:
    | {
        department?: {
          id: number;
          departmentCode: string;
          name: string;
          description?: string;
        };
      }
    | undefined;
  ProductionLineList: undefined;
  AddProductionLine:
    | {
        productionLine?: {
          id: number;
          lineName: string;
          departmentId: number;
          status: string;
          capacity?: number;
          machineCount?: number;
        };
      }
    | undefined;
  ShiftList: undefined;
  AddShift: undefined;
  ShiftAssignmentList: undefined;
  AddShiftAssignment:
    | {
        assignment?: {
          id: string;
          employeeId: string;
          employeeName: string;
          shiftId: string;
          shiftName: string;
          fromDate: string;
          toDate: string;
          productionLineId?: number;
          productionLineName?: string;
        };
      }
    | undefined;
  AttendanceCheckIn: undefined;
  AttendanceHistory: {
    employeeId?: string;
    departmentId?: number;
    productionLineId?: number;
    fromDate?: string;
    toDate?: string;
  };
  AttendanceDetail: { recordId: string };
};
