import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useExam } from "@/hooks/use-exams";
import { useStartExamSession } from "@/hooks/use-exam-session";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { MascotEmpty } from "@/components/MascotStates";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const SKILL_COLORS: Record<string, string> = {
  listening: "#1CB0F6",
  reading: "#7850C8",
  writing: "#58CC02",
  speaking: "#FFC800",
};
const SKILL_LABELS: Record<string, string> = {
  listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói",
};

export default function ExamDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useExam(id ?? "");
  const startMutation = useStartExamSession();

  function handleStart() {
    startMutation.mutate(
      { examId: id ?? "", mode: "full" },
      { onSuccess: (res) => router.push(`/(app)/session/${res.sessionId}?examId=${id}` as any) },
    );
  }

  if (isLoading) {
    return <View style={[s.center, { backgroundColor: c.background }]}><ActivityIndicator color={c.primary} size="large" /></View>;
  }
  if (!detail) {
    return <MascotEmpty mascot="think" title="Không tìm thấy đề thi" subtitle="" />;
  }

  const { exam, version } = detail;
  const skills = ["listening", "reading", "writing", "speaking"].filter((sk) => {
    if (sk === "listening") return version.listeningSections.length > 0;
    if (sk === "reading") return version.readingPassages.length > 0;
    if (sk === "writing") return version.writingTasks.length > 0;
    if (sk === "speaking") return version.speakingParts.length > 0;
    return false;
  });

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Thi thử</Text>
      </HapticTouchable>

      {/* Header */}
      <DepthCard style={s.headerCard}>
        <View style={s.tagRow}>
          {exam.tags.map((tag) => (
            <View key={tag} style={[s.tag, { backgroundColor: c.muted }]}>
              <Text style={[s.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.examTitle, { color: c.foreground }]}>{exam.title}</Text>
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={14} color={c.subtle} />
          <Text style={[s.metaText, { color: c.mutedForeground }]}>{exam.totalDurationMinutes} phút</Text>
        </View>
      </DepthCard>

      {/* Cấu trúc */}
      <DepthCard style={s.structCard}>
        <Text style={[s.sectionLabel, { color: c.subtle }]}>CẤU TRÚC BÀI THI</Text>
        {skills.map((sk, i) => {
          const color = SKILL_COLORS[sk];
          let count = 0;
          let duration = 0;
          if (sk === "listening") { count = version.listeningSections.flatMap((s) => s.items).length; duration = version.listeningSections.reduce((a, s) => a + s.durationMinutes, 0); }
          if (sk === "reading") { count = version.readingPassages.flatMap((p) => p.items).length; duration = version.readingPassages.reduce((a, p) => a + p.durationMinutes, 0); }
          if (sk === "writing") { count = version.writingTasks.length; duration = version.writingTasks.reduce((a, t) => a + t.durationMinutes, 0); }
          if (sk === "speaking") { count = version.speakingParts.length; duration = version.speakingParts.reduce((a, p) => a + p.durationMinutes, 0); }
          return (
            <View key={sk} style={[s.skillRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }]}>
              <View style={[s.skillNum, { backgroundColor: color + "20" }]}>
                <Text style={[s.skillNumText, { color }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.skillName, { color: c.foreground }]}>{SKILL_LABELS[sk]}</Text>
                <Text style={[s.skillMeta, { color: c.mutedForeground }]}>{count} câu · {duration} phút</Text>
              </View>
            </View>
          );
        })}
      </DepthCard>

      {/* Lưu ý */}
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
        {startMutation.isPending ? "Đang tạo phiên thi..." : "Nhận đề & bắt đầu"}
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.xs },
  structCard: { gap: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.md },
  skillNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  skillNumText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  skillName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  skillMeta: { fontSize: fontSize.xs, marginTop: 2 },
  notesCard: { gap: spacing.sm },
  noteRow: { flexDirection: "row", gap: spacing.sm },
  noteText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  errorText: { fontSize: fontSize.xs, textAlign: "center" },
});
