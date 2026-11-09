/**
 * FILE: src/screens/AttendanceHistoryScreen.tsx
 * MỤC ĐÍCH: Hiển thị danh sách lịch sử chấm công
 * - Pagination support
 * - Filter by date range, employee, department, production line
 * - Real-time updates qua SignalR
 * - Navigate to detail by tapping row
 */

import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";
import { attendanceService } from "../../service/attendance.service";
import {
  AttendanceHistoryDto,
  AttendanceQueryParams,
} from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AttendanceHistory">;

export function AttendanceHistoryScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [historicalRecords, setHistoricalRecords] = useState<
    AttendanceHistoryDto[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    undefined,
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [employeeIdFilter, setEmployeeIdFilter] = useState(
    route.params?.employeeId ?? "",
  );
  const [departmentIdFilter, setDepartmentIdFilter] = useState(
    route.params?.departmentId ? String(route.params.departmentId) : "",
  );
  const [productionLineIdFilter, setProductionLineIdFilter] = useState(
    route.params?.productionLineId ? String(route.params.productionLineId) : "",
  );
  const [fromDateFilter, setFromDateFilter] = useState(
    route.params?.fromDate ?? "",
  );
  const [toDateFilter, setToDateFilter] = useState(route.params?.toDate ?? "");
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });
  const [accessDeniedByApi, setAccessDeniedByApi] = useState(false);

  const normalizedRoles = (user?.roles ?? []).map((role) => role.toUpperCase());
  const isManagerOnly =
    normalizedRoles.includes("MANAGER") &&
    !normalizedRoles.some((role) =>
      ["ADMIN", "HR", "ADMINISTRATOR"].includes(role),
    );

  useEffect(() => {
    loadAttendanceHistory(pageNumber);
  }, [pageNumber]);

  const normalizeStatus = (status?: string) => {
    if (!status) return status;
    return status === "Present" ? "OnTime" : status;
  };

  const parseOptionalPositiveInt = (value: string): number | undefined => {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  const getApiFilters = (): AttendanceQueryParams => ({
    employeeId: employeeIdFilter.trim() || undefined,
    departmentId: parseOptionalPositiveInt(departmentIdFilter),
    productionLineId: parseOptionalPositiveInt(productionLineIdFilter),
    fromDate: fromDateFilter.trim() || undefined,
    toDate: toDateFilter.trim() || undefined,
  });

  const loadAttendanceHistory = async (
    targetPageNumber = 1,
    showLoader = true,
  ) => {
    try {
      if (showLoader) setLoading(true);

      const params: AttendanceQueryParams = {
        pageNumber: targetPageNumber,
        pageSize,
        ...getApiFilters(),
      };

      const response = await attendanceService.getAttendanceHistory(params);
      setAccessDeniedByApi(false);
      if (targetPageNumber === 1) {
        setHistoricalRecords(response.data);
      } else {
        setHistoricalRecords((prev) => {
          const merged = [...prev, ...response.data];
          const deduped = merged.filter(
            (item, index) =>
              merged.findIndex((x) => x.id === item.id) === index,
          );
          return deduped;
        });
      }
      setTotalRecords(response.totalRecords);
    } catch (error: any) {
      console.error("Failed to load attendance history:", error);

      const message = String(error?.message || "");
      const lower = message.toLowerCase();
      const isUnauthorizedMessage =
        lower.includes("unauthorized") ||
        lower.includes("forbidden") ||
        lower.includes("no permission") ||
        lower.includes("unauthorize");

      if (isUnauthorizedMessage) {
        setAccessDeniedByApi(true);
      }

      setAlert({
        visible: true,
        title: "Error",
        message: message || "Unable to load attendance history",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (pageNumber !== 1) {
      setPageNumber(1);
      return;
    }
    loadAttendanceHistory(1, false);
  };

  const handleEndReached = () => {
    const hasMore = historicalRecords.length < totalRecords;
    if (!loading && hasMore) {
      setPageNumber(pageNumber + 1);
    }
  };

  const applyAdvancedFilters = () => {
    if (pageNumber !== 1) {
      setPageNumber(1);
      return;
    }
    loadAttendanceHistory(1);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterStatus(undefined);
    setEmployeeIdFilter("");
    setDepartmentIdFilter("");
    setProductionLineIdFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    if (pageNumber !== 1) {
      setPageNumber(1);
      return;
    }
    loadAttendanceHistory(1);
  };

  const filteredData = historicalRecords.filter(
    (item) =>
      (searchQuery === ""
        ? true
        : item.employeeName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) &&
      (filterStatus
        ? normalizeStatus(item.status) === normalizeStatus(filterStatus)
        : true),
  );

  const hasApiFilters = Boolean(
    employeeIdFilter.trim() ||
    departmentIdFilter.trim() ||
    productionLineIdFilter.trim() ||
    fromDateFilter.trim() ||
    toDateFilter.trim(),
  );
  const hasClientFilters = Boolean(searchQuery.trim() || filterStatus);
  const hasAnyFilters = hasApiFilters || hasClientFilters;

  const getEmptyState = () => {
    if (accessDeniedByApi) {
      return {
        title: "Access Denied",
        message:
          "Your current account is not allowed to view consolidated attendance history.",
      };
    }

    if (historicalRecords.length > 0 && filteredData.length === 0) {
      return {
        title: "No Data Matches Active Filters",
        message:
          "The list is currently hidden by search or status filters. Try clearing all filters.",
      };
    }

    if (isManagerOnly) {
      return {
        title: "No Data In Managed Scope",
        message:
          "Managers can only view data from assigned departments/production lines. Check manager assignments or create attendance records.",
      };
    }

    if (hasApiFilters) {
      return {
        title: "No Data",
        message:
          "The server returned no records for the current advanced filters.",
      };
    }

    return {
      title: "No Data",
      message: "There are no attendance records in the system yet.",
    };
  };

  const emptyState = getEmptyState();

  const handleAttendanceSelect = (record: AttendanceHistoryDto) => {
    navigation.navigate("AttendanceDetail", { recordId: record.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* SEARCH & FILTER HEADER */}
      <LinearGradient
        colors={["#3B82F6", "#1E40AF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employee name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.advancedFilterToggle}
          onPress={() => setShowAdvancedFilters((prev) => !prev)}
        >
          <Text style={styles.advancedFilterToggleText}>
            {showAdvancedFilters
              ? "Hide advanced filters"
              : "Show advanced filters"}
          </Text>
          <Ionicons
            name={showAdvancedFilters ? "chevron-up" : "chevron-down"}
            size={16}
            color="#E5E7EB"
          />
        </TouchableOpacity>

        {showAdvancedFilters && (
          <View style={styles.advancedFilterCard}>
            <TextInput
              style={styles.filterInput}
              placeholder="employeeId (GUID)"
              placeholderTextColor="#9CA3AF"
              value={employeeIdFilter}
              onChangeText={setEmployeeIdFilter}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.filterInput}
              placeholder="departmentId"
              placeholderTextColor="#9CA3AF"
              value={departmentIdFilter}
              onChangeText={setDepartmentIdFilter}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.filterInput}
              placeholder="productionLineId"
              placeholderTextColor="#9CA3AF"
              value={productionLineIdFilter}
              onChangeText={setProductionLineIdFilter}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.filterInput}
              placeholder="fromDate (YYYY-MM-DD)"
              placeholderTextColor="#9CA3AF"
              value={fromDateFilter}
              onChangeText={setFromDateFilter}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.filterInput}
              placeholder="toDate (YYYY-MM-DD)"
              placeholderTextColor="#9CA3AF"
              value={toDateFilter}
              onChangeText={setToDateFilter}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={applyAdvancedFilters}
            >
              <Text style={styles.applyFilterButtonText}>Apply filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STATUS FILTER PILLS */}
        <View style={styles.filterPills}>
          <TouchableOpacity
            onPress={() => setFilterStatus(undefined)}
            style={[styles.pill, !filterStatus && styles.pillActive]}
          >
            <Text
              style={[styles.pillText, !filterStatus && styles.pillTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>
          {[
            "OnTime",
            "Late",
            "EarlyLeave",
            "Absent",
            "OnLeave",
            "SickLeave",
          ].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() =>
                setFilterStatus(filterStatus === status ? undefined : status)
              }
              style={[
                styles.pill,
                filterStatus === status && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  filterStatus === status && styles.pillTextActive,
                ]}
              >
                {attendanceService.getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ATTENDANCE LIST */}
      {loading && pageNumber === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>{emptyState.title}</Text>
          <Text style={styles.emptySubText}>{emptyState.message}</Text>
          {hasAnyFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.clearFiltersButtonText}>
                Clear all filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AttendanceHistoryItem
              item={item}
              onPress={() => handleAttendanceSelect(item)}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            loading && pageNumber > 1 ? (
              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={styles.footerLoader}
              />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* PAGINATION INFO */}
      <View style={styles.paginationFooter}>
        <Text style={styles.paginationText}>
          {filteredData.length > 0
            ? `Page ${pageNumber} • Total: ${totalRecords}`
            : ""}
        </Text>
      </View>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

// ===== COMPONENTS =====

interface AttendanceHistoryItemProps {
  item: AttendanceHistoryDto;
  onPress: () => void;
}

function AttendanceHistoryItem({ item, onPress }: AttendanceHistoryItemProps) {
  const statusColor = attendanceService.getStatusColor(item.status);
  const statusLabel = attendanceService.getStatusLabel(item.status);
  const checkInTime = item.checkInTime
    ? attendanceService.formatTime(item.checkInTime)
    : "--:--";

  return (
    <Animated.View entering={FadeInDown.delay(100)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.attendanceCard}>
          {/* LEFT: STATUS BADGE */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text
              style={[
                styles.statusBadgeText,
                { color: statusColor === "#FFFFFF" ? "#1F2937" : "#FFFFFF" },
              ]}
            >
              {statusLabel.charAt(0)}
            </Text>
          </View>

          {/* MIDDLE: INFO */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.employeeName}</Text>
            <Text style={styles.cardSubtitle}>{item.department}</Text>
            <Text style={styles.cardTime}>{checkInTime}</Text>
          </View>

          {/* RIGHT: STATUS & ARROW */}
          <View style={styles.cardRight}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {statusLabel}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#D1D5DB"
              style={styles.arrow}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  // HEADER
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
  },
  clearButton: {
    padding: 4,
  },
  advancedFilterToggle: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  advancedFilterToggleText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
  advancedFilterCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  filterInput: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 8,
    color: "#1F2937",
    fontSize: 13,
  },
  applyFilterButton: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  applyFilterButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // FILTER PILLS
  filterPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  pillActive: {
    backgroundColor: "#FFFFFF",
  },
  pillText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  pillTextActive: {
    color: "#3B82F6",
  },

  // CONTENT
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
    fontWeight: "600",
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 18,
  },
  clearFiltersButton: {
    marginTop: 14,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // ATTENDANCE CARD
  attendanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  cardTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  cardRight: {
    alignItems: "flex-end",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  arrow: {
    marginTop: 2,
  },

  // FOOTER
  footerLoader: {
    marginVertical: 16,
  },
  paginationFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  paginationText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
