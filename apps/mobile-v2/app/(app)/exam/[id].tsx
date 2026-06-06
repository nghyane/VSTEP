import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useExam } from "@/hooks/use-exams";
import { useRestartExamSession, useStartExamSession } from "@/hooks/use-exam-session";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { CoinButton } from "@/features/coin/CoinButton";
import { useWalletBalance } from "@/features/wallet/queries";
import { useThemeColors, colors as themeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { formatNumber } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import type { ExamSessionResult } from "@/types/api";

type SkillKey = "listening" | "reading" | "writing" | "speaking";

const SKILL_META: Record<SkillKey, { label: string; color: string; icon: string }> = {
  listening: { label: "Nghe", color: themeColors.light.skillListening, icon: "headset" },
  reading: { label: "Đọc", color: themeColors.light.skillReading, icon: "book" },
  writing: { label: "Viết", color: themeColors.light.skillWriting, icon: "create" },
  speaking: { label: "Nói", color: themeColors.light.skillSpeaking, icon: "mic" },
};

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"];

const DURATION_MODES: { key: "standard" | "slow" | "fast"; label: string; desc: string }[] = [
  { key: "standard", label: "Chuẩn", desc: "" },
  { key: "slow", label: "Luyện chậm", desc: "+20 phút" },
  { key: "fast", label: "Ôn tập nhanh", desc: "−10 phút" },
];

export default function ExamDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useExam(id ?? "");
  const { data: wallet } = useWalletBalance();
  const startMutation = useStartExamSession();
  const restartMutation = useRestartExamSession();

  const [selectedSkills, setSelectedSkills] = useState<Set<SkillKey>>(new Set(SKILL_ORDER));
  const [expanded, setExpanded] = useState<Set<SkillKey>>(new Set());
  const [durationMode, setDurationMode] = useState<"standard" | "slow" | "fast">("standard");

  const availableSkills = SKILL_ORDER.filter((sk) => {
    const summary = detail?.skillSummaries?.[sk];
    return !!summary && (summary.durationMinutes > 0 || summary.itemCount > 0 || summary.partCount > 0);
  });

  if (isLoading) {
    return <View style={[s.center, { backgroundColor: c.background }]}><ActivityIndicator color={c.primary} size="large" /></View>;
  }
  if (!detail) {
    return <MascotEmpty mascot="think" title="Không tìm thấy đề thi" subtitle="" />;
  }

  const { exam } = detail;
  const activeSameExam = detail.attemptState.activeCurrentVersionSession && new Date(detail.attemptState.activeCurrentVersionSession.serverDeadlineAt).getTime() > Date.now()
    ? detail.attemptState.activeCurrentVersionSession
    : null;
  const isFull = availableSkills.length > 0 && availableSkills.every((skill) => selectedSkills.has(skill));
  const selectedAvailableSkills = availableSkills.filter((skill) => selectedSkills.has(skill));
  const finalSelectedSkills = isFull ? availableSkills : selectedAvailableSkills;
  const fullCost = detail.pricing.fullTestCostCoins;
  const perSkillCost = detail.pricing.customPerSkillCoins;
  const coinCost = isFull ? fullCost : Math.min(fullCost, perSkillCost * selectedAvailableSkills.length);
  const balance = wallet?.balance ?? null;
  const insufficient = balance != null && balance < coinCost;
  const examHistory = detail.attemptState.history.filter((session) => session.submittedAt);

  const skillTotals = getSkillTotals(detail.skillSummaries);
  const totalMinutes = finalSelectedSkills.reduce((sum, sk) => sum + skillTotals[sk].minutes, 0);
  const totalMcq = skillTotals.listening.count + skillTotals.reading.count;
  const totalFreeResponse = skillTotals.writing.count + skillTotals.speaking.count;
  const displayMinutes = durationMode === "slow" ? totalMinutes + 20 : durationMode === "fast" ? Math.max(1, totalMinutes - 10) : totalMinutes;

  function toggleSkill(sk: SkillKey) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk); else next.add(sk);
      return next;
    });
  }

  function toggleExpand(sk: SkillKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk); else next.add(sk);
      return next;
    });
  }

  function handleStart() {
    if (insufficient) {
      Alert.alert("Không đủ xu", `Cần ${formatNumber(coinCost)} xu. Số dư: ${formatNumber(balance ?? 0)} xu.`, [
        { text: "Quay lại", style: "cancel" },
        { text: "Nạp xu", onPress: () => router.push("/(app)/topup" as never) },
      ]);
      return;
    }
    if (activeSameExam) {
      Alert.alert("Làm mới phiên thi?", "Phiên đang làm sẽ bị hủy và tạo phiên mới.", [
        { text: "Ở lại", style: "cancel" },
        { text: "Làm mới", style: "destructive", onPress: startFreshSession },
      ]);
      return;
    }
    startFreshSession();
  }

  function startFreshSession() {
    if (!isFull && finalSelectedSkills.length === 0) return;
    const finalSkills = finalSelectedSkills.sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b));
    const baseMinutes = finalSkills.reduce((sum, sk) => sum + skillTotals[sk].minutes, 0);
    const factor = baseMinutes > 0 ? displayMinutes / baseMinutes : 1.0;
    const payload = { examId: id ?? "", mode: isFull ? "full" as const : "custom" as const, selectedSkills: finalSkills, timeExtensionFactor: factor };
    const onSuccess = (res: { sessionId: string }) => router.push(`/(app)/session/${res.sessionId}` as never);
    if (activeSameExam) restartMutation.mutate({ ...payload, abandonSessionId: activeSameExam.id }, { onSuccess });
    else startMutation.mutate(payload, { onSuccess });
  }

  function handleContinue() {
    if (!activeSameExam) return;
    router.push(`/(app)/session/${activeSameExam.id}?examId=${exam.id}&resume=1` as never);
  }

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <HapticTouchable onPress={() => router.back()} style={s.backRow}>
            <Ionicons name="arrow-back" size={20} color={c.foreground} />
            <Text style={[s.backText, { color: c.foreground }]}>Chi tiết đề thi</Text>
          </HapticTouchable>
          <CoinButton />
        </View>

        {/* Header */}
        <View style={s.headerCard}>
          {exam.tags.length > 0 && (
            <View style={s.tagRow}>
              {exam.tags.map((tag) => (
                <View key={tag} style={[s.tag, { backgroundColor: c.background, borderColor: c.border }]}>
                  <Text style={[s.tagText, { color: c.subtle }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[s.examTitle, { color: c.foreground }]}>{exam.title}</Text>

          {/* 3 stat cards */}
          <View style={s.statRow}>
            <StatCard
              icon="time-outline"
              value={`${availableSkills.reduce((sum, sk) => sum + skillTotals[sk].minutes, 0)}`}
              label="phút"
              color={c.info}
              c={c}
            />
            <StatCard icon="clipboard-outline" value={`${totalMcq}`} label="câu trắc nghiệm" color={c.primary} c={c} />
            <StatCard icon="create-outline" value={`${totalFreeResponse}`} label="phần tự luận" color={c.warning} c={c} />
          </View>
        </View>

        {/* Active session banner */}
        {activeSameExam && (
          <DepthCard style={s.activeCard}>
            <View style={s.activeRow}>
              <View style={[s.activeIcon, { backgroundColor: c.warningTint }]}>
                <Ionicons name="time-outline" size={18} color={c.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.activeTitle, { color: c.foreground }]}>Đang làm dở đề này</Text>
                <Text style={[s.activeSub, { color: c.mutedForeground }]}>Tiếp tục hoặc làm mới từ đầu.</Text>
              </View>
            </View>
            <DepthButton fullWidth onPress={handleContinue}>Tiếp tục làm bài</DepthButton>
          </DepthCard>
        )}

        {/* Skill selector */}
        <DepthCard style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: c.foreground }]}>Chọn phần luyện tập</Text>
            <Text style={[s.selectionCount, { color: c.subtle }]}>
              {isFull ? "Full test" : `${selectedSkills.size} kỹ năng`}
            </Text>
          </View>

          {availableSkills.map((sk) => {
            const meta = SKILL_META[sk];
            const isSelected = selectedSkills.has(sk);
            const isExp = expanded.has(sk);
            const totals = skillTotals[sk];

            return (
              <View key={sk} style={[s.skillCard, { borderColor: isSelected ? meta.color : c.border, borderLeftColor: isSelected ? meta.color : c.border, borderLeftWidth: isSelected ? 4 : 2 }]}>
                <HapticTouchable onPress={() => toggleSkill(sk)} style={[s.skillRow, isSelected && { backgroundColor: `${meta.color}0a` }]}>
                  <View style={[s.checkbox, { borderColor: isSelected ? meta.color : c.border, backgroundColor: isSelected ? meta.color : c.surface }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.skillLabel, { color: c.foreground }]}>{meta.label}</Text>
                    <Text style={[s.skillMeta, { color: c.mutedForeground }]}>{totals.count} {totals.unit} · {totals.minutes} phút</Text>
                  </View>
                  <HapticTouchable onPress={() => toggleExpand(sk)} hitSlop={8}>
                    <Ionicons name={isExp ? "chevron-up" : "chevron-down"} size={16} color={c.mutedForeground} />
                  </HapticTouchable>
                </HapticTouchable>

                {isExp ? (
                  <View style={[s.partRow, { borderTopWidth: 1, borderTopColor: c.borderLight }]}> 
                    <Text style={[s.partLabel, { color: c.foreground }]}>Tổng quan</Text>
                    <Text style={[s.partMeta, { color: c.mutedForeground }]}>{totals.count} {totals.unit} · {totals.minutes} phút</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </DepthCard>

        {/* Duration mode selector */}
        <DepthCard style={s.durationCard}>
          <Text style={[s.durationTitle, { color: c.mutedForeground }]}>THỜI GIAN LUYỆN TẬP</Text>
          {DURATION_MODES.map(({ key, label, desc }) => {
            const mins = key === "slow" ? totalMinutes + 20 : key === "fast" ? Math.max(1, totalMinutes - 10) : totalMinutes;
            const active = durationMode === key;
            return (
              <HapticTouchable key={key} onPress={() => setDurationMode(key)} style={[s.modeRow, active && { backgroundColor: `${c.primary}10`, borderColor: `${c.primary}40` }]}>
                <View style={[s.radio, { borderColor: active ? c.primary : c.border }]}>
                  {active && <View style={[s.radioDot, { backgroundColor: c.primary }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modeLabel, { color: active ? c.primaryDark : c.foreground }]}>{label}</Text>
                  {desc !== "" && <Text style={[s.modeDesc, { color: c.subtle }]}>{desc}</Text>}
                </View>
                <Text style={[s.modeMins, { color: c.foreground }]}>{mins} phút</Text>
              </HapticTouchable>
            );
          })}
          <View style={[s.totalRow, { backgroundColor: c.background, borderColor: c.borderLight }]}>
            <Text style={[s.totalLabel, { color: c.mutedForeground }]}>Tổng</Text>
            <Text style={[s.totalValue, { color: c.foreground }]}>{displayMinutes} phút</Text>
          </View>
        </DepthCard>

        {/* Notes */}
        <DepthCard style={s.notesCard}>
          <Text style={[s.notesTitle, { color: c.subtle }]}>LƯU Ý</Text>
          {["Sau khi chuyển phần, không thể quay lại.", "Câu trả lời tự động lưu.", "Bấm \"Nộp bài\" khi hoàn thành."].map((note) => (
            <View key={note} style={s.noteRow}>
              <Text style={{ color: c.primary, fontSize: 14 }}>·</Text>
              <Text style={[s.noteText, { color: c.mutedForeground }]}>{note}</Text>
            </View>
          ))}
        </DepthCard>

        {examHistory.length > 0 ? (
          <DepthCard style={s.historyCard}>
            <View style={s.historyHeader}>
              <View>
                <Text style={[s.historyEyebrow, { color: c.subtle }]}>LỊCH SỬ LÀM BÀI</Text>
                <Text style={[s.historyTitle, { color: c.foreground }]}>Xem lại kết quả thi thử</Text>
              </View>
              <Text style={[s.historyCount, { color: c.mutedForeground }]}>{examHistory.length}</Text>
            </View>
            <View style={s.historyList}>
              {examHistory.slice(0, 5).map((session) => (
                <HapticTouchable
                  key={session.id}
                  onPress={() => router.push(`/(app)/exam-result/${session.id}` as never)}
                  style={[s.historyRow, { borderColor: c.borderLight, backgroundColor: c.surfaceTint }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.historyDate, { color: c.foreground }]}>{formatSessionDate(session.submittedAt ?? session.startedAt)}</Text>
                    <Text style={[s.historyMeta, { color: c.mutedForeground }]}>{historyModeLabel(session)}</Text>
                  </View>
                  <View style={s.historyScoreWrap}>
                    <Text style={[s.historyScore, { color: c.primaryDark }]}>{historyScoreLabel(session)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={c.subtle} />
                  </View>
                </HapticTouchable>
              ))}
            </View>
          </DepthCard>
        ) : null}

        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>

      {/* Bottom sticky button */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + spacing.sm, backgroundColor: c.surface, borderTopColor: c.border }]}>
        <DepthButton
          fullWidth
          size="lg"
          onPress={handleStart}
          disabled={startMutation.isPending || restartMutation.isPending || (!isFull && finalSelectedSkills.length === 0)}
        >
          {startMutation.isPending || restartMutation.isPending
            ? "Đang tạo phiên thi..."
            : getStartLabel(insufficient, activeSameExam != null, isFull, coinCost)}
        </DepthButton>
        {startMutation.error || restartMutation.error ? (
          <Text style={[s.startError, { color: c.destructive }]}> 
            Không tạo được phiên thi: {getApiErrorMessage(startMutation.error ?? restartMutation.error)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Helpers ──

function getSkillTotals(summaries: NonNullable<ReturnType<typeof useExam>["data"]>["skillSummaries"]): Record<SkillKey, { minutes: number; count: number; unit: string }> {
  return {
    listening: { minutes: summaries.listening?.durationMinutes ?? 0, count: summaries.listening?.itemCount ?? 0, unit: "câu" },
    reading: { minutes: summaries.reading?.durationMinutes ?? 0, count: summaries.reading?.itemCount ?? 0, unit: "câu" },
    writing: { minutes: summaries.writing?.durationMinutes ?? 0, count: summaries.writing?.partCount ?? 0, unit: "phần" },
    speaking: { minutes: summaries.speaking?.durationMinutes ?? 0, count: summaries.speaking?.partCount ?? 0, unit: "phần" },
  };
}

function getStartLabel(insufficient: boolean, hasActive: boolean, isFull: boolean, cost: number): string {
  if (insufficient) return "Nạp xu";
  if (hasActive) return "Làm mới";
  return isFull ? `Nhận đề · ${cost} xu` : `Bắt đầu · ${cost} xu`;
}

function StatCard({ icon, value, label, color, c }: { icon: string; value: string; label: string; color: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={[s.statCard, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
      <View style={[s.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[s.statValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function historyScoreLabel(session: ExamSessionResult): string {
  const scores = session.scores;
  const values = scores ? Object.values(scores).filter((score): score is number => typeof score === "number") : [];
  if (values.length === 0) return statusLabel(session.status);
  const avg = values.reduce((sum, score) => sum + score, 0) / values.length;
  return `${avg.toFixed(1)}/10`;
}

function historyModeLabel(session: ExamSessionResult): string {
  const mode = session.isFullTest ? "Full test" : "Thi từng kỹ năng";
  return `${mode} · ${statusLabel(session.status)}`;
}

function formatSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}, ${date.toLocaleDateString("vi-VN")}`;
}

function statusLabel(status: string): string {
  if (status === "graded") return "Đã chấm";
  if (status === "grading" || status === "submitted" || status === "auto_submitted") return "Đang chấm";
  if (status === "abandoned") return "Đã hủy";
  return status;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  headerCard: { gap: spacing.md, marginBottom: spacing.xs },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  examTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, lineHeight: 32 },
  statRow: { flexDirection: "row", gap: spacing.sm },
  statCard: { flex: 1, alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  statIcon: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  statLabel: { fontSize: 10, fontFamily: fontFamily.medium, textAlign: "center" },
  activeCard: { gap: spacing.md },
  activeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  activeIcon: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  activeTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  activeSub: { fontSize: fontSize.xs, marginTop: 2 },
  sectionCard: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  selectionCount: { fontSize: fontSize.xs },
  skillCard: { borderWidth: 2, borderRadius: radius.lg, overflow: "hidden" },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  skillLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  skillMeta: { fontSize: fontSize.xs, marginTop: 1 },
  partRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  partLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  partMeta: { fontSize: fontSize.xs },
  notesCard: { gap: spacing.xs },
  notesTitle: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  noteRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  historyCard: { gap: spacing.md },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  historyEyebrow: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  historyTitle: { marginTop: 2, fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  historyCount: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  historyList: { gap: spacing.sm },
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  historyDate: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  historyMeta: { marginTop: 2, fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  historyScoreWrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  historyScore: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  durationCard: { gap: spacing.sm },
  durationTitle: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  modeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: "transparent" },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  modeLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  modeDesc: { fontSize: fontSize.xs, marginTop: 1 },
  modeMins: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  totalLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  totalValue: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1 },
  startError: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, textAlign: "center", marginTop: spacing.xs },
});
