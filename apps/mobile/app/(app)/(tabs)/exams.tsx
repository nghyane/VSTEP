import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { CoinButton } from "@/features/coin/CoinButton";
import { TopUpDialog } from "@/features/coin/TopUpDialog";
import { FULL_TEST_COST } from "@/features/coin/coin-store";
import { useExams } from "@/hooks/use-exams";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Exam, Skill } from "@/types/api";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function ExamsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useExams({ type: "mock" });
  const [topUpVisible, setTopUpVisible] = useState(false);

  if (isLoading) return <LoadingScreen />;
  const exams = data?.data ?? [];

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}>
      {/* Header with coin */}
      <View style={s.headerRow}>
        <View>
          <Text style={[s.title, { color: c.foreground }]}>Thi thử VSTEP</Text>
          <Text style={[s.subtitle, { color: c.mutedForeground }]}>Luyện đề bám sát cấu trúc thật</Text>
        </View>
        <CoinButton onPress={() => setTopUpVisible(true)} />
      </View>

      {/* Exam cards */}
      <View style={s.grid}>
        {exams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} onPress={() => router.push(`/(app)/exam/${exam.id}`)} />
        ))}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
      <TopUpDialog visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
    </ScrollView>
  );
}

function ExamCard({ exam, onPress }: { exam: Exam; onPress: () => void }) {
  const c = useThemeColors();

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.8}>
      <DepthCard>
        <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>{exam.title}</Text>

        {/* Meta */}
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
          <Text style={[s.metaText, { color: c.mutedForeground }]}>172 phút</Text>
          <Ionicons name="help-circle-outline" size={14} color={c.mutedForeground} style={{ marginLeft: spacing.md }} />
          <Text style={[s.metaText, { color: c.mutedForeground }]}>80 câu</Text>
        </View>

        {/* Skill chips */}
        <View style={s.chipRow}>
          {SKILL_ORDER.map((sk) => (
            <SkillChipInline key={sk} skill={sk} />
          ))}
        </View>

        {/* Footer — coin cost */}
        <View style={[s.cardFooter, { borderTopColor: c.border }]}>
          <View style={s.coinCost}>
            <GameIcon name="coin" size={16} />
            <Text style={[s.coinText, { color: c.coinDark }]}>{FULL_TEST_COST} xu</Text>
          </View>
          <View style={[s.ctaBtn, { backgroundColor: c.primary }]}>
            <Text style={s.ctaBtnText}>Làm bài</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </View>
        </View>
      </DepthCard>
    </HapticTouchable>
  );
}

function SkillChipInline({ skill }: { skill: Skill }) {
  const color = useSkillColor(skill);
  return (
    <View style={s.skillChip}>
      <SkillIcon skill={skill} size={14} />
      <Text style={[s.skillChipText, { color }]}>{SKILL_LABELS[skill]}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xl },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  grid: { gap: spacing.base },
  // Card
  cardTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.semiBold, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  metaText: { fontSize: fontSize.sm },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "transparent" },
  skillChipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.md },
  coinCost: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  coinText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  ctaBtnText: { color: "#FFF", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
