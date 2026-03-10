import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LearningPath, type LevelNode, type NodeStatus } from "@/components/LearningPath";
import { SKILL_LABELS } from "@/components/SkillIcon";
import { useExamDetail, useStartExam } from "@/hooks/use-exams";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ExamBlueprint, Skill } from "@/types/api";

// ---------------------------------------------------------------------------
// Level generation from exam blueprint
// ---------------------------------------------------------------------------

const LEVEL_TEMPLATES: { skill: Skill; title: string }[] = [
  { skill: "listening", title: "Nghe hiểu cơ bản" },
  { skill: "reading", title: "Đọc hiểu đoạn văn" },
  { skill: "writing", title: "Viết đoạn ngắn" },
  { skill: "speaking", title: "Phát âm & trả lời" },
  { skill: "listening", title: "Nghe hội thoại" },
  { skill: "reading", title: "Đọc hiểu bài dài" },
  { skill: "writing", title: "Viết bài luận" },
  { skill: "speaking", title: "Thảo luận chủ đề" },
  { skill: "listening", title: "Nghe bài giảng" },
  { skill: "reading", title: "Tổng ôn tập" },
];

function buildLevels(bp: ExamBlueprint, completedSet: Set<number>): LevelNode[] {
  // Determine which skills this exam actually has
  const available = new Set<Skill>();
  for (const s of ["listening", "reading", "writing", "speaking"] as Skill[]) {
    if (bp[s] && bp[s]!.questionIds.length > 0) available.add(s);
  }

  // Filter templates to only include available skills, take first 10
  const filtered = LEVEL_TEMPLATES.filter((t) => available.has(t.skill)).slice(0, 10);
  // If we got fewer than the available templates, pad by cycling
  while (filtered.length < 10 && available.size > 0) {
    const skills = [...available];
    const idx = filtered.length % skills.length;
    filtered.push({
      skill: skills[idx],
      title: `${SKILL_LABELS[skills[idx]]} ${Math.ceil((filtered.length + 1) / skills.length)}`,
    });
  }

  // Find the first non-completed to mark as current
  let foundCurrent = false;
  return filtered.map((t, i) => {
    const id = i + 1;
    let status: NodeStatus;
    if (completedSet.has(id)) {
      status = "completed";
    } else if (!foundCurrent) {
      status = "current";
      foundCurrent = true;
    } else {
      status = "locked";
    }
    return { id, skill: t.skill, title: t.title, status };
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exam, isLoading, error } = useExamDetail(id!);
  const startExam = useStartExam();

  // Track completed levels locally (demo — persists within session only)
  const [completedIds, setCompletedIds] = useState<Set<number>>(() => new Set());

  const levels = useMemo(() => {
    if (!exam) return [];
    return buildLevels(exam.blueprint as ExamBlueprint, completedIds);
  }, [exam, completedIds]);

  const completedCount = completedIds.size;
  const totalCount = levels.length;

  const handleNodePress = useCallback(
    (level: LevelNode) => {
      if (level.status === "locked") return;

      if (level.status === "completed") {
        // Already completed — let user review (navigate to practice)
        router.push(`/(app)/practice/${level.skill}`);
        return;
      }

      // Current node — mark as completed to advance the path
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.add(level.id);
        return next;
      });

      // Navigate to practice for this skill
      router.push(`/(app)/practice/${level.skill}`);
    },
    [router],
  );

  if (isLoading) return <LoadingScreen />;
  if (error || !exam) return <ErrorScreen message={error?.message ?? "Không tìm thấy bài thi"} />;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Progress header */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border, paddingTop: insets.top + spacing.sm }]}>
        {/* Back + title row */}
        <View style={styles.headerTop}>
          <HapticTouchable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={c.foreground} />
          </HapticTouchable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.examTitle, { color: c.foreground }]}>Đề thi {exam.level}</Text>
            <Text style={[styles.examSub, { color: c.mutedForeground }]}>
              {completedCount}/{totalCount} hoàn thành
            </Text>
          </View>
          <ProgressRing completed={completedCount} total={totalCount} />
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: c.success,
                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              },
            ]}
          />
        </View>
      </View>

      {/* Learning path */}
      <LearningPath levels={levels} onNodePress={handleNodePress} />

      {/* Start full exam button (pinned bottom) */}
      {completedCount >= totalCount && (
        <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.border }]}>
          <HapticTouchable
            style={[styles.examBtn, { backgroundColor: c.primary, opacity: startExam.isPending ? 0.6 : 1 }]}
            onPress={() =>
              startExam.mutate(exam.id, {
                onSuccess: (session) => router.replace(`/(app)/session/${session.id}`),
              })
            }
            disabled={startExam.isPending}
          >
            <Ionicons name="rocket" size={18} color={c.primaryForeground} />
            <Text style={[styles.examBtnText, { color: c.primaryForeground }]}>
              {startExam.isPending ? "Đang bắt đầu..." : "Thi thật"}
            </Text>
          </HapticTouchable>
          {startExam.error && (
            <Text style={{ color: c.destructive, fontSize: fontSize.xs, marginTop: spacing.xs }}>
              {startExam.error.message}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress ring (mini)
// ---------------------------------------------------------------------------

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const c = useThemeColors();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <View style={[styles.ring, { borderColor: c.muted }]}>
      <Text style={[styles.ringText, { color: c.primary }]}>{pct}%</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md, // overridden inline with insets.top
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: { marginRight: spacing.sm },
  examTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  examSub: { fontSize: fontSize.xs, marginTop: 2 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  ringText: { fontSize: fontSize.xs, fontWeight: "700" },
  bottomBar: {
    padding: spacing.xl,
    borderTopWidth: 1,
  },
  examBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  examBtnText: { fontSize: fontSize.base, fontWeight: "700" },
});
