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
import CustomAlert from "../../components/CustomAlert";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "DepartmentList">;

export function DepartmentListScreen({ navigation }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [actionVisible, setActionVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const loadDepartments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await departmentApi.getDepartments();
      setDepartments(data);
    } catch (error: any) {
      console.error("Error loading departments:", error);
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Failed to load departments",
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadDepartments(false);
    });
    return unsubscribe;
  }, [navigation, loadDepartments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDepartments(false);
  };

  const openActions = (department: Department) => {
    setSelectedDepartment(department);
    setActionVisible(true);
  };

  const closeActions = () => {
    setActionVisible(false);
    setSelectedDepartment(null);
  };

  const closeDeleteConfirm = () => {
    if (deletingId) return;
    setDeleteConfirmVisible(false);
    setSelectedDepartment(null);
  };

  const onEditDepartment = () => {
    if (!selectedDepartment) return;
    const departmentToEdit = selectedDepartment;
    closeActions();
    navigation.navigate("AddDepartment", {
      department: departmentToEdit,
    });
  };

  const onDeleteDepartment = () => {
    if (!selectedDepartment || deletingId) return;
    setActionVisible(false);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!selectedDepartment || deletingId) return;

    try {
      setDeletingId(selectedDepartment.id);
      await departmentApi.deleteDepartment(selectedDepartment.id);
      setDepartments((prev) =>
        prev.filter((d) => d.id !== selectedDepartment.id),
      );
      setDeleteConfirmVisible(false);
      setSelectedDepartment(null);
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Error",
        message: error?.message || "Failed to delete department",
        type: "error",
        onConfirm: undefined,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.departmentCode.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item, index }: { item: Department; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(500)}>
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name="business" size={22} color="#4FACFE" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCode}>{item.departmentCode}</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
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
            <Text style={styles.title}>Departments</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddDepartment")}
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
              placeholder="Search departments..."
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
            <Text style={styles.loadingText}>Loading departments...</Text>
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
                <Ionicons name="business-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No departments found</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => loadDepartments()}
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
                {selectedDepartment?.name ?? "Department"}
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onEditDepartment}
              >
                <Ionicons name="create-outline" size={18} color="#1F8BFF" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onDeleteDepartment}
                disabled={deletingId === selectedDepartment?.id}
              >
                <Ionicons name="trash-outline" size={18} color="#E53935" />
                <Text style={[styles.actionText, styles.actionDeleteText]}>
                  {deletingId === selectedDepartment?.id
                    ? "Deleting..."
                    : "Delete"}
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
              <Text style={styles.confirmTitle}>Delete Department?</Text>
              <Text style={styles.confirmMessage}>
                This action cannot be undone. Delete {selectedDepartment?.name}{" "}
                ({selectedDepartment?.departmentCode})?
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
                  onPress={confirmDeleteDepartment}
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
    fontSize: 28,
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
  cardMenuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F6FA",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: "#1A1A1A" },
  cardCode: { fontSize: 13, color: "#4FACFE", fontWeight: "600", marginTop: 2 },
  cardDesc: { fontSize: 13, color: "#999", marginTop: 4 },
  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  actionDeleteText: {
    color: "#E53935",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#F1F1F1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(229, 57, 53, 0.12)",
    marginBottom: 14,
    alignSelf: "center",
  },
  confirmTitle: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "800",
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: "#5E6470",
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  confirmActionsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DCE5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  confirmCancelText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "700",
  },
  confirmDeleteBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    height: 46,
  },
  confirmDeleteGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  disabledDeleteBtn: {
    opacity: 0.7,
  },
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
});
