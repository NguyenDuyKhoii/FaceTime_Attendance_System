import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
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
    (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 16;

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
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1A1A2E"
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ─── Hero Header with Gradient ─── */}
          <LinearGradient
            colors={["#1A1A2E", "#16213E", "#0F3460"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroGradient, { paddingTop: heroTopPadding }]}
          >
            <Animated.View
              entering={FadeInUp.duration(800)}
              style={styles.header}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.greetingText}>{getGreeting()},</Text>
                <Text style={styles.userName}>
                  {user?.fullName || user?.username || "Admin"}
                </Text>
                {user?.roles && user.roles.length > 0 && (
                  <View style={styles.roleBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={10}
                      color="#4FACFE"
                    />
                    <Text style={styles.roleText}>{user.roles[0]}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.profileButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#4FACFE", "#00F2FE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Ionicons name="person" size={24} color="white" />
                </LinearGradient>
                <View style={styles.onlineStatus} />
              </TouchableOpacity>
            </Animated.View>

            {/* Date Banner */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={styles.dateBanner}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={styles.dateText}>{dateStr}</Text>
            </Animated.View>

            {/* Quick Stats inside hero */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(800)}
              style={styles.statsRow}
            >
              <View style={styles.statBox}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: "rgba(79, 172, 254, 0.2)" },
                  ]}
                >
                  <Ionicons name="people" size={18} color="#4FACFE" />
                </View>
                <View>
                  <Text style={styles.statValue}>
                    {statsLoading ? "..." : employeeCount}
                  </Text>
                  <Text style={styles.statName}>Employees</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: "rgba(0, 242, 254, 0.2)" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#00F2FE" />
                </View>
                <View>
                  <Text style={styles.statValue}>
                    {statsLoading ? "..." : `${attendanceRate.toFixed(1)}%`}
                  </Text>
                  <Text style={styles.statName}>Attendance</Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>

          <View style={styles.content}>
            {/* ─── Primary Action: Employees ─── */}
            <Animated.View entering={FadeInDown.delay(400).duration(800)}>
              <TouchableOpacity
                style={styles.primaryCard}
                onPress={() => navigation.navigate("Dashboard")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#667EEA", "#764BA2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <View style={styles.primaryIconWrap}>
                    <Ionicons name="stats-chart" size={28} color="white" />
                  </View>
                  <View style={styles.primaryTextWrap}>
                    <Text style={styles.primaryTitle}>Dashboard</Text>
                    <Text style={styles.primaryDesc}>
                      View attendance analytics
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Primary Action: Employees ─── */}
            <Animated.View entering={FadeInDown.delay(500).duration(800)}>
              <TouchableOpacity
                style={styles.primaryCard}
                onPress={() => navigation.navigate("EmployeeList")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#4FACFE", "#00F2FE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <View style={styles.primaryIconWrap}>
                    <Ionicons name="people" size={28} color="white" />
                  </View>
                  <View style={styles.primaryTextWrap}>
                    <Text style={styles.primaryTitle}>Employees</Text>
                    <Text style={styles.primaryDesc}>
                      View & manage staff registry
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Management (Admin only) ─── */}
            {isAdmin && (
              <>
                <Animated.View entering={FadeInDown.delay(600).duration(800)}>
                  <Text style={styles.sectionTitle}>Management</Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(700).duration(800)}
                  style={styles.compactRow}
                >
                  <TouchableOpacity
                    style={styles.compactCard}
                    onPress={() => navigation.navigate("DepartmentList")}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.compactIcon,
                        { backgroundColor: "rgba(79, 172, 254, 0.1)" },
                      ]}
                    >
                      <Ionicons name="business" size={22} color="#4FACFE" />
                    </View>
                    <Text style={styles.compactTitle}>Depts</Text>
                    <Text style={styles.compactSub}>Departments</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.compactCard}
                    onPress={() => navigation.navigate("ProductionLineList")}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.compactIcon,
                        { backgroundColor: "rgba(0, 200, 150, 0.1)" },
                      ]}
                    >
                      <Ionicons name="git-network" size={22} color="#00C896" />
                    </View>
                    <Text style={styles.compactTitle}>Lines</Text>
                    <Text style={styles.compactSub}>Production</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.compactCard}
                    onPress={() => navigation.navigate("ShiftList")}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.compactIcon,
                        { backgroundColor: "rgba(255, 152, 0, 0.1)" },
                      ]}
                    >
                      <Ionicons name="time" size={22} color="#FF9800" />
                    </View>
                    <Text style={styles.compactTitle}>Shifts</Text>
                    <Text style={styles.compactSub}>Scheduling</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.compactCard}
                    onPress={() => navigation.navigate("ShiftAssignmentList")}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.compactIcon,
                        { backgroundColor: "rgba(118, 75, 162, 0.1)" },
                      ]}
                    >
                      <Ionicons name="calendar" size={22} color="#764BA2" />
                    </View>
                    <Text style={styles.compactTitle}>Assigns</Text>
                    <Text style={styles.compactSub}>Shift Assignments</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* ─── System ─── */}
            <Animated.View entering={FadeInDown.delay(800).duration(800)}>
              <Text style={styles.sectionTitle}>System</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(900).duration(800)}
              style={styles.compactRow}
            >
              <TouchableOpacity
                style={styles.compactCard}
                onPress={() => navigation.navigate("AttendanceHistory", {})}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.compactIcon,
                    { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                  ]}
                >
                  <Ionicons name="list" size={22} color="#10B981" />
                </View>
                <Text style={styles.compactTitle}>History</Text>
                <Text style={styles.compactSub}>Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactCard}
                onPress={() => navigation.navigate("AttendanceCheckIn" as any)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.compactIcon,
                    { backgroundColor: "rgba(102, 126, 234, 0.1)" },
                  ]}
                >
                  <Ionicons name="scan" size={22} color="#667EEA" />
                </View>
                <Text style={styles.compactTitle}>Check-in</Text>
                <Text style={styles.compactSub}>Face Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactCard}
                onPress={() => navigation.navigate("IoTDeviceList")}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.compactIcon,
                    { backgroundColor: "rgba(75, 121, 161, 0.1)" },
                  ]}
                >
                  <Ionicons name="hardware-chip" size={22} color="#4B79A1" />
                </View>
                <Text style={styles.compactTitle}>IoT</Text>
                <Text style={styles.compactSub}>Devices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactCard}
                onPress={() => navigation.navigate("Reports")}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.compactIcon,
                    { backgroundColor: "rgba(79, 172, 254, 0.12)" },
                  ]}
                >
                  <Ionicons name="document-text" size={22} color="#4FACFE" />
                </View>
                <Text style={styles.compactTitle}>Reports</Text>
                <Text style={styles.compactSub}>Analytics + Export</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutCard}
                onPress={logout}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.compactIcon,
                    {
                      backgroundColor: "rgba(255, 77, 77, 0.1)",
                      marginBottom: 0,
                      marginRight: 15,
                    },
                  ]}
                >
                  <Ionicons name="log-out" size={22} color="#FF4D4D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.compactTitle, { color: "#FF4D4D" }]}>
                    Logout
                  </Text>
                  <Text style={styles.compactSub}>Sign out securely</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255, 77, 77, 0.5)"
                />
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Quick Tips Card ─── */}
            <Animated.View entering={FadeInDown.delay(1000).duration(800)}>
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <View style={styles.tipsIconWrap}>
                    <Ionicons name="bulb" size={18} color="#FF9800" />
                  </View>
                  <Text style={styles.tipsTitle}>Quick Tips</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>
                    Use face recognition for faster attendance check-in
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>
                    Create departments before adding production lines
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>
                    Pull down to refresh on any list screen
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInDown.delay(1100).duration(800)}
              style={styles.footer}
            >
              <Text style={styles.footerText}>HRMS Face Attendance v1.0</Text>
              <Text style={styles.footerSub}>Smart Workforce Management</Text>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ─── Hero Gradient ───
  heroGradient: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  // ─── Header ───
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {},
  greetingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  userName: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 172, 254, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 4,
  },
  roleText: {
    color: "#4FACFE",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileButton: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  onlineStatus: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#00E676",
    borderWidth: 2.5,
    borderColor: "#16213E",
  },

  // ─── Date Banner ───
  dateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "500",
  },

  // ─── Stats (inside hero) ───
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  statName: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 6,
  },

  // ─── Content (below hero) ───
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },

  // ─── Section Title ───
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A", // Darker for better visibility
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 15,
  },

  // ─── Primary Card ───
  primaryCard: {
    marginBottom: 22,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 22,
  },
  primaryIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  primaryTextWrap: {
    flex: 1,
  },
  primaryTitle: {
    color: "white",
    fontSize: 19,
    fontWeight: "bold",
  },
  primaryDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 3,
  },

  // ─── Compact Cards (2-column grids) ───
  compactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  compactCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  logoutCard: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.15)",
    shadowColor: "#FF4D4D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  compactIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  compactSub: {
    fontSize: 10,
    fontWeight: "500",
    color: "#BBB",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ─── Tips Card ───
  tipsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  tipsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4FACFE",
    marginTop: 5,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#777",
    lineHeight: 18,
  },

  // ─── Footer ───
  footer: {
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CCC",
  },
  footerSub: {
    fontSize: 11,
    color: "#DDD",
    marginTop: 2,
  },
});
