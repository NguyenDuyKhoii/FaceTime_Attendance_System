import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import CustomAlert from "../../components/CustomAlert";
import EmployeeCard from "../../components/EmployeeCard";
import { employeeService } from "../../service/employee.service";
import { Employee } from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "EmployeeList">;

export function EmployeeListScreen({ navigation }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );
  const [departmentId, setDepartmentId] = useState("");

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const loadEmployees = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (departmentId.trim() !== "" && /^\d+$/.test(departmentId.trim())) {
        params.departmentId = parseInt(departmentId.trim(), 10);
      }

      const data = await employeeService.getEmployees(params);

      setEmployees(data);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load employee list";
      setAlert({
        visible: true,
        title: "Error",
        message: errorMessage,
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees(false);
  };

  useEffect(() => {
    loadEmployees();
  }, [filterActive, departmentId]);

  const handleEnrollFace = (employee: Employee) => {
    navigation.navigate("EnrollFace", {
      employeeId: employee.id,
      employeeName: employee.fullName,
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      emp.fullName.toLowerCase().includes(keyword) ||
      emp.employeeCode.toLowerCase().includes(keyword);

    // Keep a local guard for active/inactive filter so UI remains correct
    // even if backend query params are ignored by any environment/proxy.
    const matchesActive =
      filterActive === undefined
        ? true
        : Boolean(emp.isActive) === filterActive;

    const deptKeyword = departmentId.trim();
    const matchesDepartment =
      deptKeyword.length === 0 ||
      (/^\d+$/.test(deptKeyword) &&
        emp.departmentId === parseInt(deptKeyword, 10));

    return matchesSearch && matchesActive && matchesDepartment;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.titleContainer}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.title}>Employees</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddEmployee")}
            >
              <LinearGradient
                colors={["#00F2FE", "#4FACFE"]}
                style={styles.addGradient}
              >
                <Ionicons name="add" size={26} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.searchContainer}
          >
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search by name or code..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            style={styles.filterSection}
          >
            <View style={styles.statusFilters}>
              {["All", "Active", "Inactive"].map((label) => {
                const val = label === "All" ? undefined : label === "Active";
                const isActive = filterActive === val;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setFilterActive(val)}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isActive && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.deptFilterContainer}>
              <View style={styles.deptInputWrapper}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color="#999"
                  style={styles.deptIcon}
                />
                <TextInput
                  placeholder="Dept ID"
                  placeholderTextColor="#999"
                  style={styles.deptInput}
                  value={departmentId}
                  onChangeText={setDepartmentId}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Animated.View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FACFE" />
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 100).duration(500)}
              >
                <EmployeeCard
                  employee={item}
                  onPress={(emp) => console.log("Press", emp.fullName)}
                  onEnrollFace={handleEnrollFace}
                />
              </Animated.View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4FACFE"
                colors={["#4FACFE"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No employees found</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadEmployees()}
                >
                  <Text style={styles.retryText}>Refresh List</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
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
    backgroundColor: "#F8F9FA",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#F8F9FA",
    zIndex: 10,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  addButton: {
    elevation: 8,
    shadowColor: "#4FACFE",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 16,
  },
  filterSection: {
    gap: 12,
  },
  statusFilters: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  deptFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deptInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  deptIcon: {
    marginRight: 8,
  },
  deptInput: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 14,
  },
  clearButton: {
    padding: 2,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "rgba(79, 172, 254, 0.1)",
    borderColor: "#4FACFE",
  },
  filterText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#4FACFE",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    color: "#666",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 18,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 25,
    paddingHorizontal: 35,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#4FACFE",
  },
  retryText: {
    color: "#4FACFE",
    fontWeight: "bold",
    fontSize: 15,
  },
});
