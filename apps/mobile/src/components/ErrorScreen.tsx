import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message = "Đã xảy ra lỗi", onRetry }: Props) {
  const c = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Ionicons name="alert-circle-outline" size={48} color={c.destructive} />
      <Text style={[styles.message, { color: c.foreground }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.primary }]}
          onPress={onRetry}
        >
          <Text style={{ color: c.primaryForeground, fontFamily: fontFamily.semiBold, fontSize: fontSize.sm }}>
            Thử lại
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"] },
  message: { fontSize: fontSize.base, marginTop: spacing.base, textAlign: "center", fontFamily: fontFamily.regular },
  button: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg },
});
