import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useExplain, type ExplainResponse } from "@/hooks/use-ai";
import { ObjectiveResultView } from "@/components/ObjectiveResultView";
import { WritingAnnotationsView } from "@/components/WritingAnnotationsView";
import type { Submission, GradingResult } from "@/types/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill, SubmissionStatus } from "@/types/api";

const WRITING_CRITERIA: Record<string, string> = {
  taskFulfillment: "Task Fulfillment",
  organization: "Organization",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
};

const SPEAKING_CRITERIA: Record<string, string> = {
  fluencyOrganization: "Fluency & Organization",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  vocabulary: "Vocabulary",
};

const statusConfig: Record<SubmissionStatus, { label: string }> = {
  pending: { label: "Đang chờ" },
  processing: { label: "Đang xử lý" },
  completed: { label: "Hoàn thành" },
  review_pending: { label: "Chờ chấm" },
  failed: { label: "Lỗi" },
};

export default function SubmissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions", id],
    queryFn: () => api.get<Submission>(`/api/submissions/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 5000 : false;
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message={error?.message ?? "Không tìm thấy bài nộp"} />;

  const status = statusConfig[data.status];
  const result = data.result as GradingResult | null;
  const criteriaLabels = data.skill === "writing" ? WRITING_CRITERIA : data.skill === "speaking" ? SPEAKING_CRITERIA : null;
  const criteriaScores = result?.criteriaScores;

  return (
    <BouncyScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.headerRow}>
          <SkillIcon skill={data.skill} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.skillName, { color: c.foreground }]}>{SKILL_LABELS[data.skill]}</Text>
            {data.band && (
              <View style={[styles.bandBadge, { borderColor: c.border }]}>
                <Text style={{ color: c.foreground, fontSize: fontSize.xs, fontWeight: "600" }}>{data.band}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: c.muted }]}>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>{status.label}</Text>
          </View>
        </View>
      </View>

      {/* Score */}
      <View style={[styles.scoreBox, { backgroundColor: c.muted }]}>
        {data.score != null ? (
          <Text style={[styles.scoreBig, { color: c.foreground }]}>{data.score}/10</Text>
        ) : (
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.lg }}>Đang chấm</Text>
        )}
      </View>

      {/* Criteria Scores */}
      {criteriaLabels && criteriaScores && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Điểm thành phần</Text>
          {Object.entries(criteriaLabels).map(([key, label]) => {
            const score = criteriaScores[key] ?? 0;
            return (
              <View key={key} style={styles.criteriaRow}>
                <View style={styles.criteriaHeader}>
                  <Text style={{ color: c.foreground, fontSize: fontSize.sm }}>{label}</Text>
                  <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{score}/10</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
                  <View style={[styles.progressFill, { width: `${score * 10}%`, backgroundColor: c.primary }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Dates */}
      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={16} color={c.mutedForeground} />
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>
          Nộp: {new Date(data.createdAt).toLocaleString("vi-VN")}
        </Text>
      </View>
      {(data as any).completedAt && (
        <View style={styles.dateRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>
            Hoàn thành: {new Date((data as any).completedAt).toLocaleString("vi-VN")}
          </Text>
        </View>
      )}

      {/* Objective per-item breakdown (reading/listening) */}
      {result?.items && result.items.length > 0 && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Chi tiết từng câu</Text>
          <ObjectiveResultView
            items={result.items}
            userAnswers={result.userAnswers}
            correctAnswers={result.correctAnswers}
          />
        </View>
      )}

      {/* Writing annotations (strength quotes, corrections, rewrite suggestion) */}
      {result?.annotations && (
        <WritingAnnotationsView annotations={result.annotations} />
      )}

      {/* Feedback */}
      {data.feedback && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Nhận xét</Text>
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{data.feedback}</Text>
        </View>
      )}

      {/* Answer */}
      {data.answer && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Câu trả lời đã nộp</Text>
          {data.answer && typeof data.answer === "object" && "text" in (data.answer as Record<string, unknown>) ? (
            <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{String((data.answer as any).text)}</Text>
          ) : data.answer && typeof data.answer === "object" && "audioUrl" in (data.answer as Record<string, unknown>) ? (
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>Audio: {(data.answer as any).durationSeconds}s</Text>
          ) : data.answer && typeof data.answer === "object" && "answers" in (data.answer as Record<string, unknown>) ? (
            <View style={{ gap: spacing.xs }}>
              {Object.entries((data.answer as any).answers).map(([key, val]: [string, any]) => (
                <Text key={key} style={{ color: c.foreground, fontSize: fontSize.sm }}>
                  <Text style={{ fontWeight: "600" }}>{key}:</Text> {String(val)}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      )}

      {/* AI Explain */}
      {data.status === "completed" && (
        <AIExplainSection
          skill={data.skill}
          answer={data.answer}
          feedback={data.feedback}
          colors={c}
        />
      )}
    </BouncyScrollView>
  );
}

const CATEGORY_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  grammar: { label: "Ngữ pháp", icon: "construct-outline", color: "#4B7BF5" },
  vocabulary: { label: "Từ vựng", icon: "book-outline", color: "#34B279" },
  strategy: { label: "Chiến lược", icon: "bulb-outline", color: "#E5A817" },
  discourse: { label: "Liên kết", icon: "git-merge-outline", color: "#9B59D0" },
};

function AIExplainSection({
  skill,
  answer,
  feedback,
  colors: c,
}: {
  skill: Skill;
  answer: unknown;
  feedback: string | null;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const explain = useExplain();
  const [result, setResult] = useState<ExplainResponse | null>(null);

  const answerText = answer && typeof answer === "object" && "text" in (answer as any)
    ? String((answer as any).text)
    : feedback ?? "";

  if (!answerText) return null;

  function handleExplain() {
    explain.mutate(
      { text: answerText, skill },
      { onSuccess: (data) => setResult(data) },
    );
  }

  if (!result) {
    return (
      <HapticTouchable
        style={[styles.aiBtn, { backgroundColor: c.primary + "12", borderColor: c.primary + "40" }]}
        onPress={handleExplain}
        disabled={explain.isPending}
      >
        {explain.isPending ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : (
          <Ionicons name="sparkles" size={20} color={c.primary} />
        )}
        <Text style={[styles.aiBtnText, { color: c.primary }]}>
          {explain.isPending ? "Đang phân tích..." : "AI Giải thích"}
        </Text>
      </HapticTouchable>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.aiHeader}>
        <Ionicons name="sparkles" size={18} color={c.primary} />
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>AI Giải thích</Text>
      </View>

      {result.highlights.map((h, i) => {
        const cat = CATEGORY_LABELS[h.category] ?? CATEGORY_LABELS.grammar;
        return (
          <View key={i} style={[styles.highlightCard, { backgroundColor: cat.color + "10" }]}>
            <View style={styles.highlightHeader}>
              <Ionicons name={cat.icon} size={14} color={cat.color} />
              <Text style={[styles.highlightCategory, { color: cat.color }]}>{cat.label}</Text>
            </View>
            <Text style={[styles.highlightPhrase, { color: c.foreground }]}>"{h.phrase}"</Text>
            <Text style={[styles.highlightNote, { color: c.foreground }]}>{h.note}</Text>
          </View>
        );
      })}

      {result.questionExplanations && result.questionExplanations.length > 0 && (
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Giải thích câu hỏi</Text>
          {result.questionExplanations.map((qe) => (
            <View key={qe.questionNumber} style={[styles.highlightCard, { backgroundColor: c.muted }]}>
              <Text style={[styles.highlightPhrase, { color: c.foreground }]}>
                Câu {qe.questionNumber}: {qe.correctAnswer}
              </Text>
              <Text style={[styles.highlightNote, { color: c.foreground }]}>{qe.explanation}</Text>
              {qe.wrongAnswerNote && (
                <Text style={[styles.highlightNote, { color: c.destructive }]}>{qe.wrongAnswerNote}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  skillName: { fontWeight: "600", fontSize: fontSize.base },
  bandBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  scoreBox: { borderRadius: radius.xl, padding: spacing.xl, alignItems: "center" },
  scoreBig: { fontSize: fontSize["3xl"], fontWeight: "800", fontVariant: ["tabular-nums"] },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.base },
  criteriaRow: { gap: spacing.xs },
  criteriaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTrack: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: radius.full },
  aiBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.xl, paddingVertical: spacing.md,
  },
  aiBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  highlightCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  highlightHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  highlightCategory: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  highlightPhrase: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  highlightNote: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, lineHeight: 20 },
});
