import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
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

  // Extra metadata from pickers 
  name?: string;
  mimeType?: string;

  // web drag-drop only
  file?: File;
}

export function EnrollFaceScreen({ route, navigation }: Props) {
  const { employeeId, employeeName } = route.params;

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);

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
        title: "Permission Denied",
        message: "We need gallery permissions to select face photos.",
        type: "error",
        onConfirm: undefined,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages: SelectedImage[] = result.assets.map((asset, idx) => ({
        uri: asset.uri,
        status: "pending",
        name: `gallery_${Date.now()}_${idx}.jpg`,
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

      setAlert({
        visible: true,
        title: "Success",
        message: `Imported ${result.assets.length} images from files.`,
        type: "success",
        onConfirm: () => setAlert((prev) => ({ ...prev, visible: false })),
      });
    } catch (err) {
      console.log("Document picker error:", err);
    }
  };

  // Web-only drag/drop
  const handleWebDrop = (e: any) => {
    if (Platform.OS !== "web") return;
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const newImages: SelectedImage[] = Array.from(files)
        .filter((file: any) => file.type?.startsWith("image/"))
        .map((file: any) => ({
          uri: URL.createObjectURL(file),
          status: "pending",
          file,
          name: file.name,
          mimeType: file.type,
        }));

      setImages((prev) => {
        const existed = new Set(prev.map((x) => x.uri));
        return [...prev, ...newImages.filter((x) => !existed.has(x.uri))];
      });
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
        title: "Missing Images",
        message: "Please select at least one face photo.",
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
        title: "Enrollment Successful",
        message: `Successfully enrolled ${successCount} face samples for ${employeeName}.`,
        type: "success",
        onConfirm: () => navigation.goBack(),
      });
    } else {
      setAlert({
        visible: true,
        title: "Partial Enrollment",
        message: `Processed ${successCount}/${updatedImages.length} images. Some failed (face not found), please try again.`,
        type: "info",
        onConfirm: undefined,
      });
    }
  };

  const renderImageItem = ({ item, index }: { item: SelectedImage; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.imageCard}>
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      <View style={styles.imageOverlay}>
        {item.status === "uploading" && <ActivityIndicator color="#00F2FE" size="small" />}
        {item.status === "success" && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
        {item.status === "error" && <Ionicons name="alert-circle" size={24} color="#FF4D4D" />}
        {item.status === "pending" && !loading && (
          <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeBtn}>
            <Ionicons name="close-circle" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={["#0F2027", "#203A43", "#2C5364"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>Face Enrollment</Text>

          {/* bỏ refresh MediaLibrary */}
          <View style={{ width: 28 }} />
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.targetLabel}>Enrolling face for:</Text>
            <Text style={styles.targetName}>{employeeName}</Text>
          </View>

          <View style={styles.listContainer}>
            <FlatList
              data={images}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderImageItem}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View style={styles.selectionArea}>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, loading && styles.disabled]}
                      onPress={pickImages}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={["rgba(0, 242, 254, 0.15)", "rgba(0, 242, 254, 0.05)"]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="images" size={24} color="#00F2FE" />
                        <Text style={styles.actionText}>Gallery</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, loading && styles.disabled]}
                      onPress={pickDocument}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="folder-open" size={24} color="#00F2FE" />
                        <Text style={styles.actionText}>Files</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {images.length === 0 && (
                    <Animated.View entering={FadeInUp} style={styles.emptyHint}>
                      <Ionicons name="camera-outline" size={48} color="rgba(0, 242, 254, 0.2)" />
                      <Text style={styles.emptyHintText}>No photos selected yet</Text>
                    </Animated.View>
                  )}
                </View>
              }
            />
          </View>

          <View style={styles.guidelines}>
            <Text style={styles.guideTitle}>Multi-Sample Enrollment:</Text>
            <Text style={styles.guideText}>• Select 3-5 photos from different angles.</Text>
            <Text style={styles.guideText}>• Ensure face is clearly visible in all shots.</Text>
            <Text style={styles.guideText}>• Supported formats: JPG, PNG.</Text>
          </View>

          <TouchableOpacity
            style={[styles.enrollButton, (images.length === 0 || loading) && styles.disabled]}
            onPress={onEnroll}
            disabled={images.length === 0 || loading}
          >
            <LinearGradient colors={["#00F2FE", "#4FACFE"]} style={styles.buttonGradient}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                  <Text style={styles.enrollText}>
                    ENROLLING ({currentUploadIndex + 1}/{images.length})
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="scan-outline" size={24} color="white" style={{ marginRight: 10 }} />
                  <Text style={styles.enrollText}>START ENROLLMENT</Text>
                </>
              )}
            </LinearGradient>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { padding: 5 },
  title: { fontSize: 22, fontWeight: "bold", color: "white" },
  content: { flex: 1, paddingHorizontal: 20 },
  infoBox: {
    marginBottom: 20,
    backgroundColor: "rgba(0, 242, 254, 0.1)",
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 254, 0.2)",
  },
  targetLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 4 },
  targetName: { color: "#00F2FE", fontSize: 20, fontWeight: "bold", letterSpacing: 0.5 },
  listContainer: { flex: 1 },
  listContent: { paddingBottom: 20 },
  selectionArea: { marginBottom: 20 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, height: 60, borderRadius: 12, overflow: "hidden" },
  actionGradient: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  actionText: { color: "#00F2FE", fontSize: 15, fontWeight: "600" },
  emptyHint: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderStyle: "dashed",
  },
  emptyHintText: { color: "rgba(255,255,255,0.3)", marginTop: 12, fontSize: 14 },
  addBtnDragging: { borderColor: "#00F2FE", backgroundColor: "rgba(0, 242, 254, 0.1)" },
  addBtnGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: "#00F2FE", fontSize: 16, fontWeight: "bold", marginTop: 8 },
  scanStatus: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  imageCard: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  thumbnail: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtn: { position: "absolute", top: 5, right: 5 },
  guidelines: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  guideTitle: { color: "#00F2FE", fontWeight: "bold", marginBottom: 5, fontSize: 14 },
  guideText: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 3 },
  enrollButton: { height: 60, borderRadius: 15, overflow: "hidden", marginBottom: 20 },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingRow: { flexDirection: "row", alignItems: "center" },
  enrollText: { color: "white", fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  disabled: { opacity: 0.5 },
  fileBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 242, 254, 0.3)",
  },
  fileBtnContent: { flexDirection: "row", alignItems: "center" },
  fileBtnText: { color: "#00F2FE", fontSize: 14, fontWeight: "600" },
});
