import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useExamDetail, useStartExam } from "@/hooks/use-exam-session";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { ExamBlueprint, Skill } from "@/types/api";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const { data: exam, isLoading, error } = useExamDetail(id!);
  const startExam = useStartExam();

  if (isLoading) return <LoadingScreen />;
  if (error || !exam) return <ErrorScreen message={error?.message ?? "Không tìm thấy bài thi"} />;

  const bp = exam.blueprint as ExamBlueprint;

  function handleStart() {
    startExam.mutate(exam!.id, {
      onSuccess: (session) => router.replace(`/(app)/session/${session.id}`),
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Đề thi {exam.level}</Text>
        {bp.durationMinutes ? (
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={16} color={c.mutedForeground} />
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>Thời gian: {bp.durationMinutes} phút</Text>
          </View>
        ) : null}

        <View style={styles.skillsGrid}>
          {SKILL_ORDER.map((skill) => {
            const section = bp[skill];
            if (!section || section.questionIds.length === 0) return null;
            return <SkillRow key={skill} skill={skill} count={section.questionIds.length} colors={c} />;
          })}
        </View>

        {!exam.isActive && (
          <View style={[styles.inactiveBox, { backgroundColor: c.destructive + "15" }]}>
            <Text style={{ color: c.destructive, fontSize: fontSize.sm }}>Bài thi hiện không khả dụng.</Text>
          </View>
        )}
      </View>

      {startExam.error && (
        <Text style={{ color: c.destructive, fontSize: fontSize.sm, paddingHorizontal: spacing.xl }}>
          Lỗi: {startExam.error.message}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: c.primary, opacity: !exam.isActive || startExam.isPending ? 0.6 : 1 }]}
        onPress={handleStart}
        disabled={!exam.isActive || startExam.isPending}
      >
        <Text style={[styles.startText, { color: c.primaryForeground }]}>
          {startExam.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SkillRow({ skill, count, colors: c }: { skill: Skill; count: number; colors: ReturnType<typeof useThemeColors> }) {
  const skillColor = useSkillColor(skill);
  return (
    <View style={[styles.skillRow, { backgroundColor: skillColor + "15" }]}>
      <SkillIcon skill={skill} size={18} />
      <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, flex: 1 }}>{SKILL_LABELS[skill]}</Text>
      <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{count} câu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.lg },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.base },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skillsGrid: { gap: spacing.sm },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.lg, padding: spacing.md },
  inactiveBox: { borderRadius: radius.lg, padding: spacing.md },
  startBtn: { borderRadius: radius.lg, paddingVertical: spacing.base, alignItems: "center" },
  startText: { fontSize: fontSize.base, fontWeight: "700" },
});
