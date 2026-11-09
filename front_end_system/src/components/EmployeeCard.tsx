import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Employee } from "../types/api.types";

interface EmployeeCardProps {
  employee: Employee;
  onPress?: (employee: Employee) => void;
  onEnrollFace?: (employee: Employee) => void;
}

export default function EmployeeCard({
  employee,
  onPress,
  onEnrollFace,
}: EmployeeCardProps) {
  const statusColor = employee.isActive ? "#00F2FE" : "#9E9E9E";

  return (
    <Animated.View entering={FadeInRight.duration(500)}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress?.(employee)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#4FACFE", "#00F2FE"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {employee.fullName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>
                {employee.fullName}
              </Text>
              <Text style={styles.code}>{employee.employeeCode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={14} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {employee.email || "No email"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                Joined: {new Date(employee.hireDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => onEnrollFace?.(employee)}
          >
            <LinearGradient
              colors={["#00F2FE", "#4FACFE"]}
              style={styles.enrollGradient}
            >
              <Ionicons name="scan-outline" size={22} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "white",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
  },
  code: {
    fontSize: 11,
    color: "#4FACFE",
    fontWeight: "700",
    backgroundColor: "rgba(79, 172, 254, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  enrollButton: {
    marginLeft: 12,
  },
  enrollGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#00F2FE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});
