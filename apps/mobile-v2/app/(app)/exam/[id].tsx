import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useExam } from "@/hooks/use-exams";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { SkillIcon } from "@/components/SkillIcon";
import { MascotEmpty } from "@/components/MascotStates";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { FULL_TEST_COST, useCoins, spendCoins } from "@/features/coin/coin-store";
import type { Skill } from "@/types/api";

const SKILLS: { key: Skill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
];

export default function ExamDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exam, isLoading } = useExam(id ?? "");
  const coins = useCoins();

  function handleStart() {
    if (coins < FULL_TEST_COST) return;
    spendCoins(FULL_TEST_COST);
    router.push(`/(app)/session/${id}` as any);
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}> 
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (!exam) {
    return <MascotEmpty mascot="sad" title="Không tìm thấy đề thi" />;
  }

  const canAfford = coins >= FULL_TEST_COST;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.backRow}>
        <Ionicons name="arrow-back" size={22} color={c.foreground} onPress={() => router.back()} />
        <Text style={[styles.screenTitle, { color: c.foreground }]}>Chi tiết đề thi</Text>
      </View>

      <DepthCard style={styles.headerCard}>
        {exam.tags.map((tag) => (
          <View key={tag} style={[styles.tag, { backgroundColor: c.muted }]}> 
            <Text style={[styles.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
          </View>
        ))}
        <Text style={[styles.examTitle, { color: c.foreground }]}>{exam.title}</Text>
        {exam.description ? <Text style={[styles.examDesc, { color: c.mutedForeground }]}>{exam.description}</Text> : null}
      </DepthCard>

      <View style={styles.metaGrid}>
        <MetaCard icon="clock" label="Thời gian" value={`${exam.totalDurationMinutes} phút`} />
        <MetaCard icon="star" label="Hình thức" value="Thi thử đầy đủ" />
      </View>

      <DepthCard style={styles.skillsCard}>
        <Text style={[styles.cardSectionTitle, { color: c.foreground }]}>Cấu trúc bài thi</Text>
        <Text style={[styles.cardSectionSub, { color: c.mutedForeground }]}>Phiên thi gồm đủ 4 kỹ năng. Trong phiên thi thật, hệ thống sẽ tự lưu bài định kỳ và theo dõi thời gian còn lại.</Text>
        <View style={styles.skillRow}>
          {SKILLS.map((skill) => (
            <View key={skill.key} style={styles.skillItem}>
              <SkillIcon skill={skill.key} size={18} />
              <Text style={[styles.skillLabel, { color: c.mutedForeground }]}>{skill.label}</Text>
            </View>
          ))}
        </View>
      </DepthCard>

      <View style={[styles.ctaCard, { backgroundColor: canAfford ? c.primaryTint : c.destructiveTint, borderColor: canAfford ? c.primary + "30" : c.destructive + "30" }]}> 
        <View style={styles.costRow}>
          <GameIcon name="coin" size={20} />
          <Text style={[styles.costText, { color: canAfford ? c.coinDark : c.destructive }]}>Phí vào thi: {FULL_TEST_COST} xu</Text>
          <Text style={[styles.balanceText, { color: c.mutedForeground }]}>(Hiện có: {coins} xu)</Text>
        </View>
        {!canAfford ? (
          <Text style={[styles.notEnough, { color: c.destructive }]}>Bạn chưa đủ xu để bắt đầu phiên thi.</Text>
        ) : null}
      </View>

      <DepthButton fullWidth size="lg" onPress={handleStart} disabled={!canAfford} style={{ marginTop: spacing.sm }}>
        {canAfford ? "Bắt đầu thi thử" : "Chưa đủ xu"}
      </DepthButton>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof GameIcon>[0]["name"];
  label: string;
  value: string;
}) {
  const c = useThemeColors();
  return (
    <View style={[styles.metaCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
      <GameIcon name={icon} size={22} />
      <Text style={[styles.metaLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  screenTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  headerCard: { gap: spacing.sm },
  tag: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  examTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, lineHeight: 28 },
  examDesc: { fontSize: fontSize.sm, lineHeight: 20 },
  metaGrid: { flexDirection: "row", gap: spacing.sm },
  metaCard: { flex: 1, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", gap: 4, borderBottomColor: "#CACACA" },
  metaLabel: { fontSize: fontSize.xs },
  metaValue: { fontSize: fontSize.base, fontFamily: fontFamily.bold, textAlign: "center" },
  skillsCard: { gap: spacing.md },
  cardSectionTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  cardSectionSub: { fontSize: fontSize.xs, lineHeight: 18 },
  skillRow: { flexDirection: "row", gap: spacing.md },
  skillItem: { alignItems: "center", gap: 4 },
  skillLabel: { fontSize: 10 },
  ctaCard: { borderWidth: 1.5, borderRadius: radius.xl, padding: spacing.base, gap: spacing.xs },
  costRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  costText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  balanceText: { fontSize: fontSize.xs },
  notEnough: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
});
