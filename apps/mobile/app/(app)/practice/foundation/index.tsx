import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function FoundationHubScreen() {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <ScreenWrapper>
      <ScreenHeader title="Luyện tập nền tảng" />
      <View style={styles.content}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>
          Học từ vựng và ngữ pháp có hệ thống — nền móng cho cả bốn kỹ năng VSTEP.
        </Text>

        <HapticTouchable
          style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push("/(app)/vocabulary")}
          activeOpacity={0.7}
        >
          <Ionicons name="language" size={32} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>Luyện từ vựng</Text>
            <Text style={[styles.cardDesc, { color: c.mutedForeground }]}>Học từ theo chủ đề với hệ thống SRS</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
        </HapticTouchable>

        <HapticTouchable
          style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push("/(app)/practice/grammar")}
          activeOpacity={0.7}
        >
          <Ionicons name="book" size={32} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>Luyện ngữ pháp</Text>
            <Text style={[styles.cardDesc, { color: c.mutedForeground }]}>Lý thuyết + bài tập trắc nghiệm</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.base },
  desc: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.sm },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.base, borderWidth: 1, borderRadius: radius["2xl"], padding: spacing.lg },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  cardDesc: { fontSize: fontSize.xs, marginTop: 2 },
});
