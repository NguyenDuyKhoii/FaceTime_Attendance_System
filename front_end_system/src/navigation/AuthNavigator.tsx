import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AttendanceCheckInScreen from "../screens/attendance/AttendanceCheckInScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import { AuthStackParamList } from "../types/AuthParam";
const Stack = createNativeStackNavigator<AuthStackParamList>();
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="AttendanceCheckIn"
        component={AttendanceCheckInScreen}
      />
    </Stack.Navigator>
  );
};
export default AuthNavigator;
