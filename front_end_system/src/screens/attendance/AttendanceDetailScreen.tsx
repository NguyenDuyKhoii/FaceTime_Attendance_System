/**
 * FILE: src/screens/AttendanceDetailScreen.tsx
 * MỤC ĐÍCH: Hiển thị chi tiết một bản ghi chấm công
 * - Employee info, work date, check-in/out times
 * - Status, late minutes, total hours
 * - Source (Face Recognition, IoT, Manual), confidence score
 */

import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
import Animated, { FadeInUp } from "react-native-reanimated";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";
import { attendanceService } from "../../service/attendance.service";
import {
  AttendanceDetailDto,
  UpdateAttendancePayload,
} from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AttendanceDetail">;

export function AttendanceDetailScreen({ navigation, route }: Props) {
  const { recordId } = route.params;
  const { user } = useAuth();
  const [detail, setDetail] = useState<AttendanceDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    checkInTime: "",
    checkOutTime: "",
    note: "",
  });
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const canEditAttendance =
    user?.roles?.some((role) =>
      ["Admin", "HR", "Administrator"].includes(role),
    ) || false;

  const toInputDateTime = (value?: string): string => {
    if (!value) return "";
    const normalized = value.replace("T", " ");
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
  };

  const resetFormFromDetail = (nextDetail: AttendanceDetailDto) => {
    setForm({
      checkInTime: toInputDateTime(nextDetail.checkInTime),
      checkOutTime: toInputDateTime(nextDetail.checkOutTime),
      note: nextDetail.note || "",
    });
  };

  const parseDateTimeInput = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const normalized = trimmed.replace(" ", "T");
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid datetime format. Use YYYY-MM-DD HH:mm");
    }

    return parsed.toISOString();
  };

  useEffect(() => {
    loadAttendanceDetail();
  }, []);

  const loadAttendanceDetail = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendanceDetail(recordId);
      setDetail(data);
      resetFormFromDetail(data);
      navigation.setOptions({ title: data.employeeName });
    } catch (error: any) {
      console.error("Failed to load attendance detail:", error);
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Unable to load attendance detail",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    if (!detail) return;
    resetFormFromDetail(detail);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (detail) {
      resetFormFromDetail(detail);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!detail) return;

    try {
      setSaving(true);

      const payload: UpdateAttendancePayload = {
        note: form.note.trim() || undefined,
        checkInTime: parseDateTimeInput(form.checkInTime),
        checkOutTime: parseDateTimeInput(form.checkOutTime),
      };

      if (payload.checkInTime && payload.checkOutTime) {
        if (new Date(payload.checkOutTime) < new Date(payload.checkInTime)) {
          throw new Error(
            "Check-out time must be greater than or equal to check-in time",
          );
        }
      }

      await attendanceService.updateAttendance(detail.id, payload);
      setAlert({
        visible: true,
        title: "Success",
        message: "Attendance record updated successfully",
        type: "success",
      });
      setIsEditing(false);
      await loadAttendanceDetail();
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Unable to update record",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No data found</Text>
      </View>
    );
  }

  const statusColor = attendanceService.getStatusColor(detail.status);
  const statusLabel = attendanceService.getStatusLabel(detail.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* STATUS HEADER */}
        <Animated.View entering={FadeInUp}>
          <LinearGradient
            colors={[statusColor, statusColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusHeader}
          >
            <View style={styles.statusBadge}>
              <Ionicons
                name={getStatusIcon(detail.status)}
                size={40}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.statusText}>{statusLabel}</Text>
            <Text style={styles.workDateText}>
              {attendanceService.formatDate(detail.workDate)}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* EMPLOYEE INFO */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <InfoSection title="Employee Information">
            <InfoRow label="Employee Name" value={detail.employeeName} />
          </InfoSection>
        </Animated.View>

        {/* CHECK-IN/OUT TIMES */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <InfoSection title="Time Details">
            <InfoRow
              label="Check-in"
              value={
                detail.checkInTime
                  ? attendanceService.formatTime(detail.checkInTime)
                  : "No data"
              }
              icon="log-in"
              color="#10B981"
            />
            {detail.checkOutTime ? (
              <InfoRow
                label="Check-out"
                value={attendanceService.formatTime(detail.checkOutTime)}
                icon="log-out"
                color="#3B82F6"
              />
            ) : (
              <InfoRow
                label="Check-out"
                value="Not checked out"
                icon="time"
                color="#F59E0B"
              />
            )}
            <InfoRow
              label="Total Hours"
              value={`${detail.totalHours.toFixed(1)} hours`}
              icon="checkmark-circle"
              color="#8B5CF6"
            />
          </InfoSection>
        </Animated.View>

        {/* ATTENDANCE METRICS */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <InfoSection title="Attendance Details">
            {detail.lateMinutes > 0 && (
              <InfoRow
                label="Late"
                value={`${detail.lateMinutes} min`}
                icon="warning"
                color="#F59E0B"
              />
            )}
            <InfoRow
              label="Source"
              value={getSourceLabel(detail.source)}
              icon="camera"
              color="#6B7280"
            />
            {detail.confidenceScore !== undefined && (
              <InfoRow
                label="Confidence"
                value={`${(detail.confidenceScore * 100).toFixed(1)}%`}
                icon="shield-checkmark"
                color="#10B981"
              />
            )}
            <InfoRow
              label="Note"
              value={detail.note?.trim() || "None"}
              icon="document-text"
              color="#6B7280"
            />
          </InfoSection>
        </Animated.View>

        {canEditAttendance && (
          <Animated.View entering={FadeInUp.delay(350)}>
            <InfoSection title="Edit Record">
              {!isEditing ? (
                <View style={styles.editActionsSingle}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleStartEdit}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.editFormContainer}>
                  <Text style={styles.inputLabel}>
                    Check-in (YYYY-MM-DD HH:mm)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.checkInTime}
                    onChangeText={(value) =>
                      setForm((prev) => ({ ...prev, checkInTime: value }))
                    }
                    placeholder="2026-03-10 08:00"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>
                    Check-out (YYYY-MM-DD HH:mm)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.checkOutTime}
                    onChangeText={(value) =>
                      setForm((prev) => ({ ...prev, checkOutTime: value }))
                    }
                    placeholder="2026-03-10 17:00"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Note</Text>
                  <TextInput
                    style={[styles.input, styles.noteInput]}
                    value={form.note}
                    onChangeText={(value) =>
                      setForm((prev) => ({ ...prev, note: value }))
                    }
                    placeholder="Enter note if needed"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />

                  <View style={styles.editActionsRow}>
                    <TouchableOpacity
                      style={[styles.formButton, styles.cancelButton]}
                      onPress={handleCancelEdit}
                      disabled={saving}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.formButton, styles.saveButton]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </InfoSection>
          </Animated.View>
        )}

        {/* EXTRAS */}
        <View style={styles.spacer} />
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

