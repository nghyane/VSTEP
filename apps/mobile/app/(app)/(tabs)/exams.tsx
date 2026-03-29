import { useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useFadeIn } from "@/hooks/use-fade-in";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useExams } from "@/hooks/use-exams";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Exam, Skill } from "@/types/api";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_LABELS: Record<Skill, string> = {
  listening: "Nghe",
  reading: "Đọc",
  writing: "Viết",
  speaking: "Nói",
};
const SKILL_ICONS: Record<Skill, keyof typeof Ionicons.glyphMap> = {
  listening: "headset",
  reading: "book",
  writing: "create",
  speaking: "mic",
};
const LEVEL_COLORS: Record<string, { bg: [string, string]; text: string }> = {
  A2: { bg: ["#34B279", "#2D9D6A"], text: "#fff" },
  B1: { bg: ["#4B7BF5", "#3D65D4"], text: "#fff" },
  B2: { bg: ["#4F5BD5", "#3F49B5"], text: "#fff" },
  C1: { bg: ["#9B59D0", "#7C45A8"], text: "#fff" },
};

export default function ExamsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useExams({ type: "mock" });
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerFade = useFadeIn(0);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const exams = data?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} />
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: HEADER_H + insets.top + 8, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* ─── Summary Header ─── */}
        <Animated.View style={headerFade}>
          <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIconWrap, { backgroundColor: c.primary + "15" }]}>
                <Ionicons name="document-text" size={24} color={c.primary} />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryTitle, { color: c.foreground }]}>Đề thi VSTEP</Text>
                <Text style={[styles.summarySub, { color: c.mutedForeground }]}>
                  {exams.length} đề thi có sẵn
                </Text>
              </View>
            </View>
            <View style={styles.summaryStats}>
              {(["A2", "B1", "B2", "C1"] as const).map((lvl) => {
                const count = exams.filter((e) => e.level === lvl).length;
                if (count === 0) return null;
                const colors = LEVEL_COLORS[lvl] ?? LEVEL_COLORS.B1;
                return (
                  <View key={lvl} style={[styles.summaryStatBadge, { backgroundColor: colors.bg[0] + "18" }]}>
                    <Text style={[styles.summaryStatText, { color: colors.bg[0] }]}>{lvl}: {count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* ─── Exam Cards ─── */}
        {exams.length === 0 ? (
          <EmptyState title="Chưa có bài thi nào" icon="document-text-outline" />
        ) : (
          exams.map((exam, idx) => (
            <AnimatedExamCard
              key={exam.id}
              exam={exam}
              index={idx}
              onPress={() => router.push(`/(app)/exam/${exam.id}`)}
              colors={c}
            />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}

// ─── Animated Exam Card ──────────────────────────────────────────────────────

function AnimatedExamCard({
  exam,
  index,
  onPress,
  colors: c,
}: {
  exam: Exam;
  index: number;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const fade = useFadeIn(100 + index * 80);
  const levelStyle = LEVEL_COLORS[exam.level] ?? LEVEL_COLORS.B1;
  const sections = exam.sections ?? [];
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount ?? 0), 0) || null;

  return (
    <Animated.View style={fade}>
      <HapticTouchable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress}>
        {/* Level gradient strip */}
        <LinearGradient
          colors={levelStyle.bg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.levelStrip}
        >
          <Text style={styles.levelStripText}>{exam.level}</Text>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Title row */}
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: c.foreground }]} numberOfLines={1}>
              {exam.title}
            </Text>
            {exam.durationMinutes ? (
              <View style={[styles.durationBadge, { backgroundColor: c.muted }]}>
                <Ionicons name="time-outline" size={12} color={c.mutedForeground} />
                <Text style={[styles.durationText, { color: c.mutedForeground }]}>{exam.durationMinutes}’</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {exam.description ? (
            <Text style={[styles.descriptionText, { color: c.mutedForeground }]} numberOfLines={2}>
              {exam.description}
            </Text>
          ) : null}

          {/* Skills grid */}
          <View style={styles.skillsGrid}>
            {sections.length > 0 && SKILL_ORDER.map((skill) => {
              const matched = sections.filter((s) => s.skill === skill);
              const count = matched.reduce((sum, s) => sum + (s.questionCount ?? 0), 0);
              if (count === 0) return null;
              return (
                <SkillChip
                  key={skill}
                  skill={skill}
                  count={count}
                  colors={c}
                />
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={[styles.totalText, { color: c.mutedForeground }]}>
              {totalQuestions != null ? `${totalQuestions} câu hỏi` : `${exam.durationMinutes ?? '?'} phút`}
            </Text>
            <View style={[styles.startBtn, { backgroundColor: c.primary }]}>
              <Text style={[styles.startBtnText, { color: c.primaryForeground }]}>Bắt đầu</Text>
              <Ionicons name="arrow-forward" size={14} color={c.primaryForeground} />
            </View>
          </View>
        </View>
      </HapticTouchable>
    </Animated.View>
  );
}

// ─── Skill Chip ──────────────────────────────────────────────────────────────

function SkillChip({ skill, count, colors: c }: { skill: Skill; count: number; colors: ReturnType<typeof useThemeColors> }) {
  const skillColor = useSkillColor(skill);
  return (
    <View style={[styles.skillChip, { backgroundColor: skillColor + "10" }]}>
      <View style={[styles.skillChipIcon, { backgroundColor: skillColor + "20" }]}>
        <Ionicons name={SKILL_ICONS[skill]} size={14} color={skillColor} />
      </View>
      <View>
        <Text style={[styles.skillChipLabel, { color: skillColor }]}>{SKILL_LABELS[skill]}</Text>
        <Text style={[styles.skillChipCount, { color: c.mutedForeground }]}>{count} câu</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },

  // Summary
  summaryCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: { flex: 1 },
  summaryTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg },
  summarySub: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, marginTop: 2 },
  summaryStats: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  summaryStatBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  summaryStatText: { fontFamily: fontFamily.semiBold, fontSize: fontSize.xs },

  // Card
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  levelStrip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.base,
  },
  levelStripText: {
    color: "#fff",
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },
  cardBody: { padding: spacing.base, gap: spacing.md },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.base, flex: 1 },
  descriptionText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, lineHeight: 18 },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  durationText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs },

  // Skills
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  skillChipIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  skillChipLabel: { fontFamily: fontFamily.semiBold, fontSize: fontSize.xs },
  skillChipCount: { fontFamily: fontFamily.regular, fontSize: 11 },

  // Footer
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText: { fontFamily: fontFamily.regular, fontSize: fontSize.xs },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  startBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.xs },
});
