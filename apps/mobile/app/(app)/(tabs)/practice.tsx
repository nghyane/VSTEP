import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function PracticeHubScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={[styles.title, { color: c.foreground }]}>Luyện tập</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn chế độ phù hợp với bạn</Text>

      {/* Branch 1: Foundation */}
      <HapticTouchable
        style={[styles.branchCard, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => router.push("/(app)/practice/foundation")}
        activeOpacity={0.7}
      >
        <Ionicons name="school" size={32} color={c.primary} />
        <Text style={[styles.branchTitle, { color: c.foreground }]}>Luyện tập nền tảng</Text>
        <Text style={[styles.branchSub, { color: c.mutedForeground }]}>Từ vựng và ngữ pháp — nền móng cho mọi kỹ năng VSTEP</Text>
        <View style={styles.branchChips}>
          <Chip label="Từ vựng" color={c.primary} />
          <Chip label="Ngữ pháp" color={c.primary} />
        </View>
        <View style={[styles.branchCta, { backgroundColor: c.primary }]}>
          <Text style={[styles.branchCtaText, { color: c.primaryForeground }]}>Bắt đầu nền tảng</Text>
          <Ionicons name="arrow-forward" size={16} color={c.primaryForeground} />
        </View>
      </HapticTouchable>

      {/* Branch 2: Skills */}
      {/* Skills section — navigate to unified hub */}
      <HapticTouchable
        style={[styles.branchCard, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => router.push("/(app)/practice/skills")}
        activeOpacity={0.7}
      >
        <Ionicons name="fitness" size={32} color={c.skillListening} />
        <Text style={[styles.branchTitle, { color: c.foreground }]}>Luyện tập 4 kỹ năng</Text>
        <Text style={[styles.branchSub, { color: c.mutedForeground }]}>Nghe, Đọc, Viết, Nói — luyện đề theo từng kỹ năng VSTEP</Text>
        <View style={styles.branchChips}>
          <Chip label="Nghe" color={c.skillListening} />
          <Chip label="Đọc" color={c.skillReading} />
          <Chip label="Viết" color={c.skillWriting} />
          <Chip label="Nói" color={c.skillSpeaking} />
        </View>
        <View style={[styles.branchCta, { backgroundColor: c.skillListening }]}>
          <Text style={[styles.branchCtaText, { color: c.primaryForeground }]}>Bắt đầu luyện kỹ năng</Text>
          <Ionicons name="arrow-forward" size={16} color={c.primaryForeground} />
        </View>
      </HapticTouchable>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + "15" }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.xl },
  // Branch card
  branchCard: { borderWidth: 1, borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.sm },
  branchTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  branchSub: { fontSize: fontSize.sm, lineHeight: 20 },
  branchChips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  branchCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.xl, marginTop: spacing.sm },
  branchCtaText: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  // Skills section
});
