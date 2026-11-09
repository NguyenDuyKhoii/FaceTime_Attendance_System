/**
 * AttendanceCheckInScreen - Public screen for employee attendance check-in
 * Displays ESP32 camera stream and triggers face recognition via /send endpoint
 */

import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { WebView } from "react-native-webview";
import CustomAlert from "../../components/CustomAlert";
import { AuthStackParamList } from "../../types/AuthParam";
import { API_BASE_URL } from "../../utils/constants";

const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<AuthStackParamList, "AttendanceCheckIn">;

export default function AttendanceCheckInScreen({ navigation }: Props) {
    const [cameraIP, setCameraIP] = useState<string>("");
    const [serverIP, setServerIP] = useState<string>("");
    const [streamURL, setStreamURL] = useState<string>("");
    const [discovering, setDiscovering] = useState(true);
    const [capturing, setCapturing] = useState(false);
    const [webViewKey, setWebViewKey] = useState(0);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 5));
        console.log(`[DEBUG] ${msg}`);
    };

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
    } | null>(null);

    // Simple UDP discovery simulation - In production, use actual UDP library
    // For now, we'll use a hardcoded IP as fallback
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
                        setServerIP(host);
                        setStreamURL(`http://${data.ip}:81/stream`);
                        setWebViewKey(prev => prev + 1); // Force WebView reload
                        setDiscovering(false);
                        return;
                    }
                }
            } catch (e) {
                // Thử host tiếp theo
            }
        }

        // Giá trị dự phòng (fallback) khi chưa có ESP32-CAM đăng ký IP
        setServerIP(apiHost || "localhost");
        setDiscovering(false);
    };

    const handleCapture = async () => {
        if (!cameraIP) {
            setAlert({
                visible: true,
                title: "Camera Not Found",
                message: "No ESP32-CAM registered yet. Make sure ESP32-CAM is powered on and connected to the same WiFi.",
                type: "error",
                onConfirm: undefined,
            });
            return;
        }
        const currentCameraIP = cameraIP;
        const currentServerIP = serverIP || API_BASE_URL;

        setCapturing(true);
        const controller = new AbortController();

        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout

        try {
            // Bước 1: Chụp ảnh từ ESP32 camera và tải về bộ nhớ đệm điện thoại
            // Sửa port mặc định thành port 80 (hoặc port của webserver, nếu vẫn lỗi thử bỏ qua http://)
            const captureUrl = `http://${currentCameraIP}/capture`;
            const localUri = `${FileSystem.cacheDirectory}capture.jpg`;

            addLog(`Downloading image from camera: ${captureUrl}`);
            const downloadResult = await FileSystem.downloadAsync(captureUrl, localUri);

            if (downloadResult.status !== 200) {
                addLog(`Download error: ${downloadResult.status}`);
                throw new Error(`Cannot get image from camera (Status: ${downloadResult.status})`);
            }
            addLog("Image downloaded successfully, preparing data...");

            // Bước 2: Chuẩn bị upload file từ native filesystem
            // Dùng FileSystem.uploadAsync để tương thích hoàn toàn với React Native 0.88 & Expo 58 (tránh lỗi FormDataPart trên Android)
            const netUrl = `${API_BASE_URL}/Attendance/face-checkin`;
            addLog(`Sending image to backend: ${netUrl}`);

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
                addLog(`Backend responded: ${uploadResult.status}`);

                if (uploadResult.status < 200 || uploadResult.status >= 300) {
                    throw new Error(`Server error: ${uploadResult.status}`);
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
                addLog(`Backend responded: ${attendanceResponse.status}`);

                if (!attendanceResponse.ok) {
                    throw new Error(`Server error: ${attendanceResponse.status}`);
                }

                recognitionData = await attendanceResponse.json();
            }

            if (recognitionData && recognitionData.success) {
                const { employeeName, confidence, checkInTime, status } = recognitionData;

                // Save last check-in info
                setLastCheckIn({
                    name: employeeName || "Unknown",
                    timestamp: checkInTime || new Date().toISOString(),
                    confidence: confidence || 0,
                });

                // Format timestamp
                const formattedTime = new Date(checkInTime).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });

                // Differentiate between Check-in and Check-out
                if (status === "CheckedIn") {
                    setAlert({
                        visible: true,
                        title: `Hello ${employeeName}! 👋`,
                        message: `Check-in successful!\n\nTime: ${formattedTime}\nConfidence: ${confidence?.toFixed(1)}%`,
                        type: "success",
                        onConfirm: undefined,
                    });
                } else if (status === "CheckedOut") {
                    setAlert({
                        visible: true,
                        title: `Goodbye ${employeeName}! 👋`,
                        message: `Check-out successful!\n\nTime: ${formattedTime}\nConfidence: ${confidence?.toFixed(1)}%\n\nSee you next time!`,
                        type: "success",
                        onConfirm: undefined,
                    });
                } else {
                    setAlert({
                        visible: true,
                        title: recognitionData.message || "Attendance Processed",
                        message: `Status: ${status}\nConfidence: ${confidence?.toFixed(1)}%`,
                        type: "info",
                        onConfirm: undefined,
                    });
                }
            } else if (recognitionData) {
                // Handle failure cases from .NET
                const { message, status } = recognitionData;

                if (status === "UnknownFace") {
                    setAlert({
                        visible: true,
                        title: "Face Not Recognized",
                        message: "Your face is not registered or not clear. Please try again.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else if (status === "AlreadyCheckedOut") {
                    setAlert({
                        visible: true,
                        title: "Already Checked-out",
                        message: "You have already checked out for today.",
                        type: "info",
                        onConfirm: undefined,
                    });
                } else if (status === "NoShiftToday") {
                    setAlert({
                        visible: true,
                        title: "No Shift Today",
                        message: "You do not have any shift assigned for today.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else if (status === "WrongShiftTime") {
                    setAlert({
                        visible: true,
                        title: "Wrong Time",
                        message: "It is currently not your working time.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else if (status === "WrongLocation") {
                    setAlert({
                        visible: true,
                        title: "Wrong Location",
                        message: "You are checking in at the wrong production line.",
                        type: "error",
                        onConfirm: undefined,
                    });
                } else {
                    setAlert({
                        visible: true,
                        title: "Processing Failed",
                        message: "Failed to process attendance data.",
                        type: "error",
                        onConfirm: undefined,
                    });
                }
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error("Capture Error Detail:", error);

            let errorMessage = error.message;
            let errorTitle = "Connection Error";

            if (error.name === 'AbortError') {
                errorTitle = "Timeout";
                errorMessage = "Server did not respond within 25 seconds. Please check your network or server.";
            }

            setAlert({
                visible: true,
                title: errorTitle,
                message: `Error: ${errorMessage}\n\nPlease check your Wi-Fi or Server IP: ${currentServerIP}`,
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
        <LinearGradient colors={["#0F2027", "#203A43", "#2C5364"]} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Attendance Check-in</Text>

                    <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                        <Ionicons name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.content}>
                    {discovering ? (
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#00F2FE" />
                            <Text style={styles.loadingText}>Discovering camera...</Text>
                            <Text style={styles.loadingSubtext}>Please wait</Text>
                        </Animated.View>
                    ) : (
                        <>
                            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.infoBox}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="camera" size={20} color="#00F2FE" />
                                    <Text style={styles.infoLabel}>Camera IP:</Text>
                                    <Text style={styles.infoValue}>{cameraIP || "Not found"}</Text>
                                </View>
                                <View style={styles.statusIndicator}>
                                    <View style={[styles.statusDot, cameraIP && styles.statusDotActive]} />
                                    <Text style={styles.statusText}>{cameraIP ? "Connected" : "Disconnected"}</Text>
                                </View>
                            </Animated.View>

                            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.streamContainer}>
                                {streamURL ? (
                                    <WebView
                                        key={webViewKey}
                                        source={{
                                            html: `
                                                <html>
                                                    <head>
                                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                                        <style>
                                                            body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; overflow: hidden; }
                                                            img { width: 100%; height: auto; max-height: 100%; object-fit: contain; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <img src="${streamURL}" style="width: 100%; height: auto;" />
                                                    </body>
                                                </html>
                                            `
                                        }}
                                        style={styles.webview}
                                        scrollEnabled={false}
                                        originWhitelist={["*"]}
                                        allowsInlineMediaPlayback={true}
                                        onError={() => {
                                            setAlert({
                                                visible: true,
                                                title: "Stream Error",
                                                message: "Failed to load camera stream. Please check camera connection at " + streamURL,
                                                type: "error",
                                                onConfirm: undefined,
                                            });
                                        }}
                                    />
                                ) : (
                                    <View style={styles.noStreamContainer}>
                                        <Ionicons name="videocam-off" size={60} color="rgba(255,255,255,0.3)" />
                                        <Text style={styles.noStreamText}>No stream available</Text>
                                    </View>
                                )}
                            </Animated.View>

                            {lastCheckIn && (
                                <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.lastCheckInBox}>
                                    <View style={styles.lastCheckInHeader}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                        <Text style={styles.lastCheckInTitle}>Last Check-in</Text>
                                    </View>
                                    <View style={styles.lastCheckInContent}>
                                        <View style={styles.lastCheckInRow}>
                                            <Ionicons name="person" size={16} color="#00F2FE" />
                                            <Text style={styles.lastCheckInLabel}>Name:</Text>
                                            <Text style={styles.lastCheckInValue}>{lastCheckIn.name}</Text>
                                        </View>
                                        <View style={styles.lastCheckInRow}>
                                            <Ionicons name="time" size={16} color="#00F2FE" />
                                            <Text style={styles.lastCheckInLabel}>Time:</Text>
                                            <Text style={styles.lastCheckInValue}>
                                                {new Date(lastCheckIn.timestamp).toLocaleString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                    hour12: true,
                                                })}
                                            </Text>
                                        </View>
                                        <View style={styles.lastCheckInRow}>
                                            <Ionicons name="analytics" size={16} color="#00F2FE" />
                                            <Text style={styles.lastCheckInLabel}>Confidence:</Text>
                                            <Text style={styles.lastCheckInValue}>{lastCheckIn.confidence.toFixed(1)}%</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            )}

                            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.instructions}>
                                <Text style={styles.instructionTitle}>System Status:</Text>
                                {debugLogs.length > 0 ? (
                                    debugLogs.map((log, i) => (
                                        <Text key={i} style={[styles.instructionText, { color: i === 0 ? "#00F2FE" : "rgba(255,255,255,0.4)" }]}>
                                            • {log}
                                        </Text>
                                    ))
                                ) : (
                                    <Text style={styles.instructionText}>• Waiting for capture...</Text>
                                )}
                            </Animated.View>

                            <TouchableOpacity
                                style={[styles.captureButton, capturing && styles.buttonDisabled]}
                                onPress={handleCapture}
                                disabled={capturing || !cameraIP}
                            >
                                <LinearGradient colors={["#00F2FE", "#4FACFE"]} style={styles.buttonGradient}>
                                    {capturing ? (
                                        <View style={styles.buttonContent}>
                                            <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                                            <Text style={styles.buttonText}>PROCESSING...</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.buttonContent}>
                                            <Ionicons name="camera" size={24} color="white" style={{ marginRight: 10 }} />
                                            <Text style={styles.buttonText}>CAPTURE & CHECK-IN</Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
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
    refreshButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: "bold", color: "white" },
    content: { flex: 1, paddingHorizontal: 20 },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: "#00F2FE",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
    },
    loadingSubtext: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        marginTop: 5,
    },
    infoBox: {
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    infoLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        marginLeft: 8,
        marginRight: 8,
    },
    infoValue: {
        color: "#00F2FE",
        fontSize: 14,
        fontWeight: "bold",
    },
    statusIndicator: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#FF4D4D",
        marginRight: 8,
    },
    statusDotActive: {
        backgroundColor: "#4CAF50",
    },
    statusText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
    },
    streamContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 15,
        overflow: "hidden",
        marginBottom: 15,
    },
    webview: {
        flex: 1,
    },
    noStreamContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noStreamText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 16,
        marginTop: 15,
    },
    lastCheckInBox: {
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(76, 175, 80, 0.3)",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
    },
    lastCheckInHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    lastCheckInTitle: {
        color: "#4CAF50",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    lastCheckInContent: {
        gap: 8,
    },
    lastCheckInRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    lastCheckInLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
        marginLeft: 8,
        marginRight: 8,
        minWidth: 80,
    },
    lastCheckInValue: {
        color: "white",
        fontSize: 13,
        fontWeight: "600",
    },
    instructions: {
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
    },
    instructionTitle: {
        color: "#00F2FE",
        fontWeight: "bold",
        fontSize: 14,
        marginBottom: 8,
    },
    instructionText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        marginBottom: 3,
    },
    captureButton: {
        height: 60,
        borderRadius: 15,
        overflow: "hidden",
        marginBottom: 20,
        elevation: 8,
        shadowColor: "#4FACFE",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 1,
    },
});
