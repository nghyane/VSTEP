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

type ExamMode = "full" | "custom";

export default function ExamDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useExam(id ?? "");
  const startMutation = useStartExamSession();

  const [mode, setMode] = useState<ExamMode>("full");
  const [selectedSkills, setSelectedSkills] = useState<SkillKey[]>(SKILL_ORDER);

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
    if (selectedSkills.includes(sk)) {
      if (selectedSkills.length > 1) setSelectedSkills(selectedSkills.filter((s) => s !== sk));
    } else {
      setSelectedSkills([...selectedSkills, sk].sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b)));
    }
  }

  function handleStart() {
    const finalSkills = mode === "full" ? availableSkills : selectedSkills;
    startMutation.mutate(
      { examId: id ?? "", mode, selectedSkills: finalSkills },
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
        {/* Tags */}
        {exam.tags.length > 0 && (
          <View style={s.tagRow}>
            {exam.tags.map((tag) => (
              <View key={tag} style={[s.tag, { backgroundColor: c.muted }]}>
                <Text style={[s.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Title */}
        <Text style={[s.examTitle, { color: c.foreground }]}>{exam.title}</Text>

        {/* Meta pills */}
        <View style={s.metaRow}>
          <MetaPill icon="time-outline" label={`${totalMinutes}`} unit="phút" c={c} />
          <MetaPill icon="layers-outline" label="4" unit="kỹ năng" c={c} />
          <MetaPill icon="clipboard-outline" label={`${totalMcq}`} unit="câu TN" c={c} />
          <MetaPill icon="create-outline" label={`${totalFreeResponse}`} unit="tự luận" c={c} />
        </View>
      </DepthCard>

      {/* Skill chips */}
      <DepthCard style={s.structCard}>
        <Text style={[s.sectionLabel, { color: c.subtle }]}>CẤU TRÚC BÀI THI</Text>
        {availableSkills.map((sk, i) => {
          const meta = SKILL_META[sk];
          let count = 0;
          let duration = 0;
          if (sk === "listening") { count = version.listeningSections.flatMap((s) => s.items).length; duration = version.listeningSections.reduce((a, s) => a + s.durationMinutes, 0); }
          if (sk === "reading") { count = version.readingPassages.flatMap((p) => p.items).length; duration = version.readingPassages.reduce((a, p) => a + p.durationMinutes, 0); }
          if (sk === "writing") { count = version.writingTasks.length; duration = version.writingTasks.reduce((a, t) => a + t.durationMinutes, 0); }
          if (sk === "speaking") { count = version.speakingParts.length; duration = version.speakingParts.reduce((a, p) => a + p.durationMinutes, 0); }
          return (
            <View key={sk} style={[s.skillRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }]}>
              <View style={[s.skillNum, { backgroundColor: meta.color + "20" }]}>
                <Text style={[s.skillNumText, { color: meta.color }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.skillName, { color: c.foreground }]}>{meta.label}</Text>
                <Text style={[s.skillMeta, { color: c.mutedForeground }]}>{count} câu · {duration} phút</Text>
              </View>
            </View>
          );
        })}
      </DepthCard>

      {/* Mode selector — segmented toggle */}
      {availableSkills.length > 1 && (
        <DepthCard style={s.modeCard}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>CHẾ ĐỘ LÀM BÀI</Text>
          <View style={s.segmentedWrap}>
            <View style={[s.segmented, { backgroundColor: c.muted }]}>
              <HapticTouchable
                onPress={() => {
                  setMode("full");
                  setSelectedSkills(availableSkills);
                }}
                style={[
                  s.segment,
                  mode === "full" && { backgroundColor: c.card },
                ]}
              >
                {mode === "full" && (
                  <View style={[s.segmentIndicator, { backgroundColor: c.primary }]} />
                )}
                <Text
                  style={[
                    s.segmentText,
                    { color: mode === "full" ? c.primary : c.subtle },
                  ]}
                >
                  Đầy đủ
                </Text>
              </HapticTouchable>
              <HapticTouchable
                onPress={() => setMode("custom")}
                style={[
                  s.segment,
                  mode === "custom" && { backgroundColor: c.card },
                ]}
              >
                {mode === "custom" && (
                  <View style={[s.segmentIndicator, { backgroundColor: c.primary }]} />
                )}
                <Text
                  style={[
                    s.segmentText,
                    { color: mode === "custom" ? c.primary : c.subtle },
                  ]}
                >
                  Tùy chọn
                </Text>
              </HapticTouchable>
            </View>
          </View>

          {mode === "custom" && (
            <View style={s.skillSelectRow}>
              {availableSkills.map((sk) => {
                const meta = SKILL_META[sk];
                const selected = selectedSkills.includes(sk);
                return (
                  <HapticTouchable
                    key={sk}
                    onPress={() => toggleSkill(sk)}
                    style={[
                      s.skillChip,
                      {
                        borderColor: selected ? meta.color : c.border,
                        backgroundColor: selected ? meta.color + "18" : c.card,
                      },
                    ]}
                  >
                    <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={16} color={selected ? meta.color : c.placeholder} />
                    <Text style={[s.skillChipText, { color: selected ? meta.color : c.mutedForeground }]}>{meta.label}</Text>
                  </HapticTouchable>
                );
              })}
            </View>
          )}
        </DepthCard>
      )}

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
        {startMutation.isPending ? "Đang tạo phiên thi..." : mode === "full" ? "Nhận đề & bắt đầu" : "Bắt đầu làm bài"}
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
  structCard: { gap: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.md },
  skillNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  skillNumText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  skillName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  skillMeta: { fontSize: fontSize.xs, marginTop: 2 },
  modeCard: { gap: spacing.md },
  segmentedWrap: { borderRadius: radius.md, overflow: "hidden" },
  segmented: { flexDirection: "row", borderRadius: radius.md, overflow: "hidden", borderWidth: 2, borderColor: themeColors.light.border },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  segmentIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  segmentText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  modeBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  skillSelectRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 2 },
  skillChipText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  notesCard: { gap: spacing.sm },
  noteRow: { flexDirection: "row", gap: spacing.sm },
  noteText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  errorText: { fontSize: fontSize.xs, textAlign: "center" },
});
