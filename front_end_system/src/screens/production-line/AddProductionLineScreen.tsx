import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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
import axiosClient from "../../api/axiosClient";
import { productionLineApi } from "../../api/productionLine.api";
import CustomAlert from "../../components/CustomAlert";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AddProductionLine">;
const SUPPORTS_PRODUCTION_LINE_UPDATE = false;

interface Department {
  id: number;
  name: string;
}

export function AddProductionLineScreen({ navigation, route }: Props) {
  const selectedLine = route.params?.productionLine;
  const isEditMode = !!selectedLine?.id;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    lineName: selectedLine?.lineName ?? "",
    departmentId: selectedLine?.departmentId
      ? selectedLine.departmentId.toString()
      : "",
    capacity:
      selectedLine?.capacity !== undefined && selectedLine?.capacity !== null
        ? String(selectedLine.capacity)
        : "",
    machineCount:
      selectedLine?.machineCount !== undefined &&
      selectedLine?.machineCount !== null
        ? String(selectedLine.machineCount)
        : "",
    status: selectedLine?.status ?? "Active",
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
      const response = await axiosClient.get<any, Department[]>("/Departments");
      setDepartments(response);
      if (response.length > 0) {
        setForm((prev) => ({
          ...prev,
          departmentId: prev.departmentId || response[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const parseOptionalPositiveInt = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return Number.NaN;

    const parsed = parseInt(trimmed, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return Number.NaN;
    return parsed;
  };

  const validateForm = (): string | null => {
    const lineName = form.lineName.trim();
    const departmentId = parseInt(form.departmentId, 10);
    const capacity = parseOptionalPositiveInt(form.capacity);
    const machineCount = parseOptionalPositiveInt(form.machineCount);

    if (!lineName) {
      return "Line Name is required";
    }

    if (lineName.length > 200) {
      return "Line Name must be at most 200 characters";
    }

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
      return "Please select a valid Department";
    }

    if (Number.isNaN(capacity)) {
      return "Capacity must be a positive whole number";
    }

    if (Number.isNaN(machineCount)) {
      return "Machines must be a positive whole number";
    }

    if (capacity !== null && machineCount !== null && machineCount > capacity) {
      return "Machines cannot be greater than Capacity";
    }

    if (!["Active", "Inactive", "Maintenance"].includes(form.status)) {
      return "Status is invalid";
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

    const capacity = parseOptionalPositiveInt(form.capacity);
    const machineCount = parseOptionalPositiveInt(form.machineCount);

    const data = {
      lineName: form.lineName.trim(),
      departmentId: parseInt(form.departmentId, 10),
      capacity,
      machineCount,
      status: form.status,
    };

    if (isEditMode && !SUPPORTS_PRODUCTION_LINE_UPDATE) {
      setAlert({
        visible: true,
        title: "Unsupported",
        message:
          "BE hien tai chua ho tro API sua Production Line (PUT /api/ProductionLines/{id}).",
        type: "info",
        onConfirm: undefined,
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && selectedLine) {
        await productionLineApi.updateProductionLine(selectedLine.id, data);
      } else {
        await productionLineApi.createProductionLine(data);
      }

      setAlert({
        visible: true,
        title: "Success",
        message: isEditMode
          ? "Production Line updated successfully!"
          : "Production Line created successfully!",
        type: "success",
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error("Create production line error:", error);
      setAlert({
        visible: true,
        title: "Error",
        message: error.message || "Failed to create production line",
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
            <Text style={styles.title}>
              {isEditMode ? "Edit Production Line" : "New Production Line"}
            </Text>
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
                <Text style={styles.label}>Line Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="git-network-outline"
                    size={20}
                    color="#4FACFE"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Enter line name"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={form.lineName}
                    onChangeText={(v) => handleInputChange("lineName", v)}
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
                        {dept.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Capacity</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="20"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={form.capacity}
                      onChangeText={(v) => handleInputChange("capacity", v)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Machines</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="5"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={form.machineCount}
                      onChangeText={(v) => handleInputChange("machineCount", v)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.roleButtons}>
                  {["Active", "Inactive", "Maintenance"].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.roleButton,
                        form.status === s && styles.roleButtonActive,
                      ]}
                      onPress={() => handleInputChange("status", s)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          form.status === s && styles.roleButtonTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                    <Text style={styles.saveButtonText}>
                      {isEditMode
                        ? "UPDATE PRODUCTION LINE"
                        : "CREATE PRODUCTION LINE"}
                    </Text>
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
    minWidth: 80,
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
  roleButtons: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  roleButtonActive: {
    borderColor: "#4FACFE",
    backgroundColor: "rgba(79, 172, 254, 0.1)",
  },
  roleButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  roleButtonTextActive: {
    color: "#4FACFE",
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
