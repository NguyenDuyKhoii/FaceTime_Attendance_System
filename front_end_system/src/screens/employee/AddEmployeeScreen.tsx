import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
import { Department, departmentApi } from "../../api/department.api";
import CustomAlert from "../../components/CustomAlert";
import { employeeService } from "../../service/employee.service";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AddEmployee">;

export function AddEmployeeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showHireDatePicker, setShowHireDatePicker] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    employeeCode: "",
    email: "",
    phoneNumber: "",
    identityNumber: "",
    dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 20))
      .toISOString()
      .split("T")[0],
    hireDate: new Date().toISOString().split("T")[0],
    isActive: true,
    departmentId: "",
  });

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
      if (data.length > 0) {
        setForm((prev) => ({ ...prev, departmentId: data[0].id.toString() }));
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateValue = (value: string, fallback: Date) => {
    const parts = value.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;

    return fallback;
  };

  const toIsoAtNoon = (value: string, fallback: Date) => {
    const date = parseDateValue(value, fallback);
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
  };

  const validateForm = (): string | null => {
    const fullName = form.fullName.trim();
    const employeeCode = form.employeeCode.trim();
    const email = form.email.trim();
    const phoneNumber = form.phoneNumber.trim();
    const identityNumber = form.identityNumber.trim();
    const departmentId = parseInt(form.departmentId, 10);

    if (!fullName) {
      return "Full Name is required";
    }

    if (fullName.length > 200) {
      return "Full Name must be at most 200 characters";
    }

    if (!employeeCode) {
      return "Employee Code is required";
    }

    if (employeeCode.length > 50) {
      return "Employee Code must be at most 50 characters";
    }

    if (!/^[A-Za-z0-9_-]+$/.test(employeeCode)) {
      return "Employee Code only allows letters, numbers, _ and -";
    }

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
      return "Please select a valid Department";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Email format is invalid";
    }

    if (phoneNumber && !/^\d{9,15}$/.test(phoneNumber)) {
      return "Phone Number must contain 9 to 15 digits";
    }

    if (identityNumber && !/^\d{9,20}$/.test(identityNumber)) {
      return "Identity Number must contain 9 to 20 digits";
    }

    const dob = parseDateValue(form.dateOfBirth, new Date(1990, 0, 1));
    const hireDate = parseDateValue(form.hireDate, new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dob.setHours(0, 0, 0, 0);
    hireDate.setHours(0, 0, 0, 0);

    if (dob >= today) {
      return "Date of Birth must be earlier than today";
    }

    if (hireDate > today) {
      return "Hire Date cannot be in the future";
    }

    if (hireDate < dob) {
      return "Hire Date cannot be earlier than Date of Birth";
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

    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      employeeCode: form.employeeCode.trim().toUpperCase(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      identityNumber: form.identityNumber.trim(),
      departmentId: parseInt(form.departmentId, 10),
      dateOfBirth: toIsoAtNoon(form.dateOfBirth, new Date(1990, 0, 1)),
      hireDate: toIsoAtNoon(form.hireDate, new Date()),
    };

    setLoading(true);
    try {
      await employeeService.createEmployee(payload as any);
      setAlert({
        visible: true,
        title: "Success",
        message: "Employee created successfully!",
        type: "success",
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error("Create employee error:", error);
      let message = error.message || "Failed to create employee";
      let title = "Error";

      if (error.response?.status === 403) {
        title = "Permission Denied";
        message =
          "Your account does not have permission (Admin/HR) to create employees.";
      }

      setAlert({
        visible: true,
        title: title,
        message: message,
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
            <Text style={styles.title}>New Employee</Text>
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
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Enter full name"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.fullName}
                    onChangeText={(v) => handleInputChange("fullName", v)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee Code *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="barcode-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="EMP001"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.employeeCode}
                    onChangeText={(v) => handleInputChange("employeeCode", v)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Identity Number (CCCD/CMND)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Enter identity number"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.identityNumber}
                    onChangeText={(v) => handleInputChange("identityNumber", v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Department *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectorScroll}
                >
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.selectorItem,
                        form.departmentId === dept.id.toString() &&
                          styles.selectorItemActive,
                      ]}
                      onPress={() =>
                        handleInputChange("departmentId", dept.id.toString())
                      }
                    >
                      <Text
                        style={[
                          styles.selectorText,
                          form.departmentId === dept.id.toString() &&
                            styles.selectorTextActive,
                        ]}
                      >
                        [{dept.departmentCode}] {dept.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {departments.length === 0 && (
                  <Text style={styles.helperText}>
                    No departments found. Please create one first.
                  </Text>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={0.8}
                    onPress={() => setShowDobPicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#4FACFE"
                      style={styles.inputIcon}
                    />
                    <Text style={styles.dateText}>{form.dateOfBirth}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Hire Date</Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={0.8}
                    onPress={() => setShowHireDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#4FACFE"
                      style={styles.inputIcon}
                    />
                    <Text style={styles.dateText}>{form.hireDate}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDobPicker && (
                <DateTimePicker
                  value={parseDateValue(form.dateOfBirth, new Date(1990, 0, 1))}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date(1950, 0, 1)}
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    setShowDobPicker(false);
                    if (selectedDate) {
                      handleInputChange(
                        "dateOfBirth",
                        formatDateValue(selectedDate),
                      );
                    }
                  }}
                />
              )}

              {showHireDatePicker && (
                <DateTimePicker
                  value={parseDateValue(form.hireDate, new Date())}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date(2000, 0, 1)}
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    setShowHireDatePicker(false);
                    if (selectedDate) {
                      handleInputChange(
                        "hireDate",
                        formatDateValue(selectedDate),
                      );
                    }
                  }}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="email@company.com"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.email}
                    onChangeText={(v) => handleInputChange("email", v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="0123456789"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.phoneNumber}
                    onChangeText={(v) => handleInputChange("phoneNumber", v)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (loading || departments.length === 0) && styles.disabled,
                ]}
                onPress={onSave}
                disabled={loading || departments.length === 0}
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
                    <Text style={styles.saveButtonText}>CREATE EMPLOYEE</Text>
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
  dateText: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "500",
  },
  selectorScroll: {
    flexDirection: "row",
    marginTop: 5,
  },
  selectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginRight: 10,
    minWidth: 100,
    alignItems: "center",
  },
  selectorItemActive: {
    borderColor: "#4FACFE",
    backgroundColor: "rgba(79, 172, 254, 0.1)",
  },
  selectorText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  selectorTextActive: {
    color: "#4FACFE",
  },
  helperText: {
    fontSize: 12,
    color: "#FF4D4D",
    marginTop: 5,
    marginLeft: 5,
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
