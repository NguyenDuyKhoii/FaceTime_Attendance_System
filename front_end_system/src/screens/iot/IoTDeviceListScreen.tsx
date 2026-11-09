import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import CustomAlert from "../../components/CustomAlert";
import { iotService } from "../../service/iot.service";
import { IoTDeviceMonitoringDto } from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "IoTDeviceList">;

export function IoTDeviceListScreen({ navigation }: Props) {
  const [devices, setDevices] = useState<IoTDeviceMonitoringDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingDeviceId, setCheckingDeviceId] = useState<number | null>(null);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const loadDevices = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await iotService.getDevices();
      setDevices(data);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load devices";
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

  useFocusEffect(
    useCallback(() => {
      loadDevices();

      const interval = setInterval(() => {
        loadDevices(false);
      }, 30000);

      return () => clearInterval(interval);
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDevices(false);
  };

  const getStatusColor = (status: string) =>
    status?.toLowerCase() === "online" ? "#4FACFE" : "#ff4d4d";

  const formatHeartbeat = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
  };

  const handleCheckDeviceStatus = async (deviceId: number) => {
    try {
      setCheckingDeviceId(deviceId);
      const data = await iotService.getDeviceStatus(deviceId);
      setAlert({
        visible: true,
        title: `Device #${data.deviceId}`,
        message: `Status: ${data.status}\nLast heartbeat: ${formatHeartbeat(data.lastHeartbeat)}`,
        type: data.status?.toLowerCase() === "online" ? "success" : "info",
        onConfirm: undefined,
      });
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to check device status",
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setCheckingDeviceId(null);
    }
  };

  const renderItem = ({ item }: { item: IoTDeviceMonitoringDto }) => {
    const isOnline = item.status?.toLowerCase() === "online";
    const statusIndicatorColor = getStatusColor(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={
                isOnline ? ["#4FACFE", "#00F2FE"] : ["#ff9966", "#ff5e62"]
              }
              style={styles.iconGradient}
            >
              <Ionicons name="hardware-chip-outline" size={26} color="white" />
            </LinearGradient>
            {isOnline && <View style={styles.onlineBadge} />}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.deviceName} numberOfLines={1}>
              Device #{item.deviceId}
            </Text>
            <Text style={styles.deviceType}>ESP32 Camera</Text>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                {item.location || "Unknown location"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                Last heartbeat: {formatHeartbeat(item.lastHeartbeat)}
              </Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusIndicatorColor },
              ]}
            />
            <Text style={[styles.statusText, { color: statusIndicatorColor }]}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>

            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => handleCheckDeviceStatus(item.deviceId)}
              disabled={checkingDeviceId === item.deviceId}
            >
              <Text style={styles.statusButtonText}>
                {checkingDeviceId === item.deviceId ? "..." : "Check"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
            <Text style={styles.title}>IoT Ecosystem</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddIoTDevice")}
            >
              <LinearGradient
                colors={["#00F2FE", "#4FACFE"]}
                style={styles.addGradient}
              >
                <Ionicons name="add" size={26} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FACFE" />
            <Text style={styles.loadingText}>Synchronizing nodes...</Text>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.deviceId.toString()}
            renderItem={renderItem}
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
                <Ionicons
                  name="hardware-chip-outline"
                  size={80}
                  color="#E0E0E0"
                />
                <Text style={styles.emptyText}>No devices detected</Text>
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
    paddingBottom: 50,
  },
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
  iconContainer: {
    position: "relative",
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4FACFE",
    borderWidth: 3,
    borderColor: "white",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 18,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    color: "#4FACFE",
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  ipRow: {
    marginTop: 2,
  },
  ipText: {
    fontSize: 11,
    color: "#4FACFE",
    fontWeight: "600",
    backgroundColor: "rgba(79, 172, 254, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusContainer: {
    alignItems: "center",
    minWidth: 70,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  statusButton: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8E6FA",
    backgroundColor: "#F3F9FF",
  },
  statusButtonText: {
    fontSize: 11,
    color: "#2A7FD0",
    fontWeight: "700",
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
});
