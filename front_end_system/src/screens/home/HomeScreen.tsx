import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../service/dashboard.service";
import { employeeService } from "../../service/employee.service";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { logout, user } = useAuth();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const isAdmin = user?.roles?.some((r) =>
    ["ADMIN", "ADMINISTRATOR", "HR"].includes(r.toUpperCase()),
  );

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const heroTopPadding =
    (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 12;

  useEffect(() => {
    loadHeroStats();
  }, []);

  const loadHeroStats = async () => {
    try {
      setStatsLoading(true);

      const [employeesResult, todayResult] = await Promise.allSettled([
        employeeService.getEmployees(),
        dashboardService.getTodayAttendance(),
      ]);

      let totalEmployees = 0;
      let presentEmployees = 0;

      if (employeesResult.status === "fulfilled") {
        totalEmployees = employeesResult.value.length;
      }

      if (todayResult.status === "fulfilled") {
        presentEmployees = todayResult.value.present;
        if (totalEmployees === 0) {
          totalEmployees = todayResult.value.totalEmployees;
        }
      }

      setEmployeeCount(totalEmployees);
      setPresentCount(presentEmployees);
      setAttendanceRate(
        totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0,
      );
    } catch (error) {
      console.warn("Failed to load home stats", error);
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHeroStats();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={["#2563EB"]}
            />
          }
        >
          {/* ─── Top Header (Clean Light Canvas) ─── */}
          <View style={[styles.topHeader, { paddingTop: heroTopPadding }]}>
            <Animated.View entering={FadeInUp.duration(500)} style={styles.userBar}>
              <View style={styles.userTextGroup}>
                <Text style={styles.greetingLabel}>{getGreeting()},</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.fullName || user?.username || "Administrator"}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <View style={styles.roleDot} />
                    <Text style={styles.roleText}>{user?.roles?.[0] || "ADMIN"}</Text>
                  </View>
                  <Text style={styles.dateChipText}>• {dateStr}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.avatarButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("EmployeeList")}
              >
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={24} color="#2563EB" />
                </View>
                <View style={styles.liveIndicator} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.content}>
            {/* ─── Spotlight Card: Quick Face Check-in ─── */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <TouchableOpacity
                style={styles.heroCheckInCard}
                onPress={() => navigation.navigate("AttendanceCheckIn" as any)}
                activeOpacity={0.88}
              >
                <View style={styles.heroLeft}>
                  <View style={styles.heroScannerIcon}>
                    <Ionicons name="scan" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.heroTextWrap}>
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>LIVE CAMERA</Text>
                    </View>
                    <Text style={styles.heroTitle}>Face Attendance</Text>
                    <Text style={styles.heroSubtitle}>
                      Tap to open camera & scan face
                    </Text>
                  </View>
                </View>
                <View style={styles.heroArrowBtn}>
                  <Ionicons name="arrow-forward" size={20} color="#2563EB" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Interactive Overview Widgets (2 Cards) ─── */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsRow}>
              {/* Total Staff Card */}
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate("EmployeeList")}
                activeOpacity={0.85}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBadge, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="people" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.statPillBadge}>
                    <Text style={styles.statPillText}>TOTAL</Text>
                  </View>
                </View>
                <View style={styles.statMetricRow}>
                  <Text style={styles.statNumber}>
                    {statsLoading ? "--" : employeeCount}
                  </Text>
                  <Text style={styles.statMetricUnit}>Staff</Text>
                </View>
                <Text style={styles.statLabel}>Active Employees</Text>
                <View style={styles.statFootnoteRow}>
                  <View style={styles.statActiveDot} />
                  <Text style={styles.statFootnote}>Verified staff registry</Text>
                </View>
              </TouchableOpacity>

              {/* Attendance Rate Card */}
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate("Dashboard")}
                activeOpacity={0.85}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBadge, { backgroundColor: "#ECFDF5" }]}>
                    <Ionicons name="checkmark-done" size={18} color="#059669" />
                  </View>
                  <View style={[styles.statPillBadge, { backgroundColor: "#ECFDF5" }]}>
                    <Text style={[styles.statPillText, { color: "#059669" }]}>TODAY</Text>
                  </View>
                </View>
                <View style={styles.statMetricRow}>
                  <Text style={[styles.statNumber, { color: "#059669" }]}>
                    {statsLoading ? "--%" : `${attendanceRate.toFixed(0)}%`}
                  </Text>
                  <Text style={[styles.statMetricUnit, { color: "#059669" }]}>Present</Text>
                </View>
                <Text style={styles.statLabel}>Attendance Rate</Text>
                <View style={styles.statProgressBarBg}>
                  <View
                    style={[
                      styles.statProgressBarFill,
                      { width: `${Math.min(Math.max(attendanceRate, 4), 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.statFootnote}>
                  {presentCount} of {employeeCount} checked in
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Primary Quick Actions ─── */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.actionPillCard}
                onPress={() => navigation.navigate("Dashboard")}
                activeOpacity={0.85}
              >
                <View style={styles.actionHeaderRow}>
                  <View style={[styles.actionIconWrap, { backgroundColor: "#FAF5FF" }]}>
                    <Ionicons name="stats-chart" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.actionPillTitle} numberOfLines={1}>Analytics</Text>
                </View>
                <Text style={styles.actionPillSub} numberOfLines={2}>
                  Live check-in trends, analytics & department rates
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPillCard}
                onPress={() => navigation.navigate("EmployeeList")}
                activeOpacity={0.85}
              >
                <View style={styles.actionHeaderRow}>
                  <View style={[styles.actionIconWrap, { backgroundColor: "#F0F9FF" }]}>
                    <Ionicons name="finger-print" size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.actionPillTitle} numberOfLines={1}>Directory</Text>
                </View>
                <Text style={styles.actionPillSub} numberOfLines={2}>
                  Staff profiles, biometric dataset & enrollment
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Management Grid (Admin only) ─── */}
            {isAdmin && (
              <>
                <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTag} />
                  <Text style={styles.sectionHeading}>Workforce & Scheduling</Text>
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>4 items</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.gridContainer}>
                  {/* Departments */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("DepartmentList")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bentoHeaderRow}>
                      <View style={[styles.bentoIconWrap, { backgroundColor: "#EFF6FF" }]}>
                        <Ionicons name="business" size={19} color="#2563EB" />
                      </View>
                      <Text style={styles.bentoTitle} numberOfLines={2}>Departments</Text>
                    </View>
                    <Text style={styles.bentoSubtitle} numberOfLines={3}>
                      Manage company divisions, team hierarchies, and department staffing.
                    </Text>
                  </TouchableOpacity>

                  {/* Production Lines */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("ProductionLineList")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bentoHeaderRow}>
                      <View style={[styles.bentoIconWrap, { backgroundColor: "#ECFDF5" }]}>
                        <Ionicons name="git-network" size={19} color="#059669" />
                      </View>
                      <Text style={styles.bentoTitle} numberOfLines={2}>Production Lines</Text>
                    </View>
                    <Text style={styles.bentoSubtitle} numberOfLines={3}>
                      Configure factory lines, assigned workstations, and machine operations.
                    </Text>
                  </TouchableOpacity>

                  {/* Shifts */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("ShiftList")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bentoHeaderRow}>
                      <View style={[styles.bentoIconWrap, { backgroundColor: "#FFFBEB" }]}>
                        <Ionicons name="time" size={19} color="#D97706" />
                      </View>
                      <Text style={styles.bentoTitle} numberOfLines={2}>Work Shifts</Text>
                    </View>
                    <Text style={styles.bentoSubtitle} numberOfLines={3}>
                      Define working hours, shift rotations, grace periods, and overtime rules.
                    </Text>
                  </TouchableOpacity>

                  {/* Shift Assignments */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("ShiftAssignmentList")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bentoHeaderRow}>
                      <View style={[styles.bentoIconWrap, { backgroundColor: "#FAF5FF" }]}>
                        <Ionicons name="calendar" size={19} color="#7C3AED" />
                      </View>
                      <Text style={styles.bentoTitle} numberOfLines={2}>Shift Assigns</Text>
                    </View>
                    <Text style={styles.bentoSubtitle} numberOfLines={3}>
                      Allocate employees to daily rosters, production lines, and shifts.
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* ─── System & Tools Grid ─── */}
            <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.sectionHeaderRow}>
              <View style={[styles.sectionTag, { backgroundColor: "#0284C7" }]} />
              <Text style={styles.sectionHeading}>System & Operations</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>4 items</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.gridContainer}>
              {/* History */}
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => navigation.navigate("AttendanceHistory", {})}
                activeOpacity={0.8}
              >
                <View style={styles.bentoHeaderRow}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: "#F0FDFA" }]}>
                    <Ionicons name="reader-outline" size={19} color="#0D9488" />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={2}>Attendance Logs</Text>
                </View>
                <Text style={styles.bentoSubtitle} numberOfLines={3}>
                  Review full verification history, timestamps, and confidence scores.
                </Text>
              </TouchableOpacity>

              {/* Check-in Shortcut */}
              <TouchableOpacity
                style={[styles.bentoCard, styles.bentoCardHighlight]}
                onPress={() => navigation.navigate("AttendanceCheckIn" as any)}
                activeOpacity={0.8}
              >
                <View style={styles.bentoHeaderRow}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="camera" size={19} color="#2563EB" />
                  </View>
                  <Text style={[styles.bentoTitle, { color: "#2563EB" }]} numberOfLines={2}>Face Terminal</Text>
                </View>
                <Text style={styles.bentoSubtitle} numberOfLines={3}>
                  Launch AI camera scanner for instant contact-free face attendance.
                </Text>
              </TouchableOpacity>

              {/* IoT Devices */}
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => navigation.navigate("IoTDeviceList")}
                activeOpacity={0.8}
              >
                <View style={styles.bentoHeaderRow}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: "#EEF2FF" }]}>
                    <Ionicons name="hardware-chip-outline" size={19} color="#4F46E5" />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={2}>IoT Terminals</Text>
                </View>
                <Text style={styles.bentoSubtitle} numberOfLines={3}>
                  Monitor ESP32-CAM nodes, network health, IP endpoints, and status.
                </Text>
              </TouchableOpacity>

              {/* Reports */}
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => navigation.navigate("Reports")}
                activeOpacity={0.8}
              >
                <View style={styles.bentoHeaderRow}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: "#FFF1F2" }]}>
                    <Ionicons name="document-text-outline" size={19} color="#E11D48" />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={2}>Export Reports</Text>
                </View>
                <Text style={styles.bentoSubtitle} numberOfLines={3}>
                  Generate attendance sheets, payroll audits, and export to Excel or PDF.
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Helpful Guide Tip ─── */}
            <Animated.View entering={FadeInDown.delay(550).duration(600)}>
              <View style={styles.helpfulCard}>
                <View style={styles.helpfulIconWrap}>
                  <Ionicons name="bulb-outline" size={22} color="#D97706" />
                </View>
                <View style={styles.helpfulContent}>
                  <Text style={styles.helpfulTitle}>Helpful Tip</Text>
                  <Text style={styles.helpfulDesc}>
                    Face recognition works best when the ESP32 camera is positioned 1.4m - 1.6m high with balanced front lighting.
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* ─── Logout Button ─── */}
            <Animated.View entering={FadeInDown.delay(600).duration(600)}>
              <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Log Out of System</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footerWrap}>
              <Text style={styles.footerBrand}>HRMS Face Attendance • v1.0.0</Text>
              <Text style={styles.footerSubtitle}>ESP32-CAM Smart Facial Recognition</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  // ─── Top Header ───
  topHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  userBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userTextGroup: {
    flex: 1,
    marginRight: 14,
  },
  greetingLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  userNameText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap",
    gap: 7,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginRight: 5,
  },
  roleText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateChipText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  avatarButton: {
    position: "relative",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  liveIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  // ─── Main Content Canvas ───
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  // ─── Spotlight Card (Face Attendance Hero) ───
  heroCheckInCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E40AF",
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 18,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 14,
  },
  heroScannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroBadge: {
    backgroundColor: "#3B82F6",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 5,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#BFDBFE",
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  heroArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ─── Stats Row ───
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 136,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statPillBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  statMetricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginRight: 5,
  },
  statMetricUnit: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#64748B",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  statFootnoteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 5,
  },
  statProgressBarBg: {
    height: 4.5,
    borderRadius: 3,
    backgroundColor: "#F1F5F9",
    width: "100%",
    marginTop: 6,
    marginBottom: 4,
    overflow: "hidden",
  },
  statProgressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statFootnote: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },

  // ─── Quick Action Pill Row ───
  quickActionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  actionPillCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 96,
  },
  actionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  actionPillTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionPillSub: {
    fontSize: 11.5,
    color: "#64748B",
    lineHeight: 16,
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTag: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#2563EB",
    marginRight: 9,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  counterBadge: {
    marginLeft: 8,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },

  // ─── Bento Grid ───
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  bentoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 126,
  },
  bentoCardHighlight: {
    borderColor: "#93C5FD",
    backgroundColor: "#F8FAFC",
  },
  bentoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    minHeight: 38,
  },
  bentoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  bentoTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 18,
  },
  bentoSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    lineHeight: 16.5,
  },

  // ─── Helpful Card ───
  helpfulCard: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  helpfulIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 1,
  },
  helpfulContent: {
    flex: 1,
  },
  helpfulTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 3,
  },
  helpfulDesc: {
    fontSize: 13,
    color: "#B45309",
    lineHeight: 18,
  },

  // ─── Logout ───
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 20,
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },

  // ─── Footer ───
  footerWrap: {
    alignItems: "center",
    paddingBottom: 10,
  },
  footerBrand: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  footerSubtitle: {
    fontSize: 11.5,
    color: "#CBD5E1",
    marginTop: 2,
  },
});
