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
    (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 10;

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
                  <Ionicons name="person" size={22} color="#2563EB" />
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
                    <Ionicons name="scan" size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.heroTextWrap}>
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>LIVE CAMERA</Text>
                    </View>
                    <Text style={styles.heroTitle}>Face Attendance</Text>
                    <Text style={styles.heroSubtitle}>
                      Chạm để mở camera nhận diện khuôn mặt
                    </Text>
                  </View>
                </View>
                <View style={styles.heroArrowBtn}>
                  <Ionicons name="arrow-forward" size={18} color="#2563EB" />
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
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </View>
                <Text style={styles.statNumber}>
                  {statsLoading ? "--" : employeeCount}
                </Text>
                <Text style={styles.statLabel}>Nhân viên</Text>
                <Text style={styles.statFootnote}>Hồ sơ đăng ký</Text>
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
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </View>
                <Text style={[styles.statNumber, { color: "#059669" }]}>
                  {statsLoading ? "--%" : `${attendanceRate.toFixed(0)}%`}
                </Text>
                <Text style={styles.statLabel}>Có mặt hôm nay</Text>
                <Text style={styles.statFootnote}>
                  {presentCount}/{employeeCount} nhân sự
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
                <View style={[styles.actionPillIcon, { backgroundColor: "#F3E8FF" }]}>
                  <Ionicons name="stats-chart" size={20} color="#7C3AED" />
                </View>
                <View style={styles.actionPillTextGroup}>
                  <Text style={styles.actionPillTitle}>Thống Kê</Text>
                  <Text style={styles.actionPillSub}>Analytics</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPillCard}
                onPress={() => navigation.navigate("EmployeeList")}
                activeOpacity={0.85}
              >
                <View style={[styles.actionPillIcon, { backgroundColor: "#E0F2FE" }]}>
                  <Ionicons name="finger-print" size={20} color="#0284C7" />
                </View>
                <View style={styles.actionPillTextGroup}>
                  <Text style={styles.actionPillTitle}>Nhân Viên</Text>
                  <Text style={styles.actionPillSub}>Face Enroll</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Management Grid (Admin only) ─── */}
            {isAdmin && (
              <>
                <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTag} />
                  <Text style={styles.sectionHeading}>Quản Lý Nhân Sự & Ca</Text>
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>4 mục</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.gridContainer}>
                  {/* Departments */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("DepartmentList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bentoIconWrap, { backgroundColor: "#EFF6FF" }]}>
                      <Ionicons name="business" size={22} color="#2563EB" />
                    </View>
                    <Text style={styles.bentoTitle}>Phòng Ban</Text>
                    <Text style={styles.bentoSubtitle}>Sơ đồ tổ chức</Text>
                  </TouchableOpacity>

                  {/* Production Lines */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("ProductionLineList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bentoIconWrap, { backgroundColor: "#ECFDF5" }]}>
                      <Ionicons name="git-network" size={22} color="#059669" />
                    </View>
                    <Text style={styles.bentoTitle}>Dây Chuyền</Text>
                    <Text style={styles.bentoSubtitle}>Khu vực làm việc</Text>
                  </TouchableOpacity>

                  {/* Shifts */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("ShiftList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bentoIconWrap, { backgroundColor: "#FFFBEB" }]}>
                      <Ionicons name="time" size={22} color="#D97706" />
                    </View>
                    <Text style={styles.bentoTitle}>Ca Làm Việc</Text>
                    <Text style={styles.bentoSubtitle}>Khung giờ chuẩn</Text>
                  </TouchableOpacity>

                  {/* Shift Assignments */}
                  <TouchableOpacity
                    style={styles.bentoCard}
                    onPress={() => navigation.navigate("ShiftAssignmentList")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bentoIconWrap, { backgroundColor: "#FAF5FF" }]}>
                      <Ionicons name="calendar" size={22} color="#7C3AED" />
                    </View>
                    <Text style={styles.bentoTitle}>Phân Ca</Text>
                    <Text style={styles.bentoSubtitle}>Lịch trực nhân viên</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* ─── System & Tools Grid ─── */}
            <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.sectionHeaderRow}>
              <View style={[styles.sectionTag, { backgroundColor: "#0284C7" }]} />
              <Text style={styles.sectionHeading}>Hệ Thống & Báo Cáo</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>4 mục</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.gridContainer}>
              {/* History */}
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => navigation.navigate("AttendanceHistory", {})}
                activeOpacity={0.8}
              >
                <View style={[styles.bentoIconWrap, { backgroundColor: "#F0FDFA" }]}>
                  <Ionicons name="reader-outline" size={22} color="#0D9488" />
                </View>
                <Text style={styles.bentoTitle}>Lịch Sử</Text>
                <Text style={styles.bentoSubtitle}>Nhật ký check-in</Text>
              </TouchableOpacity>

              {/* Check-in Shortcut */}
              <TouchableOpacity
                style={[styles.bentoCard, styles.bentoCardHighlight]}
                onPress={() => navigation.navigate("AttendanceCheckIn" as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.bentoIconWrap, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="camera" size={22} color="#2563EB" />
                </View>
                <Text style={[styles.bentoTitle, { color: "#2563EB" }]}>Điểm Danh</Text>
                <Text style={styles.bentoSubtitle}>Camera AI</Text>
              </TouchableOpacity>

              {/* IoT Devices */}
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => navigation.navigate("IoTDeviceList")}
                activeOpacity={0.8}
              >
                <View style={[styles.bentoIconWrap, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="hardware-chip-outline" size={22} color="#4F46E5" />
                </View>
                <Text style={styles.bentoTitle}>Thiết Bị</Text>
                <Text style={styles.bentoSubtitle}>Camera ESP32</Text>
              </TouchableOpacity>

              {/* Reports */}
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => navigation.navigate("Reports")}
                activeOpacity={0.8}
              >
                <View style={[styles.bentoIconWrap, { backgroundColor: "#FFF1F2" }]}>
                  <Ionicons name="document-text-outline" size={22} color="#E11D48" />
                </View>
                <Text style={styles.bentoTitle}>Báo Cáo</Text>
                <Text style={styles.bentoSubtitle}>Xuất Excel & PDF</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── Helpful Guide Tip ─── */}
            <Animated.View entering={FadeInDown.delay(550).duration(600)}>
              <View style={styles.helpfulCard}>
                <View style={styles.helpfulIconWrap}>
                  <Ionicons name="bulb-outline" size={20} color="#D97706" />
                </View>
                <View style={styles.helpfulContent}>
                  <Text style={styles.helpfulTitle}>Mẹo Sử Dụng</Text>
                  <Text style={styles.helpfulDesc}>
                    Chấm công khuôn mặt hoạt động tốt nhất khi camera được đặt ở độ cao 1.4m - 1.6m và đủ ánh sáng trực diện.
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* ─── Logout Button ─── */}
            <Animated.View entering={FadeInDown.delay(600).duration(600)}>
              <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Đăng xuất khỏi hệ thống</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footerWrap}>
              <Text style={styles.footerBrand}>HRMS Face Attendance • v1.0.0</Text>
              <Text style={styles.footerSubtitle}>Hệ thống chấm công khuôn mặt ESP32-CAM</Text>
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
    backgroundColor: "#F8FAFC", // Ultra clean, modern off-white slate background
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  // ─── Top Header ───
  topHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  userNameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap",
    gap: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateChipText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  avatarButton: {
    position: "relative",
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  // ─── Main Content Canvas ───
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  // ─── Spotlight Card (Face Attendance Hero) ───
  heroCheckInCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E40AF", // Confident Solid Royal Blue
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
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
    marginRight: 12,
  },
  heroScannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroBadge: {
    backgroundColor: "#3B82F6",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#BFDBFE",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  heroArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginTop: 2,
  },
  statFootnote: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },

  // ─── Quick Action Pill Row ───
  quickActionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  actionPillCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionPillIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionPillTextGroup: {
    flex: 1,
  },
  actionPillTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionPillSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTag: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#2563EB",
    marginRight: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  counterBadge: {
    marginLeft: 8,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },

  // ─── Bento Grid ───
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  bentoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bentoCardHighlight: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFC",
  },
  bentoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  bentoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  bentoSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  // ─── Helpful Card ───
  helpfulCard: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 14,
    alignItems: "flex-start",
  },
  helpfulIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  helpfulContent: {
    flex: 1,
  },
  helpfulTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  helpfulDesc: {
    fontSize: 12,
    color: "#B45309",
    lineHeight: 17,
  },

  // ─── Logout ───
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 20,
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },

  // ─── Footer ───
  footerWrap: {
    alignItems: "center",
    paddingBottom: 10,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  footerSubtitle: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
  },
});
