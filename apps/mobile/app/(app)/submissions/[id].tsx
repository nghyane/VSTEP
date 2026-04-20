import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
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
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
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
          <View style={[styles.statusBadge, { backgroundColor: c.background }]}>
            <Text style={{ color: c.subtle, fontSize: fontSize.xs, fontWeight: "600" }}>{status.label}</Text>
          </View>
        </View>
      </View>

      {/* Score */}
      <View style={[styles.scoreBox, { backgroundColor: c.background }]}>
        {data.score != null ? (
          <Text style={[styles.scoreBig, { color: c.foreground }]}>{data.score}/10</Text>
        ) : (
          <Text style={{ color: c.subtle, fontSize: fontSize.lg }}>Đang chấm</Text>
        )}
      </View>

      {/* Criteria Scores — prefer enriched criteria array, fallback to criteriaScores map */}
      {(result?.criteria || criteriaScores) && (
        <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Điểm thành phần</Text>
          {result?.criteria && result.criteria.length > 0
            ? result.criteria.map((cr) => {
                const pct = (cr.score / 10) * 100;
                const barColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
                return (
                  <View key={cr.key} style={styles.criteriaRow}>
                    <View style={styles.criteriaHeader}>
                      <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "500", flex: 1 }}>{cr.name}</Text>
                      <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{cr.score}/10</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: c.background }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                    </View>
                    {cr.bandLabel ? (
                      <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>{cr.bandLabel}</Text>
                    ) : null}
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
                        <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{score}/10</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: c.background }]}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  );
                })
              : null}
        </View>
      )}

      {/* Knowledge Gaps */}
      {result?.knowledgeGaps && (result.knowledgeGaps as any[]).length > 0 && (
        <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Điểm cần cải thiện</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {(result.knowledgeGaps as { name: string; category: string }[]).map((gap, i) => {
              const gapColors: Record<string, string> = { grammar: "#ef4444", vocabulary: "#f59e0b", spelling: "#3b82f6", discourse: "#8b5cf6" };
              const color = gapColors[gap.category] ?? c.subtle;
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: color + "12", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                  <Text style={{ color, fontSize: fontSize.xs, fontWeight: "600" }}>{gap.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Dates */}
      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={16} color={c.subtle} />
        <Text style={{ color: c.subtle, fontSize: fontSize.sm }}>
          Nộp: {new Date(data.createdAt).toLocaleString("vi-VN")}
        </Text>
      </View>
      {(data as any).completedAt && (
        <View style={styles.dateRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={c.subtle} />
          <Text style={{ color: c.subtle, fontSize: fontSize.sm }}>
            Hoàn thành: {new Date((data as any).completedAt).toLocaleString("vi-VN")}
          </Text>
        </View>
      )}

      {/* Speaking: Pronunciation Assessment (Azure data) */}
      {result?.pronunciation && (
        <PronunciationSection pronunciation={result.pronunciation as any} />
      )}

      {/* Speaking: Audio playback */}
      {(() => {
        if (!data.answer || typeof data.answer !== "object") return null;
        const ans = data.answer as Record<string, unknown>;
        const audioKey = (ans.audioPath ?? ans.audioUrl ?? ans.audio_path ?? ans.audio_url) as string | undefined;
        if (!audioKey) return null;
        return (
          <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons name="mic-outline" size={16} color={c.primary} />
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Bản ghi âm</Text>
            </View>
            <AudioPlayer audioUrl={audioKey} seekable />
          </View>
        );
      })()}

      {/* Objective per-item breakdown (reading/listening) */}
      {result?.items && result.items.length > 0 && (
        <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
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

      {/* Feedback — rich rendering with corrections + quoted highlights */}
      {data.feedback && (
        <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Nhận xét</Text>
          <RichFeedback
            feedback={data.feedback}
            annotations={result?.annotations}
            scrollToAnswer={answerRef.current ? () => answerRef.current?.measureLayout?.(undefined as any, (_x, y) => {}) : undefined}
          />
        </View>
      )}

      {/* Question explanation (if backend returns it) */}
      {data.question?.explanation && (
        <View style={[styles.section, { backgroundColor: c.primary + "08", borderColor: c.primary + "30" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="bulb-outline" size={16} color={c.primary} />
            <Text style={[styles.sectionTitle, { color: c.primary }]}>Giải thích</Text>
          </View>
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{data.question.explanation}</Text>
        </View>
      )}

      {/* Answer — with inline error highlights from corrections */}
      {data.answer && (
        <View ref={answerRef} style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Câu trả lời đã nộp</Text>
          {data.answer && typeof data.answer === "object" && "text" in (data.answer as Record<string, unknown>) ? (
            result?.annotations?.corrections && result.annotations.corrections.length > 0 ? (
              <AnnotatedAnswer
                text={String((data.answer as any).text)}
                corrections={result.annotations.corrections}
              />
            ) : (
              <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{String((data.answer as any).text)}</Text>
            )
          ) : data.answer && typeof data.answer === "object" && "audioUrl" in (data.answer as Record<string, unknown>) ? (
            <Text style={{ color: c.subtle, fontSize: fontSize.sm }}>Audio: {(data.answer as any).durationSeconds}s</Text>
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
  grammar: { label: "Ngữ pháp", icon: "construct-outline", color: "#3B82F6" },
  vocabulary: { label: "Từ vựng", icon: "book-outline", color: "#10B981" },
  strategy: { label: "Chiến lược", icon: "bulb-outline", color: "#F59E0B" },
  discourse: { label: "Liên kết", icon: "git-merge-outline", color: "#8B5CF6" },
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
      {
        onSuccess: (data) => setResult(data),
        onError: () => {
          /* handled below */
        },
      },
    );
  }

  if (!result) {
    return (
      <View style={{ gap: spacing.sm }}>
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
        {explain.isError && (
          <Text style={{ color: c.destructive, fontSize: fontSize.xs, textAlign: "center" }}>
            Tính năng AI giải thích tạm thời không khả dụng
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
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
            <View key={qe.questionNumber} style={[styles.highlightCard, { backgroundColor: c.background }]}>
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

// ─── Pronunciation Assessment (Speaking only) ────────────────────────────────

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
    { label: "Độ chính xác", score: pronunciation.accuracyScore, icon: "checkmark-circle" as const, color: "#3b82f6" },
    { label: "Độ trôi chảy", score: pronunciation.fluencyScore, icon: "water" as const, color: "#10b981" },
    { label: "Ngữ điệu", score: pronunciation.prosodyScore, icon: "musical-notes" as const, color: "#8b5cf6" },
  ];

  const wordErrors = pronunciation.wordErrors ?? [];
  const errorTypeLabels: Record<string, { label: string; color: string }> = {
    Mispronunciation: { label: "Phát âm sai", color: "#ef4444" },
    Omission: { label: "Bỏ sót", color: "#f59e0b" },
    Insertion: { label: "Thêm thừa", color: "#3b82f6" },
  };

  return (
    <View style={{ gap: spacing.base }}>
      {/* Pronunciation scores (0-100 scale) */}
      <View style={[pronStyles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="mic" size={16} color={c.primary} />
          <Text style={{ color: c.foreground, fontWeight: "700", fontSize: fontSize.base }}>Đánh giá phát âm</Text>
        </View>

        <View style={pronStyles.scoresGrid}>
          {scores.map((s) => {
            const pct = s.score;
            const barColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
            return (
              <View key={s.label} style={pronStyles.scoreItem}>
                <View style={pronStyles.scoreHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name={s.icon} size={14} color={s.color} />
                    <Text style={{ color: c.foreground, fontSize: fontSize.xs, fontWeight: "500" }}>{s.label}</Text>
                  </View>
                  <Text style={{ color: barColor, fontWeight: "800", fontSize: fontSize.sm }}>{Math.round(pct)}</Text>
                </View>
                <View style={[pronStyles.bar, { backgroundColor: c.background }]}>
                  <View style={[pronStyles.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Transcript */}
      {pronunciation.transcript && (
        <View style={[pronStyles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="document-text-outline" size={16} color={c.primary} />
            <Text style={{ color: c.foreground, fontWeight: "700", fontSize: fontSize.base }}>Nội dung ghi nhận</Text>
          </View>
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22, fontStyle: "italic" }}>
            "{pronunciation.transcript}"
          </Text>
        </View>
      )}

      {/* Word-level errors */}
      {wordErrors.length > 0 && (
        <View style={[pronStyles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            <Text style={{ color: c.foreground, fontWeight: "700", fontSize: fontSize.base }}>Lỗi phát âm từng từ</Text>
            <View style={{ backgroundColor: "#ef444418", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "700" }}>{wordErrors.length} lỗi</Text>
            </View>
          </View>
          {wordErrors.map((err, i) => {
            const config = errorTypeLabels[err.errorType] ?? { label: err.errorType, color: c.subtle };
            return (
              <View key={i} style={[pronStyles.wordError, { borderColor: config.color + "30", backgroundColor: config.color + "08" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={{ color: config.color, fontWeight: "700", fontSize: fontSize.sm }}>"{err.word}"</Text>
                  <View style={{ backgroundColor: config.color + "18", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ color: config.color, fontSize: 9, fontWeight: "700" }}>{config.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>Accuracy:</Text>
                  <Text style={{ color: err.accuracyScore >= 60 ? "#10b981" : "#ef4444", fontSize: fontSize.xs, fontWeight: "700" }}>
                    {Math.round(err.accuracyScore)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const pronStyles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md },
  scoresGrid: { gap: spacing.md },
  scoreItem: { gap: spacing.xs },
  scoreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bar: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  wordError: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
});

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
