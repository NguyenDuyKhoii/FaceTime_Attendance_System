import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface CustomAlertDetailItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  subtitle?: string;
  details?: CustomAlertDetailItem[];
  large?: boolean;
  type?: "success" | "error" | "info";
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  subtitle,
  details,
  large = false,
  type = "info",
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
}: CustomAlertProps) {
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#F44336";
      default:
        return "#2196F3";
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertBox,
            large && styles.alertBoxLarge,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              large && styles.iconContainerLarge,
              { backgroundColor: getIconColor() + "20" },
            ]}
          >
            <Text style={[styles.icon, large && styles.iconLarge]}>{getIcon()}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, large && styles.titleLarge]}>{title}</Text>

          {/* Optional Subtitle */}
          {!!subtitle && (
            <Text
              style={[
                styles.subtitle,
                large && styles.subtitleLarge,
                type === "success" && styles.subtitleSuccess,
              ]}
            >
              {subtitle}
            </Text>
          )}

          {/* Optional Structured Details */}
          {details && details.length > 0 && (
            <View style={styles.detailsContainer}>
              {details.map((item, idx) => (
                <View
                  key={`${item.label}-${idx}`}
                  style={[
                    styles.detailRow,
                    item.highlight && styles.detailRowHighlight,
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      item.highlight && styles.detailLabelHighlight,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      item.highlight && styles.detailValueHighlight,
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Message */}
          {!!message && (
            <Text style={[styles.message, large && styles.messageLarge]}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {onConfirm && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                large && styles.buttonLarge,
                styles.confirmButton,
                { backgroundColor: getIconColor() },
                !onConfirm && styles.singleButton,
              ]}
              onPress={() => {
                if (onConfirm) {
                  onConfirm();
                }
                onClose();
              }}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  large && styles.confirmButtonTextLarge,
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  alertBoxLarge: {
    maxWidth: 380,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 26,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainerLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 18,
  },
  icon: {
    fontSize: 32,
  },
  iconLarge: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    textAlign: "center",
  },
  titleLarge: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 33,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitleLarge: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 18,
  },
  subtitleSuccess: {
    color: "#059669",
  },
  detailsContainer: {
    width: "100%",
    gap: 10,
    marginBottom: 18,
  },
  detailRow: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  detailRowHighlight: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  detailLabelHighlight: {
    color: "#047857",
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailValueHighlight: {
    fontSize: 23,
    color: "#059669",
  },
  message: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  messageLarge: {
    fontSize: 16.5,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 24,
    marginBottom: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLarge: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  singleButton: {
    flex: 1,
  },
  confirmButton: {
    backgroundColor: "#2196F3",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  confirmButtonTextLarge: {
    fontSize: 18.5,
    fontWeight: "800",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
