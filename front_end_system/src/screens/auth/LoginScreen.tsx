import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../service/auth.service";
import { AuthStackParamList } from "../../types/AuthParam";
import { Login } from "../../types/api.types";

const { width } = Dimensions.get("window");

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
    buttonScale.value = withSpring(0.95, {}, () => {
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
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
              <Ionicons name="scan" size={40} color="white" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your work</Text>
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onLogin}
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
                  <Text style={styles.buttonText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Do not have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace("Register")}>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkInLinkContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate("AttendanceCheckIn")}
            >
              <Text style={styles.checkInLink}>
                <Ionicons name="scan-outline" size={16} color="#4FACFE" />{" "}
                Employee Check-in
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    paddingHorizontal: 35,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 18,
    marginBottom: 35,
  },
  forgotPasswordText: {
    color: "#4FACFE",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
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
  checkInLinkContainer: {
    marginTop: 15,
    backgroundColor: "rgba(79, 172, 254, 0.08)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignSelf: "center",
  },
  checkInLink: {
    color: "#4FACFE",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
