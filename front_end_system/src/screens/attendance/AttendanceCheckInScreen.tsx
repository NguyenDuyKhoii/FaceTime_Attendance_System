/**
 * AttendanceCheckInScreen - Public screen for employee attendance check-in
 * Displays ESP32 camera stream and triggers face recognition
 */

import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import CustomAlert from "../../components/CustomAlert";
import { AuthStackParamList } from "../../types/AuthParam";
import { API_BASE_URL } from "../../utils/constants";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<AuthStackParamList, "AttendanceCheckIn">;

export default function AttendanceCheckInScreen({ navigation }: Props) {
    const [cameraIP, setCameraIP] = useState<string>("");
    const [streamURL, setStreamURL] = useState<string>("");
    const [discovering, setDiscovering] = useState(true);
    const [capturing, setCapturing] = useState(false);
    const [webViewKey, setWebViewKey] = useState(0);

    const [alert, setAlert] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info" as "success" | "error" | "info",
        onConfirm: undefined as (() => void) | undefined,
    });

    const [lastCheckIn, setLastCheckIn] = useState<{
        name: string;
        timestamp: string;
        confidence: number;
        status?: string;
    } | null>(null);

    useEffect(() => {
        discoverCamera();
    }, []);

    const discoverCamera = async () => {
        setDiscovering(true);

        const apiHost = API_BASE_URL.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
        const hosts = Array.from(new Set([apiHost, "10.0.2.2", "localhost"].filter(Boolean)));

        for (const host of hosts) {
            try {
                const response = await fetch(`http://${host}:8000/api/camera/ip`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.ok && data.ip && data.ip !== "0.0.0.0") {
                        setCameraIP(data.ip);
                        setStreamURL(`http://${data.ip}:81/stream`);
                        setWebViewKey((prev) => prev + 1);
                        setDiscovering(false);
                        return;
                    }
                }
            } catch (e) {
                // Tiếp tục thử host kế tiếp
            }
        }

        setDiscovering(false);
    };

    const handleCapture = async () => {
        if (!cameraIP) {
            setAlert({
                visible: true,
                title: "Không tìm thấy Camera",
                message: "Chưa kết nối được với ESP32-CAM. Vui lòng đảm bảo camera đã bật nguồn và kết nối cùng mạng Wi-Fi.",
                type: "error",
                onConfirm: undefined,
            });
            return;
        }

        setCapturing(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
            // Bước 1: Chụp ảnh từ camera ESP32 và lưu vào cache của thiết bị
            const captureUrl = `http://${cameraIP}/capture`;
            const localUri = `${FileSystem.cacheDirectory}capture.jpg`;

            console.log(`[Capture] Downloading image from: ${captureUrl}`);
            const downloadResult = await FileSystem.downloadAsync(captureUrl, localUri);

            if (downloadResult.status !== 200) {
                throw new Error("Không thể chụp ảnh từ camera ESP32.");
            }

            // Bước 2: Upload ảnh tới backend để nhận diện
            const netUrl = `${API_BASE_URL}/Attendance/face-checkin`;
            console.log(`[Checkin] Uploading image to backend: ${netUrl}`);

            let recognitionData: any = null;

            if (Platform.OS !== "web") {
                const uploadResult = await FileSystem.uploadAsync(netUrl, downloadResult.uri, {
                    fieldName: "File",
                    httpMethod: "POST",
                    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                    parameters: {
                        DeviceId: "ESP32-CAM-02",
                    },
                    headers: {
                        Accept: "application/json",
                    },
                });

                clearTimeout(timeoutId);

                if (uploadResult.status < 200 || uploadResult.status >= 300) {
                    throw new Error(`Máy chủ phản hồi mã lỗi: ${uploadResult.status}`);
                }

                recognitionData = JSON.parse(uploadResult.body);
            } else {
                const formData = new FormData();
                formData.append("File", {
                    uri: downloadResult.uri,
                    type: "image/jpeg",
                    name: "capture.jpg",
                } as any);
                formData.append("DeviceId", "ESP32-CAM-02");

                const attendanceResponse = await fetch(netUrl, {
                    method: "POST",
                    body: formData,
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!attendanceResponse.ok) {
                    throw new Error(`Máy chủ phản hồi mã lỗi: ${attendanceResponse.status}`);
                }

                recognitionData = await attendanceResponse.json();
            }

            if (recognitionData && recognitionData.success) {
                const { employeeName, confidence, checkInTime, status } = recognitionData;

                setLastCheckIn({
                    name: employeeName || "Không xác định",
                    timestamp: checkInTime || new Date().toISOString(),
                    confidence: confidence || 0,
                    status: status || "CheckedIn",
                });

                const formattedTime = new Date(checkInTime).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                });

                if (status === "CheckedIn") {
                    setAlert({
                        visible: true,
                        title: `Xin chào ${employeeName}! 👋`,
                        message: `Điểm danh thành công!\n\nThời gian: ${formattedTime}\nĐộ chính xác: ${confidence?.toFixed(1)}%`,
                        type: "success",
                        onConfirm: undefined,
                    });
                } else if (status === "CheckedOut") {
                    setAlert({
                        visible: true,
                        title: `Tạm biệt ${employeeName}! 👋`,
                        message: `Check-out thành công!\n\nThời gian: ${formattedTime}\nĐộ chính xác: ${confidence?.toFixed(1)}%\n\nHẹn gặp lại bạn!`,
                        type: "success",
                        onConfirm: undefined,
                    });
                } else {
                    setAlert({
                        visible: true,
                        title: recognitionData.message || "Đã xử lý điểm danh",
                        message: `Trạng thái: ${status}\nĐộ chính xác: ${confidence?.toFixed(1)}%`,
                        type: "info",
                        onConfirm: undefined,
                    });
                }
            } else if (recognitionData) {
                const { status, message } = recognitionData;

                if (status === "UnknownFace") {
                    setAlert({
                        visible: true,
                        title: "Không nhận diện được khuôn mặt",
                        message: "Khuôn mặt chưa được đăng ký trong hệ thống hoặc hình ảnh không rõ nét. Vui lòng thử lại.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else if (status === "AlreadyCheckedOut") {
                    setAlert({
                        visible: true,
                        title: "Đã hoàn thành ca",
                        message: "Bạn đã check-out trong ngày hôm nay rồi.",
                        type: "info",
                        onConfirm: undefined,
                    });
                } else if (status === "NoShiftToday") {
                    setAlert({
                        visible: true,
                        title: "Không có ca làm việc",
                        message: "Bạn không có ca làm việc được phân công trong ngày hôm nay.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else if (status === "WrongShiftTime") {
                    setAlert({
                        visible: true,
                        title: "Chưa đến giờ làm",
                        message: "Hiện tại chưa đến khung giờ làm việc của bạn.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else if (status === "WrongProductionLine") {
                    setAlert({
                        visible: true,
                        title: "Sai vị trí làm việc",
                        message: "Bạn đang điểm danh tại sai dây chuyền được phân công.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else {
                    setAlert({
                        visible: true,
                        title: "Xử lý thất bại",
                        message: message || "Không thể xử lý dữ liệu điểm danh. Vui lòng thử lại.",
                        type: "error",
                        onConfirm: undefined,
                    });
                }
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error("Capture Error Detail:", error);

            let errorMessage = "Không thể kết nối đến máy chủ hoặc camera.";
            let errorTitle = "Lỗi kết nối";

            if (error.name === "AbortError") {
                errorTitle = "Hết thời gian phản hồi";
                errorMessage = "Máy chủ không phản hồi kịp thời (quá 25 giây). Vui lòng thử lại.";
            }

            setAlert({
                visible: true,
                title: errorTitle,
                message: `${errorMessage}\n\nVui lòng kiểm tra kết nối mạng Wi-Fi và thử lại.`,
                type: "error",
                onConfirm: undefined,
            });
        } finally {
            setCapturing(false);
        }
    };

    const handleRefresh = () => {
        setWebViewKey((prev) => prev + 1);
        discoverCamera();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Điểm Danh Khuôn Mặt</Text>

                    <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
                        <Ionicons name="refresh" size={20} color="#0F172A" />
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {discovering ? (
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={styles.loadingText}>Đang dò tìm camera ESP32...</Text>
                            <Text style={styles.loadingSubtext}>Vui lòng giữ kết nối Wi-Fi ổn định</Text>
                        </Animated.View>
                    ) : (
                        <>
                            {/* Device Info Card (Clean White) */}
                            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.deviceCard}>
                                <View style={styles.deviceInfoLeft}>
                                    <View style={styles.deviceIconWrapper}>
                                        <Ionicons name="videocam" size={18} color="#2563EB" />
                                    </View>
                                    <View style={styles.deviceTextGroup}>
                                        <Text style={styles.deviceMainText}>ESP32-CAM Terminal</Text>
                                        <Text style={styles.deviceSubText}>
                                            {cameraIP ? `Thiết bị IP: ${cameraIP}` : "Chưa kết nối camera"}
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    style={[
                                        styles.statusPill,
                                        cameraIP ? styles.statusPillActive : styles.statusPillInactive,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.statusDot,
                                            cameraIP ? styles.statusDotActive : styles.statusDotInactive,
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.statusPillText,
                                            cameraIP ? styles.statusPillTextActive : styles.statusPillTextInactive,
                                        ]}
                                    >
                                        {cameraIP ? "Sẵn sàng" : "Mất kết nối"}
                                    </Text>
                                </View>
                            </Animated.View>

                            {/* Camera Stream Box with Biometric Scanning Frame */}
                            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.streamFrame}>
                                {streamURL ? (
                                    <View style={styles.streamWrapper}>
                                        <WebView
                                            key={webViewKey}
                                            source={{
                                                html: `
                                                    <!DOCTYPE html>
                                                    <html>
                                                        <head>
                                                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                                            <style>
                                                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                                                body { background: #000; display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; overflow: hidden; }
                                                                img { width: 100%; height: 100%; object-fit: cover; }
                                                            </style>
                                                        </head>
                                                        <body>
                                                            <img src="${streamURL}" />
                                                        </body>
                                                    </html>
                                                `,
                                            }}
                                            style={styles.webview}
                                            scrollEnabled={false}
                                            originWhitelist={["*"]}
                                            allowsInlineMediaPlayback={true}
                                            onError={() => {
                                                setAlert({
                                                    visible: true,
                                                    title: "Lỗi luồng hình ảnh",
                                                    message: "Không thể hiển thị luồng video từ camera. Vui lòng kiểm tra nguồn điện camera.",
                                                    type: "error",
                                                    onConfirm: undefined,
                                                });
                                            }}
                                        />

                                        {/* Scanner Viewfinder Bracket Corners */}
                                        <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
                                        <View style={[styles.cornerBracket, styles.bracketTopRight]} />
                                        <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
                                        <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

                                        {/* Face guide target oval */}
                                        <View style={styles.faceTargetOval} pointerEvents="none" />
                                    </View>
                                ) : (
                                    <View style={styles.noStreamContainer}>
                                        <Ionicons name="videocam-off-outline" size={52} color="#94A3B8" />
                                        <Text style={styles.noStreamTitle}>Không có tín hiệu camera</Text>
                                        <Text style={styles.noStreamSub}>Vui lòng kiểm tra kết nối thiết bị ESP32</Text>
                                    </View>
                                )}
                            </Animated.View>

                            {/* Last Check-in Success Result Card (Clean Light Green) */}
                            {lastCheckIn && (
                                <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.resultCard}>
                                    <View style={styles.resultHeader}>
                                        <View style={styles.resultBadge}>
                                            <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                            <Text style={styles.resultBadgeText}>Kết Quả Điểm Danh Gần Nhất</Text>
                                        </View>
                                    </View>

                                    <View style={styles.resultBody}>
                                        {/* Name Row */}
                                        <View style={styles.resultRowLarge}>
                                            <View style={styles.resultIconWrap}>
                                                <Ionicons name="person" size={20} color="#2563EB" />
                                            </View>
                                            <View style={styles.resultColLarge}>
                                                <Text style={styles.resultLabel}>Họ và tên nhân viên</Text>
                                                <Text style={styles.resultValueName}>{lastCheckIn.name}</Text>
                                            </View>
                                        </View>

                                        {/* Time & Confidence Row */}
                                        <View style={styles.resultRowSplit}>
                                            <View style={styles.resultSubCol}>
                                                <Text style={styles.resultLabel}>Thời gian</Text>
                                                <Text style={styles.resultValueTime}>
                                                    {new Date(lastCheckIn.timestamp).toLocaleTimeString("vi-VN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        second: "2-digit",
                                                        hour12: false,
                                                    })}
                                                </Text>
                                            </View>

                                            <View style={styles.resultDivider} />

                                            <View style={styles.resultSubCol}>
                                                <Text style={styles.resultLabel}>Độ chính xác AI</Text>
                                                <Text style={styles.resultValueConfidence}>
                                                    {lastCheckIn.confidence.toFixed(1)}%
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Animated.View>
                            )}

                            {/* Guidelines Card (Clean Light Canvas) */}
                            <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.guidelinesCard}>
                                <View style={styles.guidelinesHeader}>
                                    <View style={styles.guidelinesIconWrap}>
                                        <Ionicons name="scan-outline" size={18} color="#2563EB" />
                                    </View>
                                    <Text style={styles.guidelinesTitle}>Hướng Dẫn Chấm Công</Text>
                                </View>
                                <View style={styles.guidelinesList}>
                                    <View style={styles.guidelineRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginTop: 2, marginRight: 8 }} />
                                        <Text style={styles.guidelineText}>Giữ khuôn mặt thẳng hướng vào khung hình tròn.</Text>
                                    </View>
                                    <View style={styles.guidelineRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginTop: 2, marginRight: 8 }} />
                                        <Text style={styles.guidelineText}>Đảm bảo ánh sáng trực diện, tránh đứng ngược sáng.</Text>
                                    </View>
                                    <View style={styles.guidelineRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginTop: 2, marginRight: 8 }} />
                                        <Text style={styles.guidelineText}>Tháo khẩu trang hoặc kính râm khi thực hiện quét.</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        </>
                    )}
                </ScrollView>

                {/* Fixed Bottom Action Button */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            capturing ? styles.captureButtonProcessing : styles.captureButtonActive,
                            (!cameraIP || capturing) && styles.buttonDisabled,
                        ]}
                        onPress={handleCapture}
                        disabled={capturing || !cameraIP}
                        activeOpacity={0.88}
                    >
                        {capturing ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 10 }} />
                                <Text style={styles.buttonText}>ĐANG NHẬN DIỆN KHUÔN MẶT...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Ionicons name="camera" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                                <Text style={styles.buttonText}>CHỤP & ĐIỂM DANH</Text>
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
        backgroundColor: "#F8FAFC", // Clean light slate
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        paddingVertical: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 16,
    },
    loadingSubtext: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 4,
    },
    deviceCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 14,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    deviceInfoLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    deviceIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    deviceTextGroup: {
        justifyContent: "center",
    },
    deviceMainText: {
        color: "#0F172A",
        fontSize: 14,
        fontWeight: "700",
    },
    deviceSubText: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 2,
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusPillActive: {
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#A7F3D0",
    },
    statusPillInactive: {
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 6,
    },
    statusDotActive: {
        backgroundColor: "#059669",
    },
    statusDotInactive: {
        backgroundColor: "#DC2626",
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: "700",
    },
    statusPillTextActive: {
        color: "#059669",
    },
    statusPillTextInactive: {
        color: "#DC2626",
    },
    streamFrame: {
        width: "100%",
        aspectRatio: 4 / 3,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#0F172A",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        marginBottom: 16,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
    },
    streamWrapper: {
        flex: 1,
        position: "relative",
    },
    webview: {
        flex: 1,
        backgroundColor: "transparent",
    },
    cornerBracket: {
        position: "absolute",
        width: 26,
        height: 26,
        borderColor: "#38BDF8",
    },
    bracketTopLeft: {
        top: 14,
        left: 14,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 6,
    },
    bracketTopRight: {
        top: 14,
        right: 14,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 6,
    },
    bracketBottomLeft: {
        bottom: 14,
        left: 14,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 6,
    },
    bracketBottomRight: {
        bottom: 14,
        right: 14,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 6,
    },
    faceTargetOval: {
        position: "absolute",
        alignSelf: "center",
        top: "16%",
        width: "48%",
        height: "68%",
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: "rgba(56, 189, 248, 0.5)",
        borderStyle: "dashed",
    },
    noStreamContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#F1F5F9",
    },
    noStreamTitle: {
        color: "#0F172A",
        fontSize: 15,
        fontWeight: "700",
        marginTop: 12,
    },
    noStreamSub: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 4,
    },
    resultCard: {
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    resultHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    resultBadge: {
        flexDirection: "row",
        alignItems: "center",
    },
    resultBadgeText: {
        color: "#166534",
        fontSize: 14,
        fontWeight: "800",
        marginLeft: 8,
    },
    resultBody: {
        gap: 12,
    },
    resultRowLarge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DCFCE7",
    },
    resultIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
    },
    resultColLarge: {
        marginLeft: 12,
        flex: 1,
    },
    resultLabel: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "600",
    },
    resultValueName: {
        color: "#0F172A",
        fontSize: 17,
        fontWeight: "800",
        marginTop: 2,
    },
    resultRowSplit: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DCFCE7",
    },
    resultSubCol: {
        flex: 1,
    },
    resultValueTime: {
        color: "#0F172A",
        fontSize: 15,
        fontWeight: "700",
        marginTop: 2,
    },
    resultValueConfidence: {
        color: "#059669",
        fontSize: 15,
        fontWeight: "800",
        marginTop: 2,
    },
    resultDivider: {
        width: 1,
        height: 28,
        backgroundColor: "#DCFCE7",
        marginHorizontal: 12,
    },
    guidelinesCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 18,
        padding: 16,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    guidelinesHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    guidelinesIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    guidelinesTitle: {
        color: "#0F172A",
        fontSize: 14,
        fontWeight: "700",
    },
    guidelinesList: {
        gap: 8,
    },
    guidelineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    guidelineText: {
        color: "#334155",
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    bottomBar: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    captureButton: {
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    captureButtonActive: {
        backgroundColor: "#2563EB",
    },
    captureButtonProcessing: {
        backgroundColor: "#94A3B8",
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
});
