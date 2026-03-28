import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import { ScreenWrapper } from "@/components/ScreenWrapper";

export default function ClassesTab() {
  const c = useThemeColors();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: c.primary + "15" }]}>
          <Ionicons name="people-outline" size={48} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>Lớp học</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          Tính năng sắp ra mắt
        </Text>
        <Text style={[styles.description, { color: c.mutedForeground }]}>
          Bạn sẽ có thể tham gia lớp học, nhận phản hồi từ giảng viên và theo dõi tiến độ cùng bạn bè.
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  description: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
});
