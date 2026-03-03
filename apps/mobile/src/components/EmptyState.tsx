import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, fontSize, spacing } from "@/theme";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = "document-text-outline", title, subtitle }: Props) {
  const c = useThemeColors();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={c.mutedForeground} />
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"], minHeight: 200 },
  title: { fontSize: fontSize.lg, fontWeight: "600", marginTop: spacing.base, textAlign: "center" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: "center" },
});
