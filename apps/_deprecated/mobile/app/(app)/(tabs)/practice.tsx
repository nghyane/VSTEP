import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";

export default function PracticeHubScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={[styles.title, { color: c.foreground }]}>Luyện tập</Text>
      <Text style={[styles.subtitle, { color: c.subtle }]}>Chọn chế độ phù hợp với bạn</Text>

      {/* Branch 1: Foundation */}
      <HapticTouchable
        style={[styles.branchCard, { backgroundColor: c.surface, borderColor: c.border }]}
        onPress={() => router.push("/(app)/practice/foundation")}
        activeOpacity={0.7}
      >
        <Ionicons name="school" size={32} color={c.primary} />
        <Text style={[styles.branchTitle, { color: c.foreground }]}>Luyện tập nền tảng</Text>
        <Text style={[styles.branchSub, { color: c.subtle }]}>Học theo tốc độ riêng. Từ vựng và ngữ pháp — gốc rễ của mọi kỹ năng VSTEP.</Text>
        <View style={styles.featureList}>
          <FeatureRow icon="book" text="Từ vựng theo chủ đề với hệ thống SRS" />
          <FeatureRow icon="graduation" text="Ngữ pháp có cấu trúc, từ cơ bản đến nâng cao" />
        </View>
        <View style={styles.statRow}>
          <StatPill value="60+" label="chủ đề" />
          <StatPill value="200+" label="điểm ngữ pháp" />
          <StatPill value="SRS" label="lặp lại" />
        </View>
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
        style={[styles.branchCard, { backgroundColor: c.surface, borderColor: c.border }]}
        onPress={() => router.push("/(app)/practice/skills")}
        activeOpacity={0.7}
      >
        <Ionicons name="fitness" size={32} color={c.skillListening} />
        <Text style={[styles.branchTitle, { color: c.foreground }]}>Luyện tập 4 kỹ năng</Text>
        <Text style={[styles.branchSub, { color: c.subtle }]}>Luyện đủ bốn kỹ năng VSTEP. Bật hỗ trợ khi cần, tắt khi muốn tự thử sức.</Text>
        <View style={styles.featureList}>
          <FeatureRow icon="lightning" text="Bật/tắt chế độ hỗ trợ linh hoạt" />
          <FeatureRow icon="star" text="Chấm điểm chi tiết, giải thích từng câu" />
        </View>
        <View style={styles.statRow}>
          <StatPill value="4" label="kỹ năng" />
          <StatPill value="2" label="chế độ" />
          <StatPill value="AI" label="chấm điểm" />
        </View>
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

function FeatureRow({ icon, text }: { icon: any; text: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.featureRow}>
      <GameIcon name={icon} size={18} />
      <Text style={[styles.featureText, { color: c.subtle }]}>{text}</Text>
    </View>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.statPill, { backgroundColor: c.background }]}>
      <Text style={[styles.statPillValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.statPillLabel, { color: c.subtle }]}>{label}</Text>
    </View>
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
  branchCard: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.sm, backgroundColor: "#FFF" },
  branchTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  branchSub: { fontSize: fontSize.sm, lineHeight: 20 },
  featureList: { gap: spacing.sm, marginTop: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { fontSize: fontSize.xs, flex: 1, lineHeight: 18 },
  statRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  statPill: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.lg },
  statPillValue: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  statPillLabel: { fontSize: 10 },
  branchChips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  branchCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.xl, marginTop: spacing.sm },
  branchCtaText: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  // Skills section
});
