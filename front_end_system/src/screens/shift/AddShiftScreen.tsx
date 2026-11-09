import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { shiftApi } from "../../api/shift.api";
import CustomAlert from "../../components/CustomAlert";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AddShift">;

export function AddShiftScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shiftCode: "",
    name: "",
    startTime: "08:00:00",
    endTime: "17:00:00",
    breakDuration: "01:00:00",
    allowedLateMinutes: "15",
    allowedEarlyLeaveMinutes: "15",
  });

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

  const toSeconds = (value: string): number => {
    const [h, m, s] = value.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const validateForm = (): string | null => {
    const shiftCode = form.shiftCode.trim();
    const name = form.name.trim();
    const startTime = form.startTime.trim();
    const endTime = form.endTime.trim();
    const breakDuration = form.breakDuration.trim();
    const allowedLateMinutes = form.allowedLateMinutes.trim();
    const allowedEarlyLeaveMinutes = form.allowedEarlyLeaveMinutes.trim();

    if (!shiftCode) return "Shift Code is required";
    if (shiftCode.length > 50)
      return "Shift Code must be at most 50 characters";
    if (!/^[A-Za-z0-9_-]+$/.test(shiftCode)) {
      return "Shift Code only allows letters, numbers, _ and -";
    }

    if (!name) return "Shift Name is required";
    if (name.length > 200) return "Shift Name must be at most 200 characters";

    if (!timeRegex.test(startTime))
      return "Start Time must be in HH:mm:ss format";
    if (!timeRegex.test(endTime)) return "End Time must be in HH:mm:ss format";
    if (startTime === endTime)
      return "Start Time cannot be the same as End Time";

    if (breakDuration && !timeRegex.test(breakDuration)) {
      return "Break Duration must be in HH:mm:ss format";
    }

    if (breakDuration && toSeconds(breakDuration) >= 24 * 3600) {
      return "Break Duration must be less than 24 hours";
    }

    if (!/^\d+$/.test(allowedLateMinutes)) {
      return "Late Limit must be a non-negative whole number";
    }

    if (!/^\d+$/.test(allowedEarlyLeaveMinutes)) {
      return "Early Limit must be a non-negative whole number";
    }

    if (parseInt(allowedLateMinutes, 10) > 720) {
      return "Late Limit is too large";
    }

    if (parseInt(allowedEarlyLeaveMinutes, 10) > 720) {
      return "Early Limit is too large";
    }

    return null;
  };

  const onSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setAlert({
        visible: true,
        title: "Validation Error",
        message: validationError,
        type: "error",
        onConfirm: undefined,
      });
      return;
    }

    const data = {
      shiftCode: form.shiftCode.trim().toUpperCase(),
      name: form.name.trim(),
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      breakDuration: form.breakDuration.trim() || null,
      allowedLateMinutes: parseInt(form.allowedLateMinutes.trim(), 10),
      allowedEarlyLeaveMinutes: parseInt(
        form.allowedEarlyLeaveMinutes.trim(),
        10,
      ),
    };

    setLoading(true);
    try {
      await shiftApi.createShift(data as any);

      setAlert({
        visible: true,
        title: "Success",
        message: "Shift created successfully!",
        type: "success",
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error("Create shift error:", error);
      setAlert({
        visible: true,
        title: "Error",
        message: error.message || "Failed to create shift",
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>New Shift</Text>
            <View style={{ width: 28 }} />
          </Animated.View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.form}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shift Code *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="barcode-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="HC"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.shiftCode}
                    onChangeText={(v) => handleInputChange("shiftCode", v)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shift Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Office"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.name}
                    onChangeText={(v) => handleInputChange("name", v)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Start Time *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="08:00:00"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={form.startTime}
                      onChangeText={(v) => handleInputChange("startTime", v)}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>End Time *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="17:00:00"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={form.endTime}
                      onChangeText={(v) => handleInputChange("endTime", v)}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Break Duration</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="cafe-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="01:00:00"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.breakDuration}
                    onChangeText={(v) => handleInputChange("breakDuration", v)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Late Limit (Min)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="15"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={form.allowedLateMinutes}
                      onChangeText={(v) =>
                        handleInputChange("allowedLateMinutes", v)
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Early Limit (Min)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="15"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={form.allowedEarlyLeaveMinutes}
                      onChangeText={(v) =>
                        handleInputChange("allowedEarlyLeaveMinutes", v)
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.disabled]}
                onPress={onSave}
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
                    <Text style={styles.saveButtonText}>CREATE SHIFT</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  form: {
    marginTop: 15,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 60,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    height: 64,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 25,
    elevation: 8,
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  disabled: {
    opacity: 0.7,
  },
});
