import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useExam } from "@/hooks/use-exams";
import { useStartExamSession } from "@/hooks/use-exam-session";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useThemeColors, colors as themeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type SkillKey = "listening" | "reading" | "writing" | "speaking";

const SKILL_META: Record<SkillKey, { label: string; color: string; icon: string }> = {
  listening: { label: "Nghe", color: themeColors.light.skillListening, icon: "headset" },
  reading: { label: "Đọc", color: themeColors.light.skillReading, icon: "book" },
  writing: { label: "Viết", color: themeColors.light.skillWriting, icon: "create" },
  speaking: { label: "Nói", color: themeColors.light.skillSpeaking, icon: "mic" },
};

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"];

export default function ExamDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useExam(id ?? "");
  const startMutation = useStartExamSession();

  const [selectedSkills, setSelectedSkills] = useState<Set<SkillKey>>(new Set(SKILL_ORDER));
  const [expanded, setExpanded] = useState<Set<SkillKey>>(new Set());

  const version = detail?.version;
  const availableSkills = SKILL_ORDER.filter((sk) => {
    if (!version) return false;
    if (sk === "listening") return version.listeningSections.length > 0;
    if (sk === "reading") return version.readingPassages.length > 0;
    if (sk === "writing") return version.writingTasks.length > 0;
    if (sk === "speaking") return version.speakingParts.length > 0;
    return false;
  });

  if (isLoading) {
    return <View style={[s.center, { backgroundColor: c.background }]}><ActivityIndicator color={c.primary} size="large" /></View>;
  }
  if (!detail || !version) {
    return <MascotEmpty mascot="think" title="Không tìm thấy đề thi" subtitle="" />;
  }

  const { exam } = detail;
  const isFull = selectedSkills.size === 0 || selectedSkills.size === availableSkills.length;

  const totalMcq =
    version.listeningSections.reduce((sum, sec) => sum + sec.items.length, 0) +
    version.readingPassages.reduce((sum, p) => sum + p.items.length, 0);
  const totalFreeResponse = version.writingTasks.length + version.speakingParts.length;
  const totalMinutes =
    version.listeningSections.reduce((sum, sec) => sum + sec.durationMinutes, 0) +
    version.readingPassages.reduce((sum, p) => sum + p.durationMinutes, 0) +
    version.writingTasks.reduce((sum, t) => sum + t.durationMinutes, 0) +
    version.speakingParts.reduce((sum, p) => sum + p.durationMinutes, 0);

  function toggleSkill(sk: SkillKey) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk);
      else next.add(sk);
      return next;
    });
  }

  function toggleExpand(sk: SkillKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk);
      else next.add(sk);
      return next;
    });
  }

  function handleStart() {
    const finalSkills = isFull ? availableSkills : Array.from(selectedSkills).sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b));
    startMutation.mutate(
      { examId: id ?? "", mode: isFull ? "full" : "custom", selectedSkills: finalSkills },
      { onSuccess: (res) => router.push(`/(app)/session/${res.sessionId}?examId=${id}` as any) },
    );
  }

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Thi thử</Text>
      </HapticTouchable>

      {/* Header card */}
      <DepthCard style={s.headerCard}>
        {exam.tags.length > 0 && (
          <View style={s.tagRow}>
            {exam.tags.map((tag) => (
              <View key={tag} style={[s.tag, { backgroundColor: c.muted }]}>
                <Text style={[s.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[s.examTitle, { color: c.foreground }]}>{exam.title}</Text>
        <View style={s.metaRow}>
          <MetaPill icon="time-outline" label={`${totalMinutes}`} unit="phút" c={c} />
          <MetaPill icon="layers-outline" label="4" unit="kỹ năng" c={c} />
          <MetaPill icon="clipboard-outline" label={`${totalMcq}`} unit="câu TN" c={c} />
          <MetaPill icon="create-outline" label={`${totalFreeResponse}`} unit="tự luận" c={c} />
        </View>
      </DepthCard>

      {/* Skill selector rows — FE v3 SectionSelector pattern */}
      <DepthCard style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>CHỌN PHẦN LUYỆN TẬP</Text>
          <Text style={[s.selectionCount, { color: c.mutedForeground }]}>
            {selectedSkills.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selectedSkills.size} kỹ năng đã chọn`}
          </Text>
        </View>

        {availableSkills.map((sk, i) => {
          const meta = SKILL_META[sk];
          const isSelected = selectedSkills.has(sk);
          const isExp = expanded.has(sk);
          let count = 0;
          let duration = 0;
          if (sk === "listening") { count = version.listeningSections.flatMap((s) => s.items).length; duration = version.listeningSections.reduce((a, s) => a + s.durationMinutes, 0); }
          if (sk === "reading") { count = version.readingPassages.flatMap((p) => p.items).length; duration = version.readingPassages.reduce((a, p) => a + p.durationMinutes, 0); }
          if (sk === "writing") { count = version.writingTasks.length; duration = version.writingTasks.reduce((a, t) => a + t.durationMinutes, 0); }
          if (sk === "speaking") { count = version.speakingParts.length; duration = version.speakingParts.reduce((a, p) => a + p.durationMinutes, 0); }

          return (
            <View key={sk} style={[s.skillRowWrap, i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }]}>
              {/* Main row — tap anywhere to toggle selection */}
              <HapticTouchable onPress={() => toggleSkill(sk)} style={s.skillRow}>
                {/* Checkbox */}
                <View style={[s.checkbox, {
                  borderColor: isSelected ? meta.color : c.border,
                  backgroundColor: isSelected ? meta.color : c.surface,
                }]}>
                  {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>

                {/* Icon + label */}
                <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                <Text style={[s.skillLabel, { color: meta.color }]}>{meta.label}</Text>
                <Text style={[s.skillCount, { color: c.mutedForeground }]}>{count} câu · {duration} phút</Text>

                {/* Badge */}
                <View style={[s.badge, {
                  borderColor: isSelected ? "transparent" : c.border,
                  backgroundColor: isSelected ? `${c.foreground}0a` : c.surface,
                }]}>
                  <Text style={[s.badgeText, { color: isSelected ? c.mutedForeground : c.foreground }]}>
                    {isSelected ? "Bỏ chọn" : "Chọn"}
                  </Text>
                </View>

                {/* Chevron */}
                <HapticTouchable onPress={(e: any) => { e.stopPropagation(); toggleExpand(sk); }} style={s.chevron}>
                  <Ionicons name={isExp ? "chevron-up" : "chevron-down"} size={16} color={c.mutedForeground} />
                </HapticTouchable>
              </HapticTouchable>

              {/* Expanded parts */}
              {isExp && (
                <View style={s.partsList}>
                  {sk === "listening" && version.listeningSections.map((sec, idx) => (
                    <View key={sec.id} style={[s.partRow, idx > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }, { backgroundColor: isSelected ? `${meta.color}0a` : c.background }]}>
                      <Text style={[s.partLabel, { color: c.foreground }]}>Phần {sec.part}</Text>
                      <Text style={[s.partMeta, { color: c.mutedForeground }]}>{sec.items.length} câu · {sec.durationMinutes} phút</Text>
                    </View>
                  ))}
                  {sk === "reading" && version.readingPassages.map((p, idx) => (
                    <View key={p.id} style={[s.partRow, idx > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }, { backgroundColor: isSelected ? `${meta.color}0a` : c.background }]}>
                      <Text style={[s.partLabel, { color: c.foreground }]}>Phần {p.part}</Text>
                      <Text style={[s.partMeta, { color: c.mutedForeground }]}>{p.items.length} câu · {p.durationMinutes} phút</Text>
                    </View>
                  ))}
                  {sk === "writing" && version.writingTasks.map((t, idx) => (
                    <View key={t.id} style={[s.partRow, idx > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }, { backgroundColor: isSelected ? `${meta.color}0a` : c.background }]}>
                      <Text style={[s.partLabel, { color: c.foreground }]}>{t.taskType === "letter" ? `Viết thư (${t.minWords} từ)` : `Viết luận (${t.minWords} từ)`}</Text>
                      <Text style={[s.partMeta, { color: c.mutedForeground }]}>1 bài · {t.durationMinutes} phút</Text>
                    </View>
                  ))}
                  {sk === "speaking" && version.speakingParts.map((p, idx) => (
                    <View key={p.id} style={[s.partRow, idx > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }, { backgroundColor: isSelected ? `${meta.color}0a` : c.background }]}>
                      <Text style={[s.partLabel, { color: c.foreground }]}>{getSpeakingTypeLabel(p.type)}</Text>
                      <Text style={[s.partMeta, { color: c.mutedForeground }]}>{p.durationMinutes} phút</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </DepthCard>

      {/* Notes */}
      <DepthCard style={s.notesCard}>
        <Text style={[s.sectionLabel, { color: c.subtle }]}>LƯU Ý</Text>
        {[
          "Sau khi chuyển phần, không thể quay lại phần trước.",
          "Thoát khỏi phòng thi sẽ tự động nộp bài.",
          "Nghe/Đọc chấm ngay. Viết/Nói AI chấm sau.",
        ].map((note) => (
          <View key={note} style={s.noteRow}>
            <Text style={{ color: c.primary }}>·</Text>
            <Text style={[s.noteText, { color: c.mutedForeground }]}>{note}</Text>
          </View>
        ))}
      </DepthCard>

      <DepthButton
        fullWidth
        size="lg"
        onPress={handleStart}
        disabled={startMutation.isPending}
      >
        {startMutation.isPending ? "Đang tạo phiên thi..." : isFull ? "Nhận đề & bắt đầu" : "Bắt đầu làm bài"}
      </DepthButton>

      {startMutation.isError && (
        <Text style={[s.errorText, { color: c.destructive }]}>
          Không thể bắt đầu. Kiểm tra kết nối và thử lại.
        </Text>
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function getSpeakingTypeLabel(type: string): string {
  const map: Record<string, string> = { social: "Giao tiếp xã hội", solution: "Đề xuất giải pháp", topic: "Thảo luận chủ đề" };
  return map[type] ?? type;
}

function MetaPill({ icon, label, unit, c }: { icon: string; label: string; unit: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={s.metaPill}>
      <Ionicons name={icon as any} size={14} color={c.subtle} />
      <Text style={[s.metaPillLabel, { color: c.foreground }]}>{label}</Text>
      <Text style={[s.metaPillUnit, { color: c.mutedForeground }]}>{unit}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  headerCard: { gap: spacing.sm },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  examTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, lineHeight: 28 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaPill: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaPillLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  metaPillUnit: { fontSize: fontSize.xs },
  sectionCard: { gap: spacing.md },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  selectionCount: { fontSize: fontSize.xs },
  skillRowWrap: { paddingTop: spacing.md },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  skillLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, flex: 1 },
  skillCount: { fontSize: fontSize.xs },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, borderWidth: 2 },
  badgeText: { fontSize: 10, fontFamily: fontFamily.bold },
  chevron: { padding: 4 },
  partsList: { marginTop: spacing.xs },
  partRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  partLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, flex: 1 },
  partMeta: { fontSize: fontSize.xs },
  notesCard: { gap: spacing.sm },
  noteRow: { flexDirection: "row", gap: spacing.sm },
  noteText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  errorText: { fontSize: fontSize.xs, textAlign: "center" },
});
