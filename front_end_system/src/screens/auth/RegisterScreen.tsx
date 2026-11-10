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
import { authService } from "../../service/auth.service";
import { AuthStackParamList } from "../../types/AuthParam";
import { Register } from "../../types/api.types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const SELF_REGISTER_ROLE_ID = 4;

export default function RegisterScreen({ navigation }: Props) {
  const [data, setData] = useState<Register>({
    username: "",
    password: "",
    confirmPassword: "",
    roleId: SELF_REGISTER_ROLE_ID,
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const buttonScale = useSharedValue(1);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const handleInputChange = (field: keyof Register, value: string) => {
    setData({ ...data, [field]: value });
    if (touched && errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = (formData: Register) => {
    let newErrors = {
      username: "",
      password: "",
      confirmPassword: "",
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

    if (formData.confirmPassword.trim() === "") {
      newErrors.confirmPassword = "Confirm Password is required";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onRegister = async () => {
    buttonScale.value = withSpring(0.96, {}, () => {
      buttonScale.value = withSpring(1);
    });

    setTouched(true);
    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
      confirmPassword: data.confirmPassword.trim(),
      roleId: data.roleId,
    };

    if (validateForm(trimmedData)) {
      setLoading(true);
      try {
        const response = await authService.register(trimmedData);

        if (response.success) {
          setAlert({
            visible: true,
            title: "Success",
            message: "Account created successfully! Please sign in.",
            type: "success",
            onConfirm: () => {
              setAlert({ ...alert, visible: false });
              navigation.replace("Login");
            },
          });
        } else {
          setAlert({
            visible: true,
            title: "Registration Failed",
            message: response.message || "Failed to create account",
            type: "error",
            onConfirm: undefined,
          });
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "An error occurred during registration";
        setAlert({
          visible: true,
          title: "Error",
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={styles.header}
          >
            <View style={styles.logoBadgeContainer}>
              <View style={styles.logoInnerBadge}>
                <Ionicons name="person-add" size={32} color="#2563EB" />
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Register staff credentials to access portal
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600).springify()}
            style={styles.card}
          >
            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View
                style={[
                  styles.inputFieldWrap,
                  focusedField === "username" && styles.inputFieldFocused,
                  Boolean(errors.username) && styles.inputFieldError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={focusedField === "username" ? "#2563EB" : "#64748B"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Choose a username"
                  value={data.username}
                  onChangeText={(text) => handleInputChange("username", text)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
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

            {/* Password */}
            <View style={[styles.inputGroup, { marginTop: 14 }]}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputFieldWrap,
                  focusedField === "password" && styles.inputFieldFocused,
                  Boolean(errors.password) && styles.inputFieldError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={focusedField === "password" ? "#2563EB" : "#64748B"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Create a strong password"
                  value={data.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
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

            {/* Confirm Password */}
            <View style={[styles.inputGroup, { marginTop: 14 }]}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  styles.inputFieldWrap,
                  focusedField === "confirmPassword" && styles.inputFieldFocused,
                  Boolean(errors.confirmPassword) && styles.inputFieldError,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color={focusedField === "confirmPassword" ? "#2563EB" : "#64748B"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Re-enter your password"
                  value={data.confirmPassword}
                  onChangeText={(text) =>
                    handleInputChange("confirmPassword", text)
                  }
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              ) : null}
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: 24 }}>
              <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={onRegister}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="person-add-outline"
                        size={20}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.primaryBtnText}>Create Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Back to Login */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace("Login")}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    paddingVertical: 30,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadgeContainer: {
    width: 68,
    height: 68,
    borderRadius: 20,
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
    marginBottom: 14,
  },
  logoInnerBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
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
});
