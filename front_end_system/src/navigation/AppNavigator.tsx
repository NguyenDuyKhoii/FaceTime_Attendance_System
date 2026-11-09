import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  AddDepartmentScreen,
  AddEmployeeScreen,
  AddIoTDeviceScreen,
  AddProductionLineScreen,
  AddShiftAssignmentScreen,
  AddShiftScreen,
  AttendanceCheckInScreen,
  AttendanceDetailScreen,
  AttendanceHistoryScreen,
  DashboardScreen,
  DepartmentListScreen,
  EmployeeListScreen,
  EnrollFaceScreen,
  HomeScreen,
  IoTDeviceListScreen,
  ProductionLineListScreen,
  ReportsScreen,
  ShiftAssignmentListScreen,
  ShiftListScreen,
} from "../screens";
import { AppStackParamList } from "../types/navigation.types";

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
      />
      <Stack.Screen
        name="AttendanceDetail"
        component={AttendanceDetailScreen}
      />
      <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EnrollFace" component={EnrollFaceScreen} />
      <Stack.Screen name="IoTDeviceList" component={IoTDeviceListScreen} />
      <Stack.Screen name="AddIoTDevice" component={AddIoTDeviceScreen} />
      <Stack.Screen name="DepartmentList" component={DepartmentListScreen} />
      <Stack.Screen name="AddDepartment" component={AddDepartmentScreen} />
      <Stack.Screen
        name="ProductionLineList"
        component={ProductionLineListScreen}
      />
      <Stack.Screen
        name="AddProductionLine"
        component={AddProductionLineScreen}
      />
      <Stack.Screen name="ShiftList" component={ShiftListScreen} />
      <Stack.Screen name="AddShift" component={AddShiftScreen} />
      <Stack.Screen
        name="ShiftAssignmentList"
        component={ShiftAssignmentListScreen}
      />
      <Stack.Screen
        name="AddShiftAssignment"
        component={AddShiftAssignmentScreen}
      />
      <Stack.Screen
        name="AttendanceCheckIn"
        component={AttendanceCheckInScreen}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
