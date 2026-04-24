import { useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useQuery } from "@tanstack/react-query";
import { ObjectiveResultView } from "@/components/ObjectiveResultView";
import { WritingAnnotationsView } from "@/components/WritingAnnotationsView";
import { RichFeedback, AnnotatedAnswer } from "@/components/RichFeedback";
import { AudioPlayer } from "@/components/AudioPlayer";
import type { Submission, GradingResult, SubmissionStatus } from "@/types/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

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
    queryFn: async () => ({ id, status: "completed", skill: "writing", scores: {}, feedback: {} } as any as Submission),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 5000 : false;
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message={error?.message ?? "Không tìm thấy bài nộp"} />;

  const answerRef = useRef<View>(null);
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
      {(result?.criteria || criteriaScores) && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Điểm thành phần</Text>
          {result?.criteria && result.criteria.length > 0
            ? result.criteria.map((cr) => {
                const pct = (cr.score / 10) * 100;
                const barColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
                return (
                  <View key={cr.key} style={styles.criteriaRow}>
                    <View style={styles.criteriaHeader}>
                      <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "500", flex: 1 }}>{cr.name}</Text>
                      <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "700" }}>{cr.score}/10</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                    </View>
                  </View>
                );
              })
            : criteriaLabels && criteriaScores
              ? Object.entries(criteriaLabels).map(([key, label]) => {
                  const score = criteriaScores[key] ?? 0;
                  const pct = score * 10;
                  const barColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
                  return (
                    <View key={key} style={styles.criteriaRow}>
                      <View style={styles.criteriaHeader}>
                        <Text style={{ color: c.foreground, fontSize: fontSize.sm, flex: 1 }}>{label}</Text>
                        <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "700" }}>{score}/10</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  );
                })
              : null}
        </View>
      )}

      {/* Dates */}
      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={16} color={c.mutedForeground} />
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>
          Nộp: {new Date(data.createdAt).toLocaleString("vi-VN")}
        </Text>
      </View>

      {/* Speaking: Pronunciation */}
      {result?.pronunciation && <PronunciationSection pronunciation={result.pronunciation as any} />}

      {/* Speaking: Audio */}
      {(() => {
        if (!data.answer || typeof data.answer !== "object") return null;
        const ans = data.answer as Record<string, unknown>;
        const audioKey = (ans.audioPath ?? ans.audioUrl ?? ans.audio_path ?? ans.audio_url) as string | undefined;
        if (!audioKey) return null;
        return (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons name="mic-outline" size={16} color={c.primary} />
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Bản ghi âm</Text>
            </View>
            <AudioPlayer audioUrl={audioKey} seekable />
          </View>
        );
      })()}

      {/* Objective items */}
      {result?.items && result.items.length > 0 && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Chi tiết từng câu</Text>
          <ObjectiveResultView items={result.items} userAnswers={result.userAnswers} correctAnswers={result.correctAnswers} />
        </View>
      )}

      {/* Writing annotations */}
      {result?.annotations && <WritingAnnotationsView annotations={result.annotations} />}

      {/* Feedback */}
      {data.feedback && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Nhận xét</Text>
          <RichFeedback feedback={data.feedback} annotations={result?.annotations} />
        </View>
      )}

      {/* Answer */}
      {data.answer && (
        <View ref={answerRef} style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Câu trả lời đã nộp</Text>
          {typeof data.answer === "object" && "text" in (data.answer as Record<string, unknown>) ? (
            result?.annotations?.corrections && result.annotations.corrections.length > 0 ? (
              <AnnotatedAnswer text={String((data.answer as any).text)} corrections={result.annotations.corrections} />
            ) : (
              <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{String((data.answer as any).text)}</Text>
            )
          ) : null}
        </View>
      )}
    </BouncyScrollView>
  );
}

interface PronunciationData {
  transcript: string;
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  wordErrors?: { word: string; errorType: string; accuracyScore: number }[];
}

function PronunciationSection({ pronunciation }: { pronunciation: PronunciationData }) {
  const c = useThemeColors();
  const scores = [
    { label: "Độ chính xác", score: pronunciation.accuracyScore, color: "#3b82f6" },
    { label: "Độ trôi chảy", score: pronunciation.fluencyScore, color: "#10b981" },
    { label: "Ngữ điệu", score: pronunciation.prosodyScore, color: "#8b5cf6" },
  ];

  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Đánh giá phát âm</Text>
      {scores.map((s) => {
        const barColor = s.score >= 80 ? "#10b981" : s.score >= 60 ? "#f59e0b" : "#ef4444";
        return (
          <View key={s.label} style={styles.criteriaRow}>
            <View style={styles.criteriaHeader}>
              <Text style={{ color: c.foreground, fontSize: fontSize.sm, flex: 1 }}>{s.label}</Text>
              <Text style={{ color: barColor, fontWeight: "700", fontSize: fontSize.sm }}>{Math.round(s.score)}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
              <View style={[styles.progressFill, { width: `${s.score}%`, backgroundColor: barColor }]} />
            </View>
          </View>
        );
      })}
      {pronunciation.transcript ? (
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm, fontStyle: "italic", marginTop: spacing.sm }}>
          "{pronunciation.transcript}"
        </Text>
      ) : null}
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
  scoreBig: { fontSize: fontSize["3xl"], fontWeight: "800" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.base },
  criteriaRow: { gap: spacing.xs },
  criteriaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTrack: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: radius.full },
});
