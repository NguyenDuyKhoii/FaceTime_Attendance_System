import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

  const buttonScale = useSharedValue(1);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const handleInputChange = (field: keyof Register, value: string | number) => {
    setData({ ...data, [field]: value });
    if (touched && field !== "roleId" && errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field as keyof typeof errors]: "" });
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
    } else if (formData.username.trim().length > 50) {
      newErrors.username = "Username must be at most 50 characters";
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
    } else if (formData.password.trim().length > 100) {
      newErrors.password = "Password must be at most 100 characters";
      isValid = false;
    }
    if (formData.confirmPassword.trim() === "") {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    if (formData.roleId !== SELF_REGISTER_ROLE_ID) {
      newErrors.username = "Role is invalid";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onRegister = async () => {
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    setTouched(true);
    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
      confirmPassword: data.confirmPassword.trim(),
      roleId: SELF_REGISTER_ROLE_ID,
    };

    if (validateForm(trimmedData)) {
      setLoading(true);
      try {
        const response = await authService.register(trimmedData);

        if (response.success) {
          setAlert({
            visible: true,
            title: "Success",
            message: response.message || "Registration successful!",
            type: "success",
            onConfirm: () => navigation.replace("Login"),
          });
        } else {
          setAlert({
            visible: true,
            title: "Registration Failed",
            message: response.message,
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            entering={FadeInUp.duration(1000).springify()}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#00F2FE", "#4FACFE"]}
                style={styles.logoGradient}
              >
                <Ionicons name="person-add" size={40} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us and manage your attendance
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(1000).springify()}
            style={styles.form}
          >
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#4FACFE"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Username"
                value={data.username}
                onChangeText={(text) => handleInputChange("username", text)}
                autoCapitalize="none"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>
            {errors.username ? (
              <Text style={styles.errorText}>{errors.username}</Text>
            ) : null}

            <View style={[styles.inputContainer, { marginTop: 15 }]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#4FACFE"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Password"
                value={data.password}
                onChangeText={(text) => handleInputChange("password", text)}
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <View style={[styles.inputContainer, { marginTop: 15 }]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#4FACFE"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Confirm Password"
                value={data.confirmPassword}
                onChangeText={(text) =>
                  handleInputChange("confirmPassword", text)
                }
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}

            <View style={{ marginTop: 30 }}>
              <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={onRegister}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#00F2FE", "#4FACFE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>REGISTER</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace("Login")}>
                <Text style={styles.link}>Sign In</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 35,
    paddingVertical: 50,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 45,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  logoGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#999",
    marginTop: 6,
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 64,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputIcon: {
    marginRight: 15,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 10,
    fontWeight: "600",
  },
  button: {
    height: 64,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 35,
    alignItems: "center",
  },
  footerText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  link: {
    color: "#4FACFE",
    fontSize: 14,
    fontWeight: "bold",
  },
});
