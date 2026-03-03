import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon } from "@/components/SkillIcon";
import { useExams } from "@/hooks/use-exams";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { Exam, ExamBlueprint, Skill } from "@/types/api";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function ExamsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useExams();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const exams = data?.data ?? [];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Bài thi</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn đề thi để bắt đầu luyện tập</Text>
      </View>
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Chưa có bài thi nào" icon="document-text-outline" />}
        renderItem={({ item }) => <ExamCard exam={item} onPress={() => router.push(`/(app)/exam/${item.id}`)} colors={c} />}
      />
    </ScreenWrapper>
  );
}

function ExamCard({ exam, onPress, colors: c }: { exam: Exam; onPress: () => void; colors: ReturnType<typeof useThemeColors> }) {
  const bp = exam.blueprint as ExamBlueprint;
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.levelBadge, { backgroundColor: c.primary + "18" }]}>
          <Text style={[styles.levelText, { color: c.primary }]}>{exam.level}</Text>
        </View>
        {bp.durationMinutes ? (
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
            <Text style={[styles.durationText, { color: c.mutedForeground }]}>{bp.durationMinutes} phút</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.skillsRow}>
        {SKILL_ORDER.map((skill) => {
          const section = bp[skill];
          if (!section || section.questionIds.length === 0) return null;
          return (
            <View key={skill} style={styles.skillBadge}>
              <SkillIcon skill={skill} size={14} />
              <Text style={[styles.skillBadgeText, { color: c.mutedForeground }]}>
                {section.questionIds.length} câu
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  list: { padding: spacing.xl, paddingTop: 0, gap: spacing.md },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  levelBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm },
  levelText: { fontSize: fontSize.xs, fontWeight: "700" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  durationText: { fontSize: fontSize.xs },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillBadge: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  skillBadgeText: { fontSize: fontSize.xs },
});
