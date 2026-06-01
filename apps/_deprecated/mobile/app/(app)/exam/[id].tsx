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
  reading:   { label: "Reading",   shortLabel: "Đọc" },
  writing:   { label: "Writing",   shortLabel: "Viết" },
  speaking:  { label: "Speaking",  shortLabel: "Nói" },
};

function getSkillMinutes(skill: SkillKey, detail: ExamDetail): number {
  const v = detail.version;
  if (skill === "listening") return v.listeningSections.reduce((s, x) => s + x.durationMinutes, 0);
  if (skill === "reading")   return v.readingPassages.reduce((s, x) => s + x.durationMinutes, 0);
  if (skill === "writing")   return v.writingTasks.reduce((s, x) => s + x.durationMinutes, 0);
  return v.speakingParts.reduce((s, x) => s + x.durationMinutes, 0);
}

function getSkillCount(skill: SkillKey, detail: ExamDetail): number {
  const v = detail.version;
  if (skill === "listening") return v.listeningSections.reduce((s, x) => s + x.items.length, 0);
  if (skill === "reading")   return v.readingPassages.reduce((s, x) => s + x.items.length, 0);
  if (skill === "writing")   return v.writingTasks.length;
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

  const { exam } = detail;
  const isFullTest = selected.size === 0;
  const cost = computeSessionCost(isFullTest ? 4 : selected.size);
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
    if (insufficient) { setTopUpVisible(true); return; }
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
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <HapticTouchable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.mutedForeground} />
          <Text style={[s.backText, { color: c.mutedForeground }]}>Thư viện đề thi</Text>
        </HapticTouchable>

        {/* Header */}
        <View style={s.header}>
          {exam.tags.length > 0 && (
            <View style={s.tagRow}>
              {exam.tags.map((tag) => (
                <View key={tag} style={[s.tag, { backgroundColor: c.muted, borderColor: c.border }]}>
                  <Text style={[s.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[s.examTitle, { color: c.foreground }]}>{exam.title}</Text>
          <View style={s.metaRow}>
            <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
            <Text style={[s.metaText, { color: c.mutedForeground }]}>{exam.totalDurationMinutes} phút</Text>
          </View>
        </View>

        {/* Summary bar */}
        <View style={[s.summaryBar, { backgroundColor: c.card, borderColor: c.border }]}>
          {SKILL_ORDER.map((skill, i) => {
            const color = useSkillColor(skill);
            const minutes = getSkillMinutes(skill, detail);
            const count = getSkillCount(skill, detail);
            const unit = skill === "writing" || skill === "speaking" ? "phần" : "câu";
            return (
              <View
                key={skill}
                style={[s.summaryCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.border }]}
              >
                <Text style={[s.summaryCellLabel, { color }]}>{SKILL_META[skill].shortLabel}</Text>
                <Text style={[s.summaryCellMin, { color: c.foreground }]}>{minutes} phút</Text>
                <Text style={[s.summaryCellCount, { color: c.mutedForeground }]}>{count} {unit}</Text>
              </View>
            );
          })}
        </View>

        {/* Section selector */}
        <View style={s.selectorHeader}>
          <Text style={[s.selectorTitle, { color: c.foreground }]}>Chọn kỹ năng luyện tập</Text>
          <Text style={[s.selectorHint, { color: c.mutedForeground }]}>
            {selected.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selected.size} kỹ năng đã chọn`}
          </Text>
        </View>

        {SKILL_ORDER.map((skill) => {
          const isSelected = selected.has(skill);
          const color = useSkillColor(skill);
          const minutes = getSkillMinutes(skill, detail);
          const count = getSkillCount(skill, detail);
          const unit = skill === "writing" || skill === "speaking" ? "phần" : "câu";
          return (
            <HapticTouchable
              key={skill}
              style={[
                s.skillRow,
                {
                  backgroundColor: isSelected ? color + "12" : c.card,
                  borderColor: isSelected ? color + "60" : c.border,
                },
              ]}
              onPress={() => toggleSkill(skill)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, { borderColor: isSelected ? color : c.border, backgroundColor: isSelected ? color : "transparent" }]}>
                {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
              </View>
              <View style={[s.accentBar, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.skillLabel, { color }]}>{SKILL_META[skill].label}</Text>
                <Text style={[s.skillDesc, { color: c.mutedForeground }]}>{SKILL_LABELS[skill]}</Text>
              </View>
              <View style={s.skillStats}>
                <Text style={[s.skillMin, { color: c.foreground }]}>{minutes} phút</Text>
                <Text style={[s.skillCount, { color: c.mutedForeground }]}>{count} {unit}</Text>
              </View>
            </HapticTouchable>
          );
        })}

        {selected.size === 4 && (
          <View style={s.mascotHint}>
            <Mascot name="happy" size={60} animation="bounce" />
            <Text style={[s.mascotText, { color: c.mutedForeground }]}>Full test! Cố lên nhé 💪</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[s.bottomBar, { backgroundColor: c.card, borderTopColor: c.primary + "30" }]}>
        <View style={s.bottomInfo}>
          <Text style={[s.bottomLabel, { color: c.foreground }]}>
            {isFullTest ? "Làm full test" : `${selected.size} kỹ năng`}
          </Text>
          <View style={s.bottomMeta}>
            <Ionicons name="time-outline" size={13} color={c.mutedForeground} />
            <Text style={[s.bottomMetaText, { color: c.mutedForeground }]}>~{totalMinutes} phút</Text>
            <View style={s.coinBadge}>
              <GameIcon name="coin" size={14} />
              <Text style={[s.coinText, { color: insufficient ? c.destructive : c.coinDark }]}>{cost} xu</Text>
            </View>
          </View>
        </View>
        <DepthButton
          onPress={handleStart}
          disabled={startSession.isPending}
          variant={insufficient ? "secondary" : "primary"}
          size="md"
        >
          {startSession.isPending
            ? "Đang bắt đầu..."
            : isFullTest
              ? "Làm full test"
              : "Bắt đầu luyện tập"}
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
});
