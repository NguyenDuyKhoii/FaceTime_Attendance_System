import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
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
import { Department, departmentApi } from "../../api/department.api";
import { productionLineApi } from "../../api/productionLine.api";
import CustomAlert from "../../components/CustomAlert";
import { ProductionLine } from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "ProductionLineList">;
const SUPPORTS_PRODUCTION_LINE_MUTATIONS = false;

export function ProductionLineListScreen({ navigation }: Props) {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [actionVisible, setActionVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [linesData, deptsData] = await Promise.all([
        productionLineApi.getProductionLines(),
        departmentApi.getDepartments(),
      ]);
      setLines(linesData);
      setDepartments(deptsData);
    } catch (error: any) {
      console.error("Error loading production lines:", error);
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Failed to load production lines",
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData(false);
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const openActions = (line: ProductionLine) => {
    setSelectedLine(line);
    setActionVisible(true);
  };

  const closeActions = () => {
    if (deletingId) return;
    setActionVisible(false);
    setSelectedLine(null);
  };

  const closeDeleteConfirm = () => {
    if (deletingId) return;
    setDeleteConfirmVisible(false);
    setSelectedLine(null);
  };

  const onEditLine = () => {
    if (!selectedLine) return;

    if (!SUPPORTS_PRODUCTION_LINE_MUTATIONS) {
      closeActions();
      setAlert({
        visible: true,
        title: "Unsupported",
        message:
          "BE hien tai chua ho tro API sua Production Line (PUT /api/ProductionLines/{id}).",
        type: "info",
        onConfirm: undefined,
      });
      return;
    }

    const lineToEdit = selectedLine;
    closeActions();
    navigation.navigate("AddProductionLine", {
      productionLine: {
        id: lineToEdit.id,
        lineName: lineToEdit.lineName,
        departmentId: lineToEdit.departmentId,
        status: lineToEdit.status,
        capacity: lineToEdit.capacity,
        machineCount: lineToEdit.machineCount,
      },
    });
  };

  const onDeleteLine = () => {
    if (!selectedLine || deletingId) return;

    if (!SUPPORTS_PRODUCTION_LINE_MUTATIONS) {
      closeActions();
      setAlert({
        visible: true,
        title: "Unsupported",
        message:
          "BE hien tai chua ho tro API xoa Production Line (DELETE /api/ProductionLines/{id}).",
        type: "info",
        onConfirm: undefined,
      });
      return;
    }

    setActionVisible(false);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteLine = async () => {
    if (!selectedLine || deletingId) return;

    try {
      setDeletingId(selectedLine.id);
      await productionLineApi.deleteProductionLine(selectedLine.id);
      setLines((prev) => prev.filter((line) => line.id !== selectedLine.id));
      setDeleteConfirmVisible(false);
      setSelectedLine(null);
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Failed to delete production line",
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getDeptName = (deptId: number) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? `[${dept.departmentCode}] ${dept.name}` : `Dept #${deptId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "#00C853";
      case "inactive":
        return "#FF4D4D";
      case "maintenance":
        return "#FF9800";
      default:
        return "#999";
    }
  };

  const filtered = lines.filter((l) =>
    l.lineName.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: ProductionLine;
    index: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(500)}>
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name="git-network" size={22} color="#4FACFE" />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.lineName}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + "20" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{getDeptName(item.departmentId)}</Text>
          <View style={styles.statsRow}>
            {item.capacity != null && (
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color="#999" />
                <Text style={styles.statText}>{item.capacity} cap</Text>
              </View>
            )}
            {item.machineCount != null && (
              <View style={styles.statItem}>
                <Ionicons name="construct-outline" size={14} color="#999" />
                <Text style={styles.statText}>
                  {item.machineCount} machines
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.cardMenuBtn}
          onPress={() => openActions(item)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="menu" size={20} color="#6A6A6A" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.titleRow}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.title}>Production Lines</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddProductionLine")}
            >
              <LinearGradient
                colors={["#00F2FE", "#4FACFE"]}
                style={styles.addGrad}
              >
                <Ionicons name="add" size={26} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.searchBox}
          >
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Search lines..."
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
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4FACFE" />
            <Text style={styles.loadingText}>Loading production lines...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
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
              <View style={styles.empty}>
                <Ionicons
                  name="git-network-outline"
                  size={80}
                  color="#E0E0E0"
                />
                <Text style={styles.emptyText}>No production lines found</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => loadData()}
                >
                  <Text style={styles.retryText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        <Modal
          transparent
          visible={actionVisible}
          animationType="fade"
          onRequestClose={closeActions}
        >
          <Pressable style={styles.actionOverlay} onPress={closeActions}>
            <Pressable
              style={styles.actionCard}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.actionTitle}>
                {selectedLine?.lineName ?? "Production Line"}
              </Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onEditLine}>
                <Ionicons name="create-outline" size={18} color="#1F8BFF" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onDeleteLine}
                disabled={deletingId === selectedLine?.id}
              >
                <Ionicons name="trash-outline" size={18} color="#E53935" />
                <Text style={[styles.actionText, styles.actionDeleteText]}>
                  {deletingId === selectedLine?.id ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          transparent
          visible={deleteConfirmVisible}
          animationType="fade"
          onRequestClose={closeDeleteConfirm}
        >
          <Pressable style={styles.confirmOverlay} onPress={closeDeleteConfirm}>
            <Pressable
              style={styles.confirmCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.confirmIconWrap}>
                <Ionicons name="trash-outline" size={24} color="#E53935" />
              </View>
              <Text style={styles.confirmTitle}>Delete Production Line?</Text>
              <Text style={styles.confirmMessage}>
                This action cannot be undone. Delete {selectedLine?.lineName}?
              </Text>

              <View style={styles.confirmActionsRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={closeDeleteConfirm}
                  disabled={!!deletingId}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmDeleteBtn,
                    !!deletingId && styles.disabledDeleteBtn,
                  ]}
                  onPress={confirmDeleteLine}
                  disabled={!!deletingId}
                >
                  <LinearGradient
                    colors={["#FF6B6B", "#E53935"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmDeleteGradient}
                  >
                    <Text style={styles.confirmDeleteText}>
                      {deletingId ? "Deleting..." : "Delete"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert((prev) => ({
              ...prev,
              visible: false,
              onConfirm: undefined,
            }))
          }
          onConfirm={alert.onConfirm}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#F8F9FA",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { padding: 5 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  addBtn: {
    elevation: 8,
    shadowColor: "#4FACFE",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addGrad: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
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
  },
  searchInput: { flex: 1, color: "#1A1A1A", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, color: "#666", fontSize: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMenuBtn: {
    paddingLeft: 10,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(79, 172, 254, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: "#1A1A1A", flex: 1 },
  cardSub: { fontSize: 13, color: "#4FACFE", fontWeight: "600", marginTop: 3 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  statsRow: { flexDirection: "row", marginTop: 8, gap: 16 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: "#999", fontWeight: "500" },
  empty: { marginTop: 100, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#999", fontSize: 18, marginTop: 12 },
  retryBtn: {
    marginTop: 25,
    paddingHorizontal: 35,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#4FACFE",
  },
  retryText: { color: "#4FACFE", fontWeight: "bold", fontSize: 15 },
  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 16, 20, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  actionCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C3E50",
  },
  actionDeleteText: {
    color: "#E53935",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 12, 20, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  confirmCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFEDEE",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1C",
    textAlign: "center",
  },
  confirmMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#646A73",
    textAlign: "center",
  },
  confirmActionsRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A4453",
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  disabledDeleteBtn: {
    opacity: 0.75,
  },
  confirmDeleteGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
