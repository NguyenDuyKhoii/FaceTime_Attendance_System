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
import CustomAlert, { CustomAlertDetailItem } from "../../components/CustomAlert";
import { AuthStackParamList } from "../../types/AuthParam";
import { API_BASE_URL } from "../../utils/constants";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<AuthStackParamList, "AttendanceCheckIn">;

const formatTime = (value?: string | null): string => {
    if (!value) return "--:--:--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--:--";
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
};

const formatWorkingDuration = (
    checkInValue?: string | null,
    checkOutValue?: string | null,
    workingSecondsFromServer?: number | null
): string => {
    let totalSeconds: number | null = null;
    if (typeof workingSecondsFromServer === "number" && !Number.isNaN(workingSecondsFromServer)) {
        totalSeconds = Math.max(0, Math.round(workingSecondsFromServer));
    } else if (checkInValue && checkOutValue) {
        const startMs = new Date(checkInValue).getTime();
        const endMs = new Date(checkOutValue).getTime();
        if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
            totalSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
        }
    }

    if (totalSeconds === null) return "N/A";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${seconds}s`;
};

export default function AttendanceCheckInScreen({ navigation }: Props) {
    const [cameraIP, setCameraIP] = useState<string>("");
    const [streamURL, setStreamURL] = useState<string>("");
    const [discovering, setDiscovering] = useState(true);
    const [capturing, setCapturing] = useState(false);
    const [webViewKey, setWebViewKey] = useState(0);

    const [alert, setAlert] = useState({
        visible: false,
        title: "",
        subtitle: "",
        message: "",
        details: [] as CustomAlertDetailItem[],
        large: false,
        type: "info" as "success" | "error" | "info",
        onConfirm: undefined as (() => void) | undefined,
    });

    const showSimpleAlert = (
        title: string,
        message: string,
        type: "success" | "error" | "info" = "info"
    ) => {
        setAlert({
            visible: true,
            title,
            subtitle: "",
            message,
            details: [],
            large: false,
            type,
            onConfirm: undefined,
        });
    };

    const [lastCheckIn, setLastCheckIn] = useState<{
        name: string;
        timestamp: string;
        checkInTime?: string;
        checkOutTime?: string;
        workingDuration?: string;
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
                // Try next host
            }
        }

        setDiscovering(false);
    };

    const handleCapture = async () => {
        if (!cameraIP) {
            showSimpleAlert(
                "Camera Not Found",
                "No ESP32-CAM detected. Please make sure the camera is powered on and connected to the same Wi-Fi network.",
                "error"
            );
            return;
        }

        setCapturing(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
            // Step 1: Download captured frame from ESP32 camera to local cache
            const captureUrl = `http://${cameraIP}/capture`;
            const localUri = `${FileSystem.cacheDirectory}capture.jpg`;

            console.log(`[Capture] Downloading image from: ${captureUrl}`);
            const downloadResult = await FileSystem.downloadAsync(captureUrl, localUri);

            if (downloadResult.status !== 200) {
                throw new Error("Cannot capture image from ESP32 camera.");
            }

            // Step 2: Upload frame to backend for AI face recognition
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
                    throw new Error(`Server returned error code: ${uploadResult.status}`);
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
                    throw new Error(`Server returned error code: ${attendanceResponse.status}`);
                }

                recognitionData = await attendanceResponse.json();
            }

            if (recognitionData && recognitionData.success) {
                const {
                    employeeName,
                    checkInTime,
                    checkInAt,
                    checkOutTime,
                    workingSeconds,
                    status,
                } = recognitionData;

                if (status === "CheckedIn") {
                    const resolvedCheckIn = checkInAt || checkInTime || new Date().toISOString();

                    setLastCheckIn({
                        name: employeeName || "Unknown Employee",
                        timestamp: resolvedCheckIn,
                        checkInTime: resolvedCheckIn,
                        status: "CheckedIn",
                    });

                    setAlert({
                        visible: true,
                        title: `Welcome, ${employeeName}! 👋`,
                        subtitle: "Check-in successful!",
                        message: "",
                        details: [
                            { label: "Check-in Time", value: formatTime(resolvedCheckIn) },
                        ],
                        large: true,
                        type: "success",
                        onConfirm: undefined,
                    });
                } else if (status === "CheckedOut") {
                    const resolvedCheckOut = checkOutTime || checkInTime || new Date().toISOString();
                    const resolvedCheckIn =
                        checkInAt ||
                        (lastCheckIn?.status === "CheckedIn" && lastCheckIn.name === employeeName
                            ? lastCheckIn.checkInTime || lastCheckIn.timestamp
                            : undefined);
                    const workingDuration = formatWorkingDuration(
                        resolvedCheckIn,
                        resolvedCheckOut,
                        workingSeconds
                    );

                    setLastCheckIn({
                        name: employeeName || "Unknown Employee",
                        timestamp: resolvedCheckOut,
                        checkInTime: resolvedCheckIn,
                        checkOutTime: resolvedCheckOut,
                        workingDuration,
                        status: "CheckedOut",
                    });

                    setAlert({
                        visible: true,
                        title: `Goodbye, ${employeeName}! 👋`,
                        subtitle: "Check-out successful!",
                        message: "Have a great rest of your day!",
                        details: [
                            ...(resolvedCheckIn
                                ? [{ label: "Check-in Time", value: formatTime(resolvedCheckIn) }]
                                : []),
                            { label: "Check-out Time", value: formatTime(resolvedCheckOut) },
                            { label: "Working Time", value: workingDuration, highlight: true },
                        ],
                        large: true,
                        type: "success",
                        onConfirm: undefined,
                    });
                } else {
                    const resolvedTime = checkInTime || new Date().toISOString();

                    setLastCheckIn({
                        name: employeeName || "Unknown Employee",
                        timestamp: resolvedTime,
                        checkInTime: resolvedTime,
                        status: status || "Processed",
                    });

                    setAlert({
                        visible: true,
                        title: recognitionData.message || "Attendance Processed",
                        subtitle: "",
                        message: `Status: ${status}`,
                        details: [{ label: "Time", value: formatTime(resolvedTime) }],
                        large: true,
                        type: "info",
                        onConfirm: undefined,
                    });
                }
            } else if (recognitionData) {
                const { status, message } = recognitionData;

                if (status === "UnknownFace") {
                    showSimpleAlert(
                        "Face Not Recognized",
                        "Face was not found in the staff registry or the image was blurry. Please try again.",
                        "error"
                    );
                } else if (status === "AlreadyCheckedOut") {
                    showSimpleAlert(
                        "Shift Completed",
                        "You have already completed check-out for today.",
                        "info"
                    );
                } else if (status === "NoShiftToday") {
                    showSimpleAlert(
                        "No Shift Assigned",
                        "You do not have any work shift assigned for today.",
                        "error"
                    );
                } else if (status === "WrongShiftTime") {
                    showSimpleAlert(
                        "Shift Not Started",
                        "It is not yet time for your assigned work shift.",
                        "error"
                    );
                } else if (status === "WrongProductionLine" || status === "WrongLocation") {
                    showSimpleAlert(
                        "Wrong Workstation",
                        "You are checking in at the wrong production line.",
                        "error"
                    );
                } else {
                    showSimpleAlert(
                        "Processing Failed",
                        message || "Could not process attendance data. Please try again.",
                        "error"
                    );
                }
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error("Capture Error Detail:", error);

            let errorMessage = "Could not connect to camera or server.";
            let errorTitle = "Connection Error";

            if (error.name === "AbortError") {
                errorTitle = "Request Timeout";
                errorMessage = "The server did not respond in time (exceeded 25 seconds). Please try again.";
            }

            showSimpleAlert(
                errorTitle,
                `${errorMessage}\n\nPlease verify your Wi-Fi network connection.`,
                "error"
            );
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
                        <Ionicons name="chevron-back" size={26} color="#0F172A" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Face Attendance Terminal</Text>

                    <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
                        <Ionicons name="refresh" size={22} color="#0F172A" />
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
                            <Text style={styles.loadingText}>Connecting to ESP32-CAM...</Text>
                            <Text style={styles.loadingSubtext}>Please keep your Wi-Fi connection stable</Text>
                        </Animated.View>
                    ) : (
                        <>
                            {/* Device Info Card (Clean White) */}
                            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.deviceCard}>
                                <View style={styles.deviceInfoLeft}>
                                    <View style={styles.deviceIconWrapper}>
                                        <Ionicons name="videocam" size={20} color="#2563EB" />
                                    </View>
                                    <View style={styles.deviceTextGroup}>
                                        <Text style={styles.deviceMainText}>ESP32-CAM Terminal</Text>
                                        <Text style={styles.deviceSubText}>
                                            {cameraIP ? `Device IP: ${cameraIP}` : "Camera searching..."}
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
                                        {cameraIP ? "Ready" : "Offline"}
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
                                                showSimpleAlert(
                                                    "Stream Connection Error",
                                                    "Failed to display live video stream. Please check camera power and network.",
                                                    "error"
                                                );
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
                                        <Ionicons name="videocam-off-outline" size={56} color="#94A3B8" />
                                        <Text style={styles.noStreamTitle}>No Camera Signal</Text>
                                        <Text style={styles.noStreamSub}>Please check ESP32 power and Wi-Fi connection</Text>
                                    </View>
                                )}
                            </Animated.View>

                            {/* Last Check-in / Check-out Result Card (Clean Light Green) */}
                            {lastCheckIn && (
                                <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.resultCard}>
                                    <View style={styles.resultHeader}>
                                        <View style={styles.resultBadge}>
                                            <Ionicons name="checkmark-circle" size={24} color="#059669" />
                                            <Text style={styles.resultBadgeText}>
                                                {lastCheckIn.status === "CheckedOut"
                                                    ? "Latest Check-out Result"
                                                    : "Latest Check-in Result"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.resultBody}>
                                        {/* Name Row */}
                                        <View style={styles.resultRowLarge}>
                                            <View style={styles.resultIconWrap}>
                                                <Ionicons name="person" size={24} color="#2563EB" />
                                            </View>
                                            <View style={styles.resultColLarge}>
                                                <Text style={styles.resultLabel}>Employee Name</Text>
                                                <Text style={styles.resultValueName}>{lastCheckIn.name}</Text>
                                            </View>
                                        </View>

                                        {lastCheckIn.status === "CheckedOut" ? (
                                            <>
                                                <View style={styles.resultRowSplit}>
                                                    <View style={styles.resultSubCol}>
                                                        <Text style={styles.resultLabel}>Check-in Time</Text>
                                                        <Text style={styles.resultValueSplitTime}>
                                                            {formatTime(lastCheckIn.checkInTime)}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.resultDivider} />

                                                    <View style={styles.resultSubCol}>
                                                        <Text style={styles.resultLabel}>Check-out Time</Text>
                                                        <Text style={styles.resultValueSplitTime}>
                                                            {formatTime(lastCheckIn.checkOutTime || lastCheckIn.timestamp)}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.resultRowDuration}>
                                                    <View style={styles.resultDurationIconWrap}>
                                                        <Ionicons name="time-outline" size={24} color="#059669" />
                                                    </View>
                                                    <View style={styles.resultColLarge}>
                                                        <Text style={styles.resultDurationLabel}>Working Time</Text>
                                                        <Text style={styles.resultValueDuration}>
                                                            {lastCheckIn.workingDuration || "N/A"}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.resultRowLarge}>
                                                <View style={styles.resultIconWrap}>
                                                    <Ionicons name="time-outline" size={24} color="#059669" />
                                                </View>
                                                <View style={styles.resultColLarge}>
                                                    <Text style={styles.resultLabel}>Check-in Time</Text>
                                                    <Text style={styles.resultValueTime}>
                                                        {formatTime(lastCheckIn.checkInTime || lastCheckIn.timestamp)}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </Animated.View>
                            )}

                            {/* Guidelines Card (Clean Light Canvas) */}
                            <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.guidelinesCard}>
                                <View style={styles.guidelinesHeader}>
                                    <View style={styles.guidelinesIconWrap}>
                                        <Ionicons name="scan-outline" size={20} color="#2563EB" />
                                    </View>
                                    <Text style={styles.guidelinesTitle}>Check-in Guidelines</Text>
                                </View>
                                <View style={styles.guidelinesList}>
                                    <View style={styles.guidelineRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 2, marginRight: 9 }} />
                                        <Text style={styles.guidelineText}>Align your face directly inside the circular guide.</Text>
                                    </View>
                                    <View style={styles.guidelineRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 2, marginRight: 9 }} />
                                        <Text style={styles.guidelineText}>Ensure balanced front lighting and avoid strong backlights.</Text>
                                    </View>
                                    <View style={styles.guidelineRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 2, marginRight: 9 }} />
                                        <Text style={styles.guidelineText}>Remove masks, hats, or dark sunglasses before scanning.</Text>
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
                                <Text style={styles.buttonText}>PROCESSING FACE RECOGNITION...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Ionicons name="camera" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                                <Text style={styles.buttonText}>CAPTURE & CHECK-IN</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                subtitle={alert.subtitle}
                message={alert.message}
                details={alert.details}
                large={alert.large}
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
        backgroundColor: "#F8FAFC",
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 28,
    },
    loadingContainer: {
        paddingVertical: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: "#0F172A",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 18,
    },
    loadingSubtext: {
        color: "#64748B",
        fontSize: 14,
        marginTop: 5,
    },
    deviceCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 16,
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
        width: 40,
        height: 40,
        borderRadius: 12,
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
        fontSize: 15.5,
        fontWeight: "700",
    },
    deviceSubText: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 2,
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
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
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusDotActive: {
        backgroundColor: "#059669",
    },
    statusDotInactive: {
        backgroundColor: "#DC2626",
    },
    statusPillText: {
        fontSize: 12.5,
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
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#0F172A",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        marginBottom: 18,
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
        width: 28,
        height: 28,
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
        fontSize: 16.5,
        fontWeight: "700",
        marginTop: 12,
    },
    noStreamSub: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 4,
    },
    resultCard: {
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 20,
        padding: 18,
        marginBottom: 18,
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    resultHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    resultBadge: {
        flexDirection: "row",
        alignItems: "center",
    },
    resultBadgeText: {
        color: "#166534",
        fontSize: 17,
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
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#DCFCE7",
    },
    resultIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
    },
    resultDurationIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#D1FAE5",
        justifyContent: "center",
        alignItems: "center",
    },
    resultColLarge: {
        marginLeft: 14,
        flex: 1,
    },
    resultLabel: {
        color: "#64748B",
        fontSize: 14.5,
        fontWeight: "600",
    },
    resultValueName: {
        color: "#0F172A",
        fontSize: 22,
        fontWeight: "800",
        marginTop: 2,
    },
    resultRowSplit: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#DCFCE7",
    },
    resultSubCol: {
        flex: 1,
    },
    resultValueTime: {
        color: "#0F172A",
        fontSize: 21,
        fontWeight: "800",
        marginTop: 2,
    },
    resultValueSplitTime: {
        color: "#0F172A",
        fontSize: 18,
        fontWeight: "800",
        marginTop: 2,
    },
    resultRowDuration: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#A7F3D0",
    },
    resultDurationLabel: {
        color: "#047857",
        fontSize: 14.5,
        fontWeight: "700",
    },
    resultValueDuration: {
        color: "#059669",
        fontSize: 22,
        fontWeight: "800",
        marginTop: 2,
    },
    resultDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#DCFCE7",
        marginHorizontal: 14,
    },
    guidelinesCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 20,
        padding: 18,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    guidelinesHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    guidelinesIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 9,
    },
    guidelinesTitle: {
        color: "#0F172A",
        fontSize: 15.5,
        fontWeight: "700",
    },
    guidelinesList: {
        gap: 9,
    },
    guidelineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    guidelineText: {
        color: "#334155",
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    bottomBar: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    captureButton: {
        height: 56,
        borderRadius: 16,
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
        fontSize: 16.5,
        fontWeight: "800",
        letterSpacing: 0.6,
    },
});
