import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Platform,
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
  const [statsLoading, setStatsLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const isAdmin = user?.roles?.some((r) =>
    ["ADMIN", "ADMINISTRATOR", "HR"].includes(r.toUpperCase()),
  );

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
      setAttendanceRate(
        totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0,
      );
    } catch (error) {
      console.warn("Failed to load home stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ─── Top Header Card (Solid Modern Dark) ─── */}
          <View style={[styles.heroCard, { paddingTop: heroTopPadding }]}>
            <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.greetingText}>{getGreeting()},</Text>
                <Text style={styles.userName}>
                  {user?.fullName || user?.username || "Admin"}
                </Text>
                {user?.roles && user.roles.length > 0 && (
                  <View style={styles.roleBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#38BDF8" />
                    <Text style={styles.roleText}>{user.roles[0]}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={22} color="#38BDF8" />
                </View>
                <View style={styles.onlineStatus} />
              </TouchableOpacity>
            </Animated.View>

            {/* Date Banner */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.dateBanner}>
              <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
              <Text style={styles.dateText}>{dateStr}</Text>
            </Animated.View>

            {/* Quick Metrics (2 Solid Cards) */}
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: "#0369A1" }]}>
                  <Ionicons name="people" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricValue}>
                    {statsLoading ? "..." : employeeCount}
                  </Text>
                  <Text style={styles.metricLabel}>Employees</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: "#059669" }]}>
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricValue}>
                    {statsLoading ? "..." : `${attendanceRate.toFixed(1)}%`}
                  </Text>
                  <Text style={styles.metricLabel}>Attendance</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* ─── Main Body Content ─── */}
          <View style={styles.content}>
            {/* Primary Action: Dashboard */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("Dashboard")}
                activeOpacity={0.85}
              >
                <View style={[styles.actionIconBox, { backgroundColor: "#4F46E5" }]}>
                  <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionTextBox}>
                  <Text style={styles.actionTitle}>Dashboard</Text>
                  <Text style={styles.actionSubtitle}>View attendance analytics</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Primary Action: Employees */}
            <Animated.View entering={FadeInDown.delay(350).duration(600)}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("EmployeeList")}
                activeOpacity={0.85}
              >
                <View style={[styles.actionIconBox, { backgroundColor: "#0284C7" }]}>
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionTextBox}>
                  <Text style={styles.actionTitle}>Employees</Text>
                  <Text style={styles.actionSubtitle}>View & manage staff registry</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Management Grid (Admin only) ─── */}
            {isAdmin && (
              <>
                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.sectionHeader}>
                  <View style={styles.sectionTag} />
                  <Text style={styles.sectionTitle}>Management</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.gridRow}>
                  <TouchableOpacity
                    style={styles.gridCard}
                    onPress={() => navigation.navigate("DepartmentList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: "#1E3A8A" }]}>
                      <Ionicons name="business" size={20} color="#60A5FA" />
                    </View>
                    <Text style={styles.gridTitle}>Depts</Text>
                    <Text style={styles.gridSub}>Departments</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridCard}
                    onPress={() => navigation.navigate("ProductionLineList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: "#064E3B" }]}>
                      <Ionicons name="git-network" size={20} color="#34D399" />
                    </View>
                    <Text style={styles.gridTitle}>Lines</Text>
                    <Text style={styles.gridSub}>Production</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridCard}
                    onPress={() => navigation.navigate("ShiftList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: "#78350F" }]}>
                      <Ionicons name="time" size={20} color="#FBBF24" />
                    </View>
                    <Text style={styles.gridTitle}>Shifts</Text>
                    <Text style={styles.gridSub}>Scheduling</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridCard}
                    onPress={() => navigation.navigate("ShiftAssignmentList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: "#581C87" }]}>
                      <Ionicons name="calendar" size={20} color="#C084FC" />
                    </View>
                    <Text style={styles.gridTitle}>Assigns</Text>
                    <Text style={styles.gridSub}>Shift Assignments</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* ─── System Grid ─── */}
            <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.sectionHeader}>
              <View style={[styles.sectionTag, { backgroundColor: "#38BDF8" }]} />
              <Text style={styles.sectionTitle}>System</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.gridRow}>
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("AttendanceHistory", {})}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIcon, { backgroundColor: "#065F46" }]}>
                  <Ionicons name="list" size={20} color="#34D399" />
                </View>
                <Text style={styles.gridTitle}>History</Text>
                <Text style={styles.gridSub}>Attendance</Text>
              </TouchableOpacity>

              {/* Check-in Card (Prominent Accent Border) */}
              <TouchableOpacity
                style={[styles.gridCard, styles.checkInHighlightCard]}
                onPress={() => navigation.navigate("AttendanceCheckIn" as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIcon, { backgroundColor: "#0369A1" }]}>
                  <Ionicons name="scan" size={20} color="#38BDF8" />
                </View>
                <Text style={[styles.gridTitle, { color: "#38BDF8" }]}>Check-in</Text>
                <Text style={styles.gridSub}>Face Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("IoTDeviceList")}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIcon, { backgroundColor: "#4338CA" }]}>
                  <Ionicons name="hardware-chip" size={20} color="#818CF8" />
                </View>
                <Text style={styles.gridTitle}>IoT</Text>
                <Text style={styles.gridSub}>Devices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("Reports")}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIcon, { backgroundColor: "#831843" }]}>
                  <Ionicons name="document-text" size={20} color="#F472B6" />
                </View>
                <Text style={styles.gridTitle}>Reports</Text>
                <Text style={styles.gridSub}>Analytics + Export</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Logout Card */}
            <Animated.View entering={FadeInDown.delay(600).duration(600)}>
              <TouchableOpacity style={styles.logoutCard} onPress={logout} activeOpacity={0.85}>
                <View style={styles.logoutIcon}>
                  <Ionicons name="log-out" size={20} color="#EF4444" />
                </View>
                <View style={styles.logoutTextWrap}>
                  <Text style={styles.logoutTitle}>Logout</Text>
                  <Text style={styles.logoutSub}>Sign out securely</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#EF4444" />
              </TouchableOpacity>
            </Animated.View>

            {/* Quick Tips Card */}
            <Animated.View entering={FadeInDown.delay(650).duration(600)}>
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <View style={styles.tipsIcon}>
                    <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                  </View>
                  <Text style={styles.tipsTitle}>Quick Tips</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Use face recognition for faster attendance check-in
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Create departments before adding production lines
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Pull down to refresh on any list screen
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>HRMS Face Attendance v1.0</Text>
              <Text style={styles.footerSub}>Smart Workforce Management</Text>
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
    backgroundColor: "#0B0F19", // Solid deep dark background
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  // ─── Hero Card ───
  heroCard: {
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {},
  greetingText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 5,
  },
  roleText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileButton: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1F2937",
    borderWidth: 1.5,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineStatus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#111827",
  },
  dateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },

  // ─── Metrics Row (2 solid cards) ───
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  metricTextGroup: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  metricLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 1,
  },

  // ─── Main Content ───
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  // ─── Primary Action Cards ───
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  actionArrow: {
    paddingLeft: 8,
  },

  // ─── Section Header ───
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 12,
    gap: 8,
  },
  sectionTag: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#6366F1",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ─── Grid (2x2 Cards) ───
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  checkInHighlightCard: {
    borderColor: "#0284C7",
    backgroundColor: "#0F1E36",
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  gridSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },

  // ─── Logout Card ───
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoutTextWrap: {
    flex: 1,
  },
  logoutTitle: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  logoutSub: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 1,
  },

  // ─── Quick Tips ───
  tipsCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  tipsIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#38BDF8",
    marginTop: 6,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },

  // ─── Footer ───
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  footerSub: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
});
