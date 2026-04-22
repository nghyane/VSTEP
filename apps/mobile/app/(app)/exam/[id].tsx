import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useExamDetail, useStartExamSession, type SkillKey, type ExamDetail } from "@/hooks/use-exams";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameIcon } from "@/components/GameIcon";
import { computeSessionCost, useCoins } from "@/features/coin/coin-store";
import { TopUpDialog } from "@/features/coin/TopUpDialog";
import { Mascot } from "@/components/Mascot";

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"];

const SKILL_META: Record<SkillKey, { label: string; shortLabel: string }> = {
  listening: { label: "Listening", shortLabel: "Nghe" },
  reading: { label: "Reading", shortLabel: "Đọc" },
  writing: { label: "Writing", shortLabel: "Viết" },
  speaking: { label: "Speaking", shortLabel: "Nói" },
};

function getSkillMinutes(skill: SkillKey, detail: ExamDetail): number {
  const v = detail.version;
  if (skill === "listening") return v.listeningSections.reduce((s, x) => s + x.durationMinutes, 0);
  if (skill === "reading") return v.readingPassages.reduce((s, x) => s + x.durationMinutes, 0);
  if (skill === "writing") return v.writingTasks.reduce((s, x) => s + x.durationMinutes, 0);
  return v.speakingParts.reduce((s, x) => s + x.durationMinutes, 0);
}

function getSkillCount(skill: SkillKey, detail: ExamDetail): number {
  const v = detail.version;
  if (skill === "listening") return v.listeningSections.reduce((s, x) => s + x.items.length, 0);
  if (skill === "reading") return v.readingPassages.reduce((s, x) => s + x.items.length, 0);
  if (skill === "writing") return v.writingTasks.length;
  return v.speakingParts.length;
}

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: detail, isLoading } = useExamDetail(id);
  const [selected, setSelected] = useState<Set<SkillKey>>(new Set());
  const [topUpVisible, setTopUpVisible] = useState(false);
  const coins = useCoins();
  const startSession = useStartExamSession();

  if (isLoading) return <LoadingScreen />;
  if (!detail) return null;

  const { exam, version } = detail;
  const isFullTest = selected.size === 0;
  const cost = computeSessionCost(selected.size === 0 ? 4 : selected.size);
  const insufficient = coins < cost;

  const totalMinutes = isFullTest
    ? exam.totalDurationMinutes
    : SKILL_ORDER.filter((s) => selected.has(s)).reduce((sum, s) => sum + getSkillMinutes(s, detail), 0);

  function toggleSkill(skill: SkillKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  function handleStart() {
    if (insufficient) {
      setTopUpVisible(true);
      return;
    }
    const skills = isFullTest ? SKILL_ORDER : Array.from(selected);
    startSession.mutate(
      { examId: exam.id, mode: isFullTest ? "full" : "custom", selectedSkills: skills },
      {
        onSuccess: (res) => router.push(`/(app)/session/${res.sessionId}`),
        onError: (e) => Alert.alert("Lỗi", e instanceof Error ? e.message : "Không thể bắt đầu"),
      }
    );
  }

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.base }]}>
        {/* Back */}
        <DepthButton
          onPress={handleStart}
          disabled={startSession.isPending}
          variant={insufficient ? "secondary" : "primary"}
          size="md"
          fullWidth
        >
          {startSession.isPending ? "Đang bắt đầu..." : isFullTest ? "Làm full test" : "Bắt đầu luyện tập"}
        </DepthButton>
      </View>

      <TopUpDialog visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl },
  backBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.lg },
  backText: { fontSize: fontSize.sm },
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  examTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, lineHeight: 30 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.sm },
  summaryBar: { flexDirection: "row", borderWidth: 1, borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.xl },
  summaryCell: { flex: 1, alignItems: "center", paddingVertical: spacing.md, gap: 2 },
  summaryCellLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  summaryCellMin: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  summaryCellCount: { fontSize: 10 },
  selectorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  selectorTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  selectorHint: { fontSize: fontSize.xs },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1.5, borderRadius: radius.xl, padding: spacing.base, marginBottom: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  accentBar: { width: 4, height: 32, borderRadius: 2 },
  skillLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  skillDesc: { fontSize: fontSize.xs, marginTop: 1 },
  skillStats: { alignItems: "flex-end" },
  skillMin: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  skillCount: { fontSize: fontSize.xs },
  mascotHint: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  mascotText: { fontSize: fontSize.sm, textAlign: "center" },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.base, borderTopWidth: 2, gap: spacing.base },
  bottomInfo: { flex: 1, gap: 2 },
  bottomLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  bottomMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bottomMetaText: { fontSize: fontSize.xs },
  coinBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  coinText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  startBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  startBtnText: { color: "#FFF", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