// ===== COMPONENTS & HELPERS =====

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

function InfoRow({ label, value, icon, color = "#6B7280" }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={18}
          color={color}
          style={styles.infoIcon}
        />
      )}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function getStatusIcon(
  status:
    | "OnTime"
    | "Late"
    | "EarlyLeave"
    | "Absent"
    | "OnLeave"
    | "SickLeave"
    | "Present"
    | "ExceptionPending",
): any {
  switch (status) {
    case "OnTime":
    case "Present":
      return "checkmark-circle";
    case "Late":
      return "warning";
    case "EarlyLeave":
      return "log-out";
    case "Absent":
      return "close-circle";
    case "OnLeave":
      return "calendar";
    case "SickLeave":
      return "medkit";
    case "ExceptionPending":
      return "help-circle";
    default:
      return "help-circle";
  }
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    FaceRecognition: "Face Recognition",
    IoTDevice: "IoT Device",
    Manual: "Manual",
    Import: "Import",
    MobileApp: "Mobile App",
  };
  return labels[source] || source;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },

  // STATUS HEADER
  statusHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusBadge: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  workDateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  // SECTIONS
  section: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },

  // INFO ROW
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoIcon: {
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },

  editActionsSingle: {
    padding: 16,
  },
  editButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  editFormContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    color: "#1F2937",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  formButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#10B981",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  spacer: {
    height: 16,
  },
});
