import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { productionLineApi } from "../../api/productionLine.api";
import CustomAlert from "../../components/CustomAlert";
import { iotService } from "../../service/iot.service";
import { ProductionLine } from "../../types/api.types";
import { AppStackParamList } from "../../types/navigation.types";

type Props = NativeStackScreenProps<AppStackParamList, "AddIoTDevice">;

export function AddIoTDeviceScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(false);
    const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
    const [form, setForm] = useState({
        deviceName: "",
        deviceType: "ESP32-CAM", // Default
        lineId: "",
        locationDesc: "",
        ipAddress: "",
        macAddress: "",
    });

    const [alert, setAlert] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info" as "success" | "error" | "info",
        onConfirm: undefined as (() => void) | undefined,
    });

    React.useEffect(() => {
        fetchProductionLines();
    }, []);

    const fetchProductionLines = async () => {
        try {
            const data = await productionLineApi.getProductionLines();
            setProductionLines(data);
        } catch (error) {
            console.error("Error fetching production lines:", error);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const onSave = async () => {
        if (!form.deviceName.trim()) {
            setAlert({
                visible: true,
                title: "Validation Error",
                message: "Device Name is required",
                type: "error",
                onConfirm: undefined,
            });
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...form,
                lineId: form.lineId ? parseInt(form.lineId) : null,
            };
            await iotService.registerDevice(dataToSave);
            setAlert({
                visible: true,
                title: "Success",
                message: "IoT Device registered successfully!",
                type: "success",
                onConfirm: () => navigation.goBack(),
            });
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to register device";
            setAlert({
                visible: true,
                title: "Error",
                message: errorMessage,
                type: "error",
                onConfirm: undefined,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.flex}
                >
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Provision Node</Text>
                        <View style={{ width: 28 }} />
                    </Animated.View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.form}>

                            {/* Device Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Device Label *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="hardware-chip-outline" size={20} color="#4FACFE" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. ESP32-CAM-01"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={form.deviceName}
                                        onChangeText={(v) => handleInputChange("deviceName", v)}
                                    />
                                </View>
                            </View>

                            {/* Device Type */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Hardware Model</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="layers-outline" size={20} color="#4FACFE" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. ESP32-CAM"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={form.deviceType}
                                        onChangeText={(v) => handleInputChange("deviceType", v)}
                                    />
                                </View>
                            </View>

                            {/* Production Line */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Production Line</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                                    <TouchableOpacity
                                        style={[
                                            styles.selectorItem,
                                            form.lineId === "" && styles.selectorItemActive
                                        ]}
                                        onPress={() => handleInputChange("lineId", "")}
                                    >
                                        <Text style={[
                                            styles.selectorText,
                                            form.lineId === "" && styles.selectorTextActive
                                        ]}>
                                            NONE
                                        </Text>
                                    </TouchableOpacity>
                                    {productionLines.map((line) => (
                                        <TouchableOpacity
                                            key={line.id}
                                            style={[
                                                styles.selectorItem,
                                                form.lineId === line.id.toString() && styles.selectorItemActive
                                            ]}
                                            onPress={() => handleInputChange("lineId", line.id.toString())}
                                        >
                                            <Text style={[
                                                styles.selectorText,
                                                form.lineId === line.id.toString() && styles.selectorTextActive
                                            ]}>
                                                {line.lineName}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                {productionLines.length === 0 && (
                                    <Text style={styles.helperText}>No production lines found.</Text>
                                )}
                            </View>

                            {/* Location */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Deployment Zone</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location-outline" size={20} color="#4FACFE" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. Main Encampment"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={form.locationDesc}
                                        onChangeText={(v) => handleInputChange("locationDesc", v)}
                                    />
                                </View>
                            </View>

                            {/* IP Address */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Network IP</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="globe-outline" size={20} color="#4FACFE" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. 192.168.1.102"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={form.ipAddress}
                                        onChangeText={(v) => handleInputChange("ipAddress", v)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* MAC Address */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>MAC Identifier</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="finger-print-outline" size={20} color="#4FACFE" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. AA:BB:CC:DD:EE:FF"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={form.macAddress}
                                        onChangeText={(v) => handleInputChange("macAddress", v)}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, loading && styles.disabled]}
                                onPress={onSave}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={["#00F2FE", "#4FACFE"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>INITIALIZE NODE</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#F8F9FA",
        zIndex: 10,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1A1A1A",
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingBottom: 40,
    },
    form: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: "#666",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        marginLeft: 5,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 18,
        paddingHorizontal: 15,
        height: 58,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: "#1A1A1A",
        fontSize: 16,
    },
    selectorScroll: {
        flexDirection: "row",
        marginTop: 5,
    },
    selectorItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 15,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginRight: 10,
        minWidth: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    selectorItemActive: {
        borderColor: "#4FACFE",
        backgroundColor: "rgba(79, 172, 254, 0.1)",
    },
    selectorText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "600",
    },
    selectorTextActive: {
        color: "#4FACFE",
    },
    helperText: {
        fontSize: 12,
        color: "#FF4D4D",
        marginTop: 5,
        marginLeft: 5,
    },
    saveButton: {
        height: 64,
        borderRadius: 20,
        overflow: "hidden",
        marginTop: 30,
        elevation: 8,
        shadowColor: "#4FACFE",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    saveButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 2,
    },
    disabled: {
        opacity: 0.7,
    },
});



