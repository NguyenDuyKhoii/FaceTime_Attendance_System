import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import CustomAlert from "../../components/CustomAlert";
import { employeeService } from "../../service/employee.service";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "EnrollFace">;

interface SelectedImage {
  uri: string;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
  name?: string;
  mimeType?: string;
  file?: File;
}

export function EnrollFaceScreen({ route, navigation }: Props) {
  const { employeeId, employeeName } = route.params;

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setAlert({
        visible: true,
        title: "Permission Required",
        message: "Please grant media library access to select portrait photos.",
        type: "error",
        onConfirm: undefined,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      const newImages: SelectedImage[] = result.assets.map((asset, idx) => ({
        uri: asset.uri,
        status: "pending",
        name: `face_${Date.now()}_${idx}.jpg`,
        mimeType: "image/jpeg",
      }));

      setImages((prev) => {
        const existed = new Set(prev.map((x) => x.uri));
        return [...prev, ...newImages.filter((x) => !existed.has(x.uri))];
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const newImages: SelectedImage[] = result.assets.map((asset) => ({
        uri: asset.uri,
        status: "pending",
        name: asset.name,
        mimeType: asset.mimeType ?? "image/jpeg",
      }));

      setImages((prev) => {
        const existed = new Set(prev.map((x) => x.uri));
        return [...prev, ...newImages.filter((x) => !existed.has(x.uri))];
      });
    } catch (e: any) {
      console.warn("Document picker cancelled or failed", e);
    }
  };

  const removeImage = (index: number) => {
    if (loading) return;
    setImages((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const onEnroll = async () => {
    if (images.length === 0) {
      setAlert({
        visible: true,
        title: "No Photos Selected",
        message: "Please choose at least one face portrait photo to begin training.",
        type: "error",
        onConfirm: undefined,
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    const updatedImages = [...images];

    for (let i = 0; i < updatedImages.length; i++) {
      if (updatedImages[i].status === "success") {
        successCount++;
        continue;
      }

      setCurrentUploadIndex(i);
      updatedImages[i].status = "uploading";
      setImages([...updatedImages]);

      try {
        const file = {
          uri: updatedImages[i].uri,
          name: updatedImages[i].name ?? `face_${i}.jpg`,
          type: updatedImages[i].mimeType ?? "image/jpeg",
        };

        const response = await employeeService.enrollFace(employeeId, file);

        if (response.success) {
          updatedImages[i].status = "success";
          successCount++;
        } else {
          updatedImages[i].status = "error";
          updatedImages[i].message = response.message;
        }
      } catch (error: any) {
        updatedImages[i].status = "error";
        updatedImages[i].message = error.message;
      }

      setImages([...updatedImages]);
    }

    setLoading(false);
    setCurrentUploadIndex(-1);

    if (successCount === updatedImages.length) {
      setAlert({
        visible: true,
        title: "Enrollment Complete",
        message: `Successfully trained ${successCount} face samples for ${employeeName}.`,
        type: "success",
        onConfirm: () => navigation.goBack(),
      });
    } else {
      setAlert({
        visible: true,
        title: "Partial Enrollment",
        message: `Successfully processed ${successCount}/${updatedImages.length} images. Some photos were rejected (face not found or unclear).`,
        type: "info",
        onConfirm: undefined,
      });
    }
  };

  const renderImageItem = ({ item, index }: { item: SelectedImage; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={styles.imageCard}>
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      <View style={styles.imageOverlay}>
        {item.status === "uploading" && <ActivityIndicator color="#FFFFFF" size="small" />}
        {item.status === "success" && (
          <View style={styles.statusBadgeSuccess}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
        {item.status === "error" && (
          <View style={styles.statusBadgeError}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
          </View>
        )}
        {item.status === "pending" && !loading && (
          <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeBtn} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Face Enrollment</Text>

          <View style={{ width: 40 }} />
        </Animated.View>

        <View style={styles.content}>
          {/* Employee Target Info Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.infoCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {employeeName ? employeeName.charAt(0).toUpperCase() : "E"}
              </Text>
            </View>
            <View style={styles.infoDetails}>
              <Text style={styles.infoSubtitle}>ENROLLING PROFILE</Text>
              <Text style={styles.infoName} numberOfLines={1}>
                {employeeName}
              </Text>
              <Text style={styles.infoCode}>Employee ID: {employeeId.substring(0, 8)}...</Text>
            </View>
          </Animated.View>

          {/* Action Row: Gallery & Files */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.disabled]}
              onPress={pickImages}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="images" size={22} color="#2563EB" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionMainText}>Photo Gallery</Text>
                <Text style={styles.actionSubText}>Pick from device</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.disabled]}
              onPress={pickDocument}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#F1F5F9" }]}>
                <Ionicons name="folder-open" size={22} color="#475569" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionMainText}>Browse Files</Text>
                <Text style={styles.actionSubText}>Choose document</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Photos Grid Container */}
          <View style={styles.listContainer}>
            <FlatList
              data={images}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderImageItem}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                images.length === 0 ? (
                  <Animated.View entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="camera-outline" size={38} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>No Portraits Selected</Text>
                    <Text style={styles.emptySubtitle}>
                      Select 3 to 5 clear photos of this employee from different slight angles to train the facial model.
                    </Text>
                  </Animated.View>
                ) : (
                  <View style={styles.photoCountBar}>
                    <Text style={styles.photoCountText}>
                      Selected Photos ({images.length})
                    </Text>
                    <Text style={styles.photoCountHint}>Tap photo X to remove</Text>
                  </View>
                )
              }
            />
          </View>

          {/* Multi-Sample Guidelines */}
          <View style={styles.guidelinesBox}>
            <View style={styles.guideHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" style={{ marginRight: 7 }} />
              <Text style={styles.guideTitle}>Enrollment Best Practices</Text>
            </View>
            <Text style={styles.guideItem}>• Use clear, front-facing and slight angle shots.</Text>
            <Text style={styles.guideItem}>• Avoid dark shadows, strong backlights, or blurred focus.</Text>
            <Text style={styles.guideItem}>• Only one person should appear in each uploaded image.</Text>
          </View>

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={[
              styles.enrollButton,
              (images.length === 0 || loading) && styles.disabled,
            ]}
            onPress={onEnroll}
            disabled={images.length === 0 || loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>
                  TRAINING AI MODEL ({currentUploadIndex + 1}/{images.length})...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="scan-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>START ENROLLMENT</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
    backgroundColor: "#F8FAFC", // Clean light canvas
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  // ─── Info Card ───
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563EB",
  },
  infoDetails: {
    flex: 1,
  },
  infoSubtitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.6,
  },
  infoName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  infoCode: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  // ─── Action Buttons (Gallery & Files) ───
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionMainText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionSubText: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 1,
  },

  // ─── Image List / Empty Area ───
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  photoCountBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  photoCountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  photoCountHint: {
    fontSize: 12,
    color: "#94A3B8",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  imageCard: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeSuccess: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 2,
  },
  statusBadgeError: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 2,
  },
  removeBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },

  // ─── Guidelines ───
  guidelinesBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  guideTitle: {
    color: "#1E40AF",
    fontSize: 14.5,
    fontWeight: "800",
  },
  guideItem: {
    color: "#1E3A8A",
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 2,
  },

  // ─── Enroll Button ───
  enrollButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  disabled: {
    opacity: 0.45,
  },
});
