import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { employeeApi } from "../api/employee.api";
import { productionLineApi } from "../api/productionLine.api";
import { shiftApi } from "../api/shift.api";
import CustomAlert from "../components/CustomAlert";
import { Employee, ProductionLine, Shift } from "../types/api.types";
import { AppStackParamList } from "../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AddShiftAssignment">;

export function AddShiftAssignmentScreen({ navigation }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7)),
  );

  // UI state
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"employee" | "shift" | "line">(
    "employee",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, shiftData, lineData] = await Promise.all([
          employeeApi.getEmployees(),
          shiftApi.getShifts(),
          productionLineApi.getProductionLines(),
        ]);
        setEmployees(empData);
        setShifts(shiftData);
        setLines(lineData);
      } catch (error) {
        console.error("Error fetching data for assignment:", error);
        setAlert({
          visible: true,
          title: "Error",
          message: "Cannot load initial data",
          type: "error",
          onConfirm: undefined,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toIsoAtNoon = (date: Date): string => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized.toISOString();
  };

  const validateAssignment = (): string | null => {
    if (!selectedEmployee) {
      return "Please select an employee";
    }

    if (!selectedShift) {
      return "Please select a shift";
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      return "Start date cannot be after end date";
    }

    const maxRangeDays = 366;
    const durationMs = end.getTime() - start.getTime();
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    if (days > maxRangeDays) {
      return "Assignment range is too long (max 1 year)";
    }

    return null;
  };

  const handleAssign = async () => {
    const validationError = validateAssignment();
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

    const employee = selectedEmployee;
    const shift = selectedShift;
    if (!employee || !shift) {
      setAlert({
        visible: true,
        title: "Validation Error",
        message: "Please select an employee and a shift",
        type: "error",
        onConfirm: undefined,
      });
      return;
    }

    setSubmitting(true);
    try {
      await shiftApi.assignShift({
        employeeId: employee.id,
        shiftId: shift.id,
        fromDate: toIsoAtNoon(fromDate),
        toDate: toIsoAtNoon(toDate),
        productionLineId: selectedLine?.id,
      });
      setAlert({
        visible: true,
        title: "Success",
        message: "Shift assigned successfully",
        type: "success",
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while assigning shift";
      setAlert({
        visible: true,
        title: "Error",
        message: errorMsg,
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openPicker = (type: "employee" | "shift" | "line") => {
    setModalType(type);
    setSearchQuery("");
    setModalVisible(true);
  };

  const filteredItems = () => {
    const query = searchQuery.toLowerCase();
    if (modalType === "employee") {
      return employees.filter(
        (e) =>
          e.fullName.toLowerCase().includes(query) ||
          e.employeeCode.toLowerCase().includes(query),
      );
    }
    if (modalType === "shift") {
      return shifts.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.shiftCode.toLowerCase().includes(query),
      );
    }
    return lines.filter(
      (l) =>
        l.lineName.toLowerCase().includes(query) ||
        (l.lineCode ?? "").toLowerCase().includes(query),
    );
  };

  const renderModalItem = ({ item }: { item: any }) => {
    let title = "";
    let subtitle = "";
    let isSelected = false;

    if (modalType === "employee") {
      title = item.fullName;
      subtitle = item.employeeCode;
      isSelected = selectedEmployee?.id === item.id;
    } else if (modalType === "shift") {
      title = item.name;
      subtitle = `${item.startTime} - ${item.endTime}`;
      isSelected = selectedShift?.id === item.id;
    } else {
      title = item.lineName;
      subtitle = item.lineCode;
      isSelected = selectedLine?.id === item.id;
    }

    return (
      <TouchableOpacity
        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
        onPress={() => {
          if (modalType === "employee") setSelectedEmployee(item);
          else if (modalType === "shift") setSelectedShift(item);
          else setSelectedLine(item);
          setModalVisible(false);
        }}
      >
        <View style={styles.modalItemContent}>
          <Text
            style={[
              styles.modalItemTitle,
              isSelected && styles.modalItemTitleSelected,
            ]}
          >
            {title}
          </Text>
          <Text style={styles.modalItemSub}>{subtitle}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#4FACFE" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4FACFE" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Shift Assignment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.formCard}
        >
          <Text style={styles.sectionTitle}>Assignment Details</Text>

          {/* Employee Picker */}
          <Text style={styles.label}>Employee *</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => openPicker("employee")}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#666"
                style={styles.pickerIcon}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedEmployee && styles.placeholderText,
                ]}
              >
                {selectedEmployee
                  ? selectedEmployee.fullName
                  : "Select employee"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* Shift Picker */}
          <Text style={styles.label}>Shift *</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => openPicker("shift")}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#666"
                style={styles.pickerIcon}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedShift && styles.placeholderText,
                ]}
              >
                {selectedShift ? selectedShift.name : "Select shift"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* Line Picker */}
          <Text style={styles.label}>Production Line (Optional)</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => openPicker("line")}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name="git-network-outline"
                size={20}
                color="#666"
                style={styles.pickerIcon}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedLine && styles.placeholderText,
                ]}
              >
                {selectedLine ? selectedLine.lineName : "Select line"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* Date Pickers */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>From Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowFromPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#4FACFE" />
                <Text style={styles.datePickerText}>
                  {fromDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.label}>To Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowToPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#FF4D4D" />
                <Text style={styles.datePickerText}>
                  {toDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Date Picker Components */}
        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event: any, selectedDate?: Date) => {
              setShowFromPicker(false);
              if (selectedDate) setFromDate(selectedDate);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event: any, selectedDate?: Date) => {
              setShowToPicker(false);
              if (selectedDate) setToDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAssign}
          disabled={submitting}
        >
          <LinearGradient
            colors={["#4FACFE", "#00F2FE"]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitText}>Create Assignment</Text>
                <Ionicons
                  name="checkmark-done"
                  size={20}
                  color="white"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Picker */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "employee"
                  ? "Select Employee"
                  : modalType === "shift"
                    ? "Select Shift"
                    : "Select Line"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearch}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredItems()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderModalItem}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() =>
          setAlert((prev) => ({
            ...prev,
            visible: false,
            onConfirm: undefined,
          }))
        }
        onConfirm={alert.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 15,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerText: {
    fontSize: 15,
    color: "#1A1A1A",
  },
  placeholderText: {
    color: "#999",
  },
  dateRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 30,
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: "row",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 15,
    color: "#666",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  modalSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    marginHorizontal: 25,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  modalList: {
    padding: 25,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemSelected: {
    backgroundColor: "rgba(79, 172, 254, 0.05)",
    marginHorizontal: -25,
    paddingHorizontal: 25,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  modalItemTitleSelected: {
    color: "#4FACFE",
    fontWeight: "bold",
  },
  modalItemSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
