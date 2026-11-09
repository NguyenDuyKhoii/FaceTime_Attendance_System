import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { reportsService } from "../../service/reports.service";
import {
  DepartmentAttendanceReportDto,
  MonthlyAttendanceReportItemDto,
  ProductionLineAttendanceReportDto,
} from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "Reports">;

const monthNow = new Date().getMonth() + 1;
const yearNow = new Date().getFullYear();

export function ReportsScreen({ navigation }: Props) {
  const [month, setMonth] = useState(String(monthNow));
  const [year, setYear] = useState(String(yearNow));
  const [departmentId, setDepartmentId] = useState("");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [monthlyData, setMonthlyData] = useState<
    MonthlyAttendanceReportItemDto[]
  >([]);
  const [lineData, setLineData] = useState<ProductionLineAttendanceReportDto[]>(
    [],
  );
  const [departmentData, setDepartmentData] = useState<
    DepartmentAttendanceReportDto[]
  >([]);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const parsedMonth = useMemo(() => Number.parseInt(month.trim(), 10), [month]);
  const parsedYear = useMemo(() => Number.parseInt(year.trim(), 10), [year]);
  const parsedDepartmentId = useMemo(() => {
    const raw = departmentId.trim();
    if (!raw) return undefined;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : Number.NaN;
  }, [departmentId]);

  const validateInputs = (): string | null => {
    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return "Month must be in the range 1-12.";
    }

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 2000 ||
      parsedYear > 2100
    ) {
      return "Year is invalid.";
    }

    if (Number.isNaN(parsedDepartmentId)) {
      return "Department ID must be a positive integer.";
    }

    return null;
  };

  const handleLoadReports = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setAlert({
        visible: true,
        title: "Validation",
        message: validationError,
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const [monthly, lines, departments] = await Promise.all([
        reportsService.getMonthlyAttendanceReport({
          month: parsedMonth,
          year: parsedYear,
          departmentId: parsedDepartmentId,
        }),
        reportsService.getProductionLineReport(parsedDepartmentId),
        reportsService.getDepartmentReport(),
      ]);

      setMonthlyData(monthly);
      setLineData(lines);
      setDepartmentData(departments);
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Unable to load reports.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setAlert({
        visible: true,
        title: "Validation",
        message: validationError,
        type: "error",
      });
      return;
    }

    setExporting(true);
    try {
      const exportResult = await reportsService.exportMonthlyAttendance({
        month: parsedMonth,
        year: parsedYear,
        departmentId: parsedDepartmentId,
      });

      const fileOpened = await reportsService.openExportedFile(
        exportResult.uri,
      );

      setAlert({
        visible: true,
        title: "Download Successful",
        message: fileOpened
          ? exportResult.savedToSharedFolder
            ? `Excel file downloaded to your selected Files folder and opened successfully.\n${exportResult.uri}`
            : `Excel file downloaded and opened successfully.\n${exportResult.uri}`
          : exportResult.savedToSharedFolder
            ? `Excel file downloaded to your selected Files folder.\nUnable to open automatically (please install an Excel viewer app like Microsoft Excel or WPS Office), then open from:\n${exportResult.uri}`
            : `Excel file downloaded successfully.\nUnable to open automatically (please install an Excel viewer app like Microsoft Excel or WPS Office), then open from:\n${exportResult.uri}`,
        type: "success",
      });
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Export Failed",
        message:
          error?.message ||
          "Unable to download a valid Excel file. Please check server response and try again.",
        type: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Report Filters</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Month</Text>
              <TextInput
                style={styles.input}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                placeholder="3"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholder="2026"
              />
            </View>
          </View>

          <Text style={styles.label}>Department ID (optional)</Text>
          <TextInput
            style={styles.input}
            value={departmentId}
            onChangeText={setDepartmentId}
            keyboardType="number-pad"
            placeholder="1"
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabled]}
            onPress={handleLoadReports}
            disabled={loading}
          >
            <LinearGradient
              colors={["#4FACFE", "#00F2FE"]}
              style={styles.primaryGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Load Reports</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, exporting && styles.disabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.secondaryText}>
              {exporting ? "Downloading..." : "Download & Open Excel (.xlsx)"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Monthly Attendance ({monthlyData.length})
          </Text>
          {monthlyData.slice(0, 10).map((item) => (
            <View key={item.employeeId} style={styles.reportRow}>
              <Text style={styles.reportTitle}>{item.employeeName}</Text>
              <Text style={styles.reportSub}>
                {item.department} • WorkingDays: {item.workingDays} • Late:{" "}
                {item.late} • EarlyLeave: {item.earlyLeave}
              </Text>
            </View>
          ))}
          {monthlyData.length > 10 && (
            <Text style={styles.muted}>
              Showing first 10/{monthlyData.length} records.
            </Text>
          )}
          {monthlyData.length === 0 && (
            <Text style={styles.muted}>No data available.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Production Line Summary ({lineData.length})
          </Text>
          {lineData.map((item, idx) => (
            <View
              key={`${item.productionLine}-${idx}`}
              style={styles.reportRow}
            >
              <Text style={styles.reportTitle}>{item.productionLine}</Text>
              <Text style={styles.reportSub}>
                Total: {item.totalEmployees} • Present: {item.present} • Late:{" "}
                {item.late}
              </Text>
            </View>
          ))}
          {lineData.length === 0 && (
            <Text style={styles.muted}>No data available.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Department Summary ({departmentData.length})
          </Text>
          {departmentData.map((item) => (
            <View key={item.departmentId} style={styles.reportRow}>
              <Text style={styles.reportTitle}>{item.department}</Text>
              <Text style={styles.reportSub}>
                Total: {item.totalEmployees} • Present: {item.present} • Late:{" "}
                {item.late}
              </Text>
            </View>
          ))}
          {departmentData.length === 0 && (
            <Text style={styles.muted}>No data available.</Text>
          )}
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A1A" },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEEF5",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202634",
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  label: { fontSize: 12, fontWeight: "600", color: "#667085", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 10,
  },
  primaryButton: { borderRadius: 12, overflow: "hidden", marginTop: 2 },
  primaryGradient: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#4FACFE",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF8FF",
  },
  secondaryText: { color: "#1F7ED9", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.65 },
  reportRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F7",
  },
  reportTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  reportSub: { marginTop: 2, fontSize: 12, color: "#6B7280" },
  muted: { marginTop: 8, fontSize: 12, color: "#9AA3B2" },
});
