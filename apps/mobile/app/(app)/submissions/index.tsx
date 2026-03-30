import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BouncyFlatList } from "@/components/BouncyScrollView";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useExamSessions } from "@/hooks/use-exam-session";
import { useSubmissions } from "@/hooks/use-submissions";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { Skill, ExamSessionWithExam, Submission, SubmissionStatus } from "@/types/api";

type Tab = "sessions" | "submissions";

export default function HistoryScreen() {
  const c = useThemeColors();
  const [tab, setTab] = useState<Tab>("sessions");

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Lịch sử</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Xem lại bài thi và kết quả chấm</Text>
      </View>
      <View style={styles.tabRow}>
        <HapticTouchable
          style={[styles.tabBtn, tab === "sessions" && { backgroundColor: c.primary + "15", borderColor: c.primary }]}
          onPress={() => setTab("sessions")}
        >
          <Ionicons name="document-text-outline" size={14} color={tab === "sessions" ? c.primary : c.mutedForeground} />
          <Text style={{ color: tab === "sessions" ? c.primary : c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>Phiên thi</Text>
        </HapticTouchable>
        <HapticTouchable
          style={[styles.tabBtn, tab === "submissions" && { backgroundColor: c.primary + "15", borderColor: c.primary }]}
          onPress={() => setTab("submissions")}
        >
          <Ionicons name="create-outline" size={14} color={tab === "submissions" ? c.primary : c.mutedForeground} />
          <Text style={{ color: tab === "submissions" ? c.primary : c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>Bài chấm AI</Text>
        </HapticTouchable>
      </View>
      {tab === "sessions" ? <SessionsList /> : <SubmissionsList />}
    </ScreenWrapper>
  );
}

function SessionsList() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useExamSessions({ status: "completed", limit: 50 });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const sessions = data?.data ?? [];

  return (
    <BouncyFlatList
      data={sessions}
      keyExtractor={(item: ExamSessionWithExam) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<EmptyState title="Chưa có phiên thi nào" subtitle="Hãy làm bài thi đầu tiên!" />}
      renderItem={({ item }: { item: ExamSessionWithExam }) => {
        const title = item.exam?.title ?? `Đề ${item.exam?.level ?? ""}`;
        const date = new Date(item.completedAt ?? item.createdAt).toLocaleDateString("vi-VN");
        const skills: { skill: Skill; score: number | null }[] = [
          { skill: "listening", score: item.listeningScore },
          { skill: "reading", score: item.readingScore },
          { skill: "writing", score: item.writingScore },
          { skill: "speaking", score: item.speakingScore },
        ].filter((s) => s.score != null);

        return (
          <HapticTouchable
            style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => router.push(`/(app)/session/${item.id}`)}
          >
            <View style={[styles.iconBox, { backgroundColor: c.primary + "15" }]}>
              <Ionicons name="document-text" size={20} color={c.primary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowTitle, { color: c.foreground }]} numberOfLines={1}>{title}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{date}</Text>
              {skills.length > 0 && (
                <View style={styles.skillChips}>
                  {skills.map(({ skill, score }) => (
                    <SkillChip key={skill} skill={skill} score={score!} />
                  ))}
                </View>
              )}
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.score, { color: c.foreground }]}>
                {item.overallScore != null ? `${item.overallScore}/10` : "—"}
              </Text>
              {item.overallBand && (
                <Text style={{ color: c.primary, fontSize: fontSize.xs, fontWeight: "700" }}>{item.overallBand}</Text>
              )}
            </View>
          </HapticTouchable>
        );
      }}
    />
  );
}

function SkillChip({ skill, score }: { skill: Skill; score: number }) {
  const color = useSkillColor(skill);
  return (
    <View style={[styles.skillChip, { backgroundColor: color + "15" }]}>
      <Text style={{ color, fontSize: 9, fontWeight: "600" }}>{SKILL_LABELS[skill]}: {score}</Text>
    </View>
  );
}

const statusConfig: Record<SubmissionStatus, { label: string; color: "muted" | "success" | "destructive" }> = {
  pending: { label: "Đang chờ", color: "muted" },
  processing: { label: "Đang xử lý", color: "muted" },
  completed: { label: "Hoàn thành", color: "success" },
  review_pending: { label: "Chờ chấm", color: "muted" },
  failed: { label: "Lỗi", color: "destructive" },
};

function SubmissionsList() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useSubmissions();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const submissions = data?.data ?? [];

  return (
    <BouncyFlatList
      data={submissions}
      keyExtractor={(item: Submission) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<EmptyState title="Chưa có bài chấm AI" subtitle="Bài writing/speaking sẽ hiện ở đây sau khi AI chấm" />}
      renderItem={({ item }: { item: Submission }) => {
        const status = statusConfig[item.status];
        const statusColor = status.color === "success" ? c.success : status.color === "destructive" ? c.destructive : c.mutedForeground;
        return (
          <HapticTouchable
            style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => router.push(`/(app)/submissions/${item.id}`)}
          >
            <SkillIcon skill={item.skill} />
            <View style={styles.rowInfo}>
              <Text style={[styles.rowTitle, { color: c.foreground }]}>{SKILL_LABELS[item.skill]}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.score, { color: item.status === "completed" ? c.foreground : c.mutedForeground }]}>
                {item.score != null ? `${item.score}/10` : "—"}
              </Text>
              <Text style={{ color: statusColor, fontSize: fontSize.xs, fontWeight: "600" }}>{status.label}</Text>
            </View>
          </HapticTouchable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  tabRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: "transparent" },
  list: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"], flexGrow: 1 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: "600", fontSize: fontSize.sm },
  rowRight: { alignItems: "flex-end" },
  score: { fontWeight: "700", fontSize: fontSize.base, fontVariant: ["tabular-nums"] },
  skillChips: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 2 },
  skillChip: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
});
