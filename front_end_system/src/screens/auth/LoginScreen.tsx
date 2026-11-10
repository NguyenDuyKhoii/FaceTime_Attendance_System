import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../service/auth.service";
import { AuthStackParamList } from "../../types/AuthParam";
import { Login } from "../../types/api.types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [data, setData] = useState<Login>({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const buttonScale = useSharedValue(1);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const handleInputChange = (field: keyof Login, value: string) => {
    setData({ ...data, [field]: value });
    if (touched && errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = (formData: Login) => {
    let newErrors = {
      username: "",
      password: "",
    };
    let isValid = true;

    if (formData.username.trim() === "") {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = "Username only allows letters, numbers and _";
      isValid = false;
    }

    if (formData.password.trim() === "") {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onLogin = async () => {
    buttonScale.value = withSpring(0.96, {}, () => {
      buttonScale.value = withSpring(1);
    });

    setTouched(true);
    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
    };

    if (validateForm(trimmedData)) {
      setLoading(true);
      try {
        const response = await authService.login(trimmedData);

        login(response.token, {
          id: response.user.id,
          username: response.user.username,
          fullName: response.user.fullName ?? response.user.username,
          roles: response.user.roles || [],
        });

        setAlert({
          visible: true,
          title: "Success",
          message: `Welcome back, ${response.user.username}!`,
          type: "success",
          onConfirm: undefined,
        });
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Invalid username or password";
        setAlert({
          visible: true,
          title: "Login Failed",
          message: errorMessage,
          type: "error",
          onConfirm: undefined,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Top Brand Header ─── */}
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={styles.header}
          >
            <View style={styles.logoBadgeContainer}>
              <View style={styles.logoInnerBadge}>
                <Ionicons name="scan" size={34} color="#2563EB" />
              </View>
            </View>

            <View style={styles.brandPill}>
              <View style={styles.brandDot} />
              <Text style={styles.brandPillText}>HRMS FACE ATTENDANCE</Text>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage workforce & face attendance
            </Text>
          </Animated.View>

          {/* ─── Main Form Card ─── */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600).springify()}
            style={styles.card}
          >
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View
                style={[
                  styles.inputFieldWrap,
                  isUsernameFocused && styles.inputFieldFocused,
                  Boolean(errors.username) && styles.inputFieldError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={isUsernameFocused ? "#2563EB" : "#64748B"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Enter your username"
                  value={data.username}
                  onChangeText={(text) => handleInputChange("username", text)}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
              {errors.username ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.username}</Text>
                </View>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={[styles.inputGroup, { marginTop: 14 }]}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputFieldWrap,
                  isPasswordFocused && styles.inputFieldFocused,
                  Boolean(errors.password) && styles.inputFieldError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={isPasswordFocused ? "#2563EB" : "#64748B"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Enter your password"
                  value={data.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              ) : null}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary Sign In Button */}
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={onLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="log-in-outline"
                      size={20}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK CHECK-IN</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Face Check-in Terminal Button */}
            <TouchableOpacity
              style={styles.checkInKioskBtn}
              onPress={() => navigation.navigate("AttendanceCheckIn")}
              activeOpacity={0.85}
            >
              <View style={styles.kioskIconBadge}>
                <Ionicons name="camera" size={18} color="#059669" />
              </View>
              <View style={styles.kioskTextWrap}>
                <Text style={styles.kioskTitle}>Face Terminal Check-in</Text>
                <Text style={styles.kioskSub}>Instant AI camera scan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#059669" />
            </TouchableOpacity>
          </Animated.View>

          {/* ─── Bottom Utilities & Footer ─── */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600).springify()}
            style={styles.bottomSection}
          >
            {/* Sign Up Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Do not have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace("Register")}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.copyrightText}>
              HRMS Smart Face Attendance • v1.0.0
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
        onConfirm={alert.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
    justifyContent: "center",
  },

  // ─── Header ───
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadgeContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  logoInnerBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginBottom: 10,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginRight: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
    fontWeight: "500",
    textAlign: "center",
  },

  // ─── Card ───
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  inputGroup: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  inputFieldFocused: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  inputFieldError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 6,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginLeft: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginLeft: 5,
    fontWeight: "600",
  },

  // ─── Actions ───
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ─── Divider ───
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.6,
  },

  // ─── Quick Check-in Terminal Kiosk Button ───
  checkInKioskBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  kioskIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  kioskTextWrap: {
    flex: 1,
  },
  kioskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  kioskSub: {
    fontSize: 11.5,
    color: "#15803D",
    marginTop: 1,
  },

  // ─── Bottom Section ───
  bottomSection: {
    alignItems: "center",
    marginTop: 20,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  footerText: {
    color: "#64748B",
    fontSize: 13.5,
    fontWeight: "500",
  },
  linkText: {
    color: "#2563EB",
    fontSize: 13.5,
    fontWeight: "700",
  },
  copyrightText: {
    fontSize: 11.5,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
