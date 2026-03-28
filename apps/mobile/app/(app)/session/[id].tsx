import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_ICONS, SKILL_LABELS } from "@/components/SkillIcon";
import { AudioPlayer } from "@/components/AudioPlayer";
import {
  useExamSession,
  useSaveAnswers,
  useSubmitExam,
  type FlatSessionDetail,
} from "@/hooks/use-exam-session";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type {
  ExamSession,
  SessionQuestion,
  Skill,
} from "@/types/api";
import {
  detectContentKind as detectKind,
  isReadingGapFillContent,
  isReadingMatchingContent,
  type QuestionContent,
  type ListeningContent,
  type ReadingContent,
  type ReadingGapFillContent,
  type ReadingMatchingContent,
  type WritingContent,
  type SpeakingPart1Content,
  type SpeakingPart2Content,
  type SpeakingPart3Content,
  type ObjectiveAnswer,
  type WritingAnswer,
  type SubmissionAnswer,
} from "@/types/content";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const OPTION_LETTERS = ["A", "B", "C", "D"];
const AUTO_SAVE_INTERVAL = 30_000;

// ─── Root ────────────────────────────────────────────────────────────────────

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading, error } = useExamSession(id!);

  if (isLoading) return <LoadingScreen />;
  if (error || !detail) return <ErrorScreen message={error?.message ?? "Không tìm thấy phiên thi"} />;

  const isActive = detail.status === "in_progress";

  return isActive ? (
    <InProgress detail={detail} sessionId={id!} />
  ) : (
    <Completed session={detail} exam={detail.exam} />
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectContentKind(content: QuestionContent) {
  return detectKind(content);
}

function isAnswerNonEmpty(ans: SubmissionAnswer | undefined): boolean {
  if (!ans) return false;
  if ("answers" in ans) return Object.keys(ans.answers).length > 0;
  if ("text" in ans) return ans.text.trim().length > 0;
  return false;
}

// ─── InProgress ──────────────────────────────────────────────────────────────

interface SectionInfo {
  skill: Skill;
  questions: SessionQuestion[];
}

function InProgress({ detail, sessionId }: { detail: FlatSessionDetail; sessionId: string }) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const exam = detail.exam as Record<string, unknown> | null;
  const durationMinutes = (exam?.durationMinutes as number) ?? 0;
  const remaining = useTimer(detail.startedAt, durationMinutes);

  // Group questions by skill from session response (NOT from blueprint)
  const sections: SectionInfo[] = useMemo(() => {
    const questions = detail.questions ?? [];
    const grouped: Partial<Record<Skill, SessionQuestion[]>> = {};
    for (const q of questions) {
      const sk = q.skill as Skill;
      if (!grouped[sk]) grouped[sk] = [];
      grouped[sk]!.push(q);
    }
    return SKILL_ORDER
      .filter((sk) => grouped[sk] && grouped[sk]!.length > 0)
      .map((sk) => ({ skill: sk, questions: grouped[sk]! }));
  }, [detail.questions]);

  // Prefill answers from session response
  const initialAnswers = useMemo(() => {
    const map: Record<string, SubmissionAnswer> = {};
    for (const a of (detail.answers ?? [])) {
      if (a.questionId && a.answer != null) {
        map[a.questionId] = a.answer as SubmissionAnswer;
      }
    }
    return map;
  }, [detail.answers]);

  // Navigation state
  const [activeSection, setActiveSection] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);

  // Answer tracking — seed from server answers
  const [answersMap, setAnswersMap] = useState<Record<string, SubmissionAnswer>>(initialAnswers);
  const dirtyRef = useRef(false);

  // Auto-save
  const saveAnswers = useSaveAnswers(sessionId);
  const submitExam = useSubmitExam(sessionId);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const doSave = useCallback(() => {
    if (!dirtyRef.current) return;
    const entries = Object.entries(answersMap);
    if (entries.length === 0) return;
    dirtyRef.current = false;
    setSaveStatus("saving");
    saveAnswers.mutate(
      entries.map(([questionId, answer]) => ({ questionId, answer })),
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => {
          dirtyRef.current = true;
          setSaveStatus("idle");
        },
      },
    );
  }, [answersMap, saveAnswers]);

  // Auto-save timer
  useEffect(() => {
    const interval = setInterval(() => doSave(), AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [doSave]);

  // Clear "saved" label after 3s
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  // Answer updaters
  const updateAnswer = useCallback((questionId: string, answer: SubmissionAnswer) => {
    setAnswersMap((prev) => ({ ...prev, [questionId]: answer }));
    dirtyRef.current = true;
  }, []);

  // Derived
  const currentSection = sections[activeSection];
  const currentQuestions = currentSection?.questions ?? [];
  const currentQuestion = currentQuestions[questionIdx];

  // When switching sections, save + reset question index
  const switchSection = useCallback(
    (idx: number) => {
      if (idx === activeSection) return;
      doSave();
      setActiveSection(idx);
      setQuestionIdx(0);
    },
    [activeSection, doSave],
  );

  // Submit flow
  const handleSubmit = useCallback(() => {
    Alert.alert("Nộp bài", "Bạn có chắc muốn nộp bài? Sau khi nộp, bạn không thể chỉnh sửa.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Nộp bài",
        style: "destructive",
        onPress: () => {
          const entries = Object.entries(answersMap);
          if (entries.length > 0) {
            saveAnswers.mutate(
              entries.map(([questionId, answer]) => ({ questionId, answer })),
              { onSettled: () => submitExam.mutate(undefined) },
            );
          } else {
            submitExam.mutate(undefined);
          }
        },
      },
    ]);
  }, [answersMap, saveAnswers, submitExam]);

  // Answered counts per section
  const sectionCounts = useMemo(
    () =>
      sections.map((s) => {
        const answered = s.questions.filter((q) => isAnswerNonEmpty(answersMap[q.id])).length;
        return { total: s.questions.length, answered };
      }),
    [sections, answersMap],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Top bar */}
      <TopBar remaining={remaining} durationMinutes={durationMinutes} saveStatus={saveStatus} onSubmit={handleSubmit} isSubmitting={submitExam.isPending} topInset={insets.top} />

      {/* Skill tabs */}
      <View style={[styles.tabsWrapper, { borderBottomColor: c.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {sections.map((sec, i) => (
            <SkillTab
              key={sec.skill}
              skill={sec.skill}
              active={i === activeSection}
              answered={sectionCounts[i].answered}
              total={sectionCounts[i].total}
              onPress={() => switchSection(i)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Question area */}
      <BouncyScrollView style={styles.questionScroll} contentContainerStyle={styles.questionContent}>
        {currentQuestion ? (
          <>
            <Text style={[styles.questionCounter, { color: c.mutedForeground }]}>
              Câu {questionIdx + 1} / {currentQuestions.length}
            </Text>
            <QuestionRenderer
              question={currentQuestion as any}
              answer={answersMap[currentQuestion.id]}
              onAnswer={(ans) => updateAnswer(currentQuestion.id, ans)}
            />
          </>
        ) : (
          <Text style={{ color: c.mutedForeground, textAlign: "center", padding: spacing.xl }}>
            Không tìm thấy câu hỏi
          </Text>
        )}
      </BouncyScrollView>

      {/* Bottom navigation */}
      <View style={[styles.navBar, { borderTopColor: c.border }]}>
        <HapticTouchable
          style={[styles.navBtn, { opacity: questionIdx > 0 ? 1 : 0.4 }]}
          onPress={() => questionIdx > 0 && setQuestionIdx(questionIdx - 1)}
          disabled={questionIdx <= 0}
        >
          <Ionicons name="chevron-back" size={18} color={c.foreground} />
          <Text style={[styles.navBtnText, { color: c.foreground }]}>Trước</Text>
        </HapticTouchable>

        <Text style={[styles.navCounter, { color: c.mutedForeground }]}>
          {questionIdx + 1}/{currentQuestions.length}
        </Text>

        <HapticTouchable
          style={[styles.navBtn, { opacity: questionIdx < currentQuestions.length - 1 ? 1 : 0.4 }]}
          onPress={() => questionIdx < currentQuestions.length - 1 && setQuestionIdx(questionIdx + 1)}
          disabled={questionIdx >= currentQuestions.length - 1}
        >
          <Text style={[styles.navBtnText, { color: c.foreground }]}>Sau</Text>
          <Ionicons name="chevron-forward" size={18} color={c.foreground} />
        </HapticTouchable>
      </View>
    </View>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────

function TopBar({
  remaining,
  durationMinutes,
  saveStatus,
  onSubmit,
  isSubmitting,
  topInset,
}: {
  remaining: number;
  durationMinutes: number;
  saveStatus: "idle" | "saving" | "saved";
  onSubmit: () => void;
  isSubmitting: boolean;
  topInset: number;
}) {
  const c = useThemeColors();
  const urgent = remaining > 0 && remaining <= 300;

  return (
    <View style={[styles.topBar, { backgroundColor: c.card, borderBottomColor: c.border, paddingTop: topInset + spacing.sm }]}>
      <View style={styles.timerArea}>
        {durationMinutes > 0 && (
          <>
            <Ionicons name="time" size={18} color={urgent ? c.destructive : c.foreground} />
            <Text style={[styles.timerText, { color: urgent ? c.destructive : c.foreground }]}>
              {formatTime(remaining)}
            </Text>
          </>
        )}
        {saveStatus === "saving" && (
          <Text style={[styles.saveLabel, { color: c.mutedForeground }]}>Đang lưu...</Text>
        )}
        {saveStatus === "saved" && (
          <Text style={[styles.saveLabel, { color: c.success }]}>Đã lưu</Text>
        )}
      </View>
      <HapticTouchable
        style={[styles.submitTopBtn, { backgroundColor: c.primary }]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={c.primaryForeground} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={16} color={c.primaryForeground} />
            <Text style={{ color: c.primaryForeground, fontWeight: "600", fontSize: fontSize.sm }}>Nộp bài</Text>
          </>
        )}
      </HapticTouchable>
    </View>
  );
}

// ─── SkillTab ────────────────────────────────────────────────────────────────

function SkillTab({
  skill,
  active,
  answered,
  total,
  onPress,
}: {
  skill: Skill;
  active: boolean;
  answered: number;
  total: number;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const skillColor = useSkillColor(skill);
  const bg = active ? skillColor + "20" : c.muted;
  const borderColor = active ? skillColor : "transparent";

  return (
    <HapticTouchable
      style={[styles.skillTab, { backgroundColor: bg, borderColor }]}
      onPress={onPress}
    >
      <Ionicons name={SKILL_ICONS[skill]} size={14} color={active ? skillColor : c.foreground} />
      <Text style={{ color: active ? skillColor : c.foreground, fontWeight: "600", fontSize: fontSize.xs }}>
        {SKILL_LABELS[skill]}
      </Text>
      <Text style={{ color: active ? skillColor : c.mutedForeground, fontSize: 10, fontWeight: "500" }}>
        {answered}/{total}
      </Text>
    </HapticTouchable>
  );
}

// ─── QuestionRenderer ────────────────────────────────────────────────────────

function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: SubmissionAnswer | undefined;
  onAnswer: (ans: SubmissionAnswer) => void;
}) {
  const kind = detectContentKind(question.content as QuestionContent);

  if (kind === "objective") {
    const objAnswer = (answer && "answers" in answer ? answer : { answers: {} }) as ObjectiveAnswer;
    return (
      <ObjectiveView
        content={question.content as ListeningContent | ReadingContent}
        skill={question.skill}
        answers={objAnswer.answers}
        onSelect={(idx, val) => {
          const next: ObjectiveAnswer = { answers: { ...objAnswer.answers, [idx]: val } };
          onAnswer(next);
        }}
      />
    );
  }

  if (kind === "writing") {
    const textAnswer = (answer && "text" in answer ? answer.text : "");
    return (
      <WritingView
        content={question.content as WritingContent}
        text={textAnswer}
        onChangeText={(t) => {
          const next: WritingAnswer = { text: t };
          onAnswer(next);
        }}
      />
    );
  }

  // speaking — text fallback
  const textAnswer = (answer && "text" in answer ? answer.text : "");
  return (
    <SpeakingView
      content={question.content as SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content}
      text={textAnswer}
      onChangeText={(t) => {
        const next: WritingAnswer = { text: t };
        onAnswer(next);
      }}
    />
  );
}

// ─── ObjectiveView ───────────────────────────────────────────────────────────

function ObjectiveView({
  content,
  skill,
  answers,
  onSelect,
}: {
  content: ListeningContent | ReadingContent | ReadingGapFillContent | ReadingMatchingContent;
  skill: Skill;
  answers: Record<string, string>;
  onSelect: (idx: string, val: string) => void;
}) {
  const c = useThemeColors();

  // Extract items from content (standard reading/listening have .items)
  const items = "items" in content ? content.items : [];

  return (
    <View style={styles.section}>
      {/* Audio player for listening */}
      {skill === "listening" && "audioUrl" in content && (content as ListeningContent).audioUrl && (
        <AudioPlayer audioUrl={(content as ListeningContent).audioUrl} seekable={false} />
      )}

      {/* Standard passage (reading / TNG) */}
      {"passage" in content && (
        <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
          {"title" in content && content.title && (
            <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>
          )}
          <Text style={[styles.passageText, { color: c.foreground }]}>
            {(content as ReadingContent).passage}
          </Text>
        </View>
      )}

      {/* Gap-fill reading */}
      {isReadingGapFillContent(content) && (
        <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
          {content.title && <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>}
          <Text style={[styles.passageText, { color: c.foreground }]}>{content.textWithGaps}</Text>
        </View>
      )}

      {/* Matching reading */}
      {isReadingMatchingContent(content) && (
        <View style={{ gap: spacing.sm }}>
          {content.title && <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>}
          {content.paragraphs.map((p, i) => (
            <View key={i} style={[styles.passageBox, { backgroundColor: c.muted }]}>
              <Text style={{ color: c.primary, fontWeight: "700", fontSize: fontSize.sm }}>{p.label}</Text>
              <Text style={[styles.passageText, { color: c.foreground }]}>{p.text}</Text>
            </View>
          ))}
          <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, marginBottom: spacing.xs }}>Tiêu đề:</Text>
            {content.headings.map((h, i) => (
              <Text key={i} style={{ color: c.foreground, fontSize: fontSize.sm }}>
                {OPTION_LETTERS[i] ?? String(i)}. {h}
              </Text>
            ))}
          </View>
        </View>
      )}

      {items.map((item, i) => {
        const idx = String(i);
        return (
          <View key={idx} style={styles.itemBlock}>
            <Text style={[styles.stem, { color: c.foreground }]}>
              {i + 1}. {item.stem}
            </Text>
            {item.options.map((opt, oi) => {
              const letter = OPTION_LETTERS[oi] ?? String(oi);
              const selected = answers[idx] === letter;
              return (
                <HapticTouchable
                  key={oi}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: selected ? c.primary + "15" : c.card,
                      borderColor: selected ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => onSelect(idx, letter)}
                >
                  <View
                    style={[
                      styles.optionCircle,
                      {
                        backgroundColor: selected ? c.primary : "transparent",
                        borderColor: selected ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? c.primaryForeground : c.mutedForeground,
                        fontSize: fontSize.xs,
                        fontWeight: "700",
                      }}
                    >
                      {letter}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: c.foreground }]}>{opt}</Text>
                </HapticTouchable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// ─── WritingView ─────────────────────────────────────────────────────────────

function WritingView({
  content,
  text,
  onChangeText,
}: {
  content: WritingContent;
  text: string;
  onChangeText: (t: string) => void;
}) {
  const c = useThemeColors();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <View style={styles.section}>
      <View style={[styles.promptBox, { backgroundColor: c.muted }]}>
        <Text style={[styles.promptText, { color: c.foreground }]}>{content.prompt}</Text>
        {content.instructions && (
          <Text style={[styles.instructionText, { color: c.mutedForeground }]}>{content.instructions}</Text>
        )}
        {content.requiredPoints && content.requiredPoints.length > 0 && (
          <View style={{ marginTop: spacing.xs }}>
            <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "600" }}>Yêu cầu:</Text>
            {content.requiredPoints.map((pt, i) => (
              <Text key={i} style={[styles.metaLine, { color: c.mutedForeground }]}>• {pt}</Text>
            ))}
          </View>
        )}
        {content.minWords && (
          <Text style={[styles.metaLine, { color: c.mutedForeground }]}>Tối thiểu: {content.minWords} từ</Text>
        )}
      </View>
      <TextInput
        style={[styles.textArea, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
        placeholder="Nhập bài viết của bạn..."
        placeholderTextColor={c.mutedForeground}
        multiline
        textAlignVertical="top"
        value={text}
        onChangeText={onChangeText}
      />
      <Text style={[styles.wordCount, { color: c.mutedForeground }]}>
        {wordCount} từ{content.minWords ? ` / ${content.minWords} tối thiểu` : ""}
      </Text>
    </View>
  );
}

// ─── SpeakingView ────────────────────────────────────────────────────────────

function SpeakingView({
  content,
  text,
  onChangeText,
}: {
  content: SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content;
  text: string;
  onChangeText: (t: string) => void;
}) {
  const c = useThemeColors();

  return (
    <View style={styles.section}>
      <View style={[styles.promptBox, { backgroundColor: c.muted }]}>
        {"topics" in content &&
          (content as SpeakingPart1Content).topics.map((topic, i) => (
            <View key={i} style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.promptText, { color: c.foreground }]}>{topic.name}</Text>
              {topic.questions.map((q, qi) => (
                <Text key={qi} style={[styles.metaLine, { color: c.mutedForeground }]}>• {q}</Text>
              ))}
            </View>
          ))}

        {"situation" in content && (
          <>
            <Text style={[styles.promptText, { color: c.foreground }]}>
              {(content as SpeakingPart2Content).situation}
            </Text>
            <Text style={[styles.metaLine, { color: c.mutedForeground }]}>
              Chuẩn bị: {(content as SpeakingPart2Content).preparationSeconds}s · Nói:{" "}
              {(content as SpeakingPart2Content).speakingSeconds}s
            </Text>
          </>
        )}

        {"centralIdea" in content && (
          <>
            <Text style={[styles.promptText, { color: c.foreground }]}>
              {(content as SpeakingPart3Content).centralIdea}
            </Text>
            {(content as SpeakingPart3Content).suggestions.map((s, i) => (
              <Text key={i} style={[styles.metaLine, { color: c.mutedForeground }]}>• {s}</Text>
            ))}
            {(content as SpeakingPart3Content).followUpQuestion && (
              <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.border }}>
                <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "600" }}>
                  Câu hỏi thêm: {(content as SpeakingPart3Content).followUpQuestion}
                </Text>
              </View>
            )}
            <Text style={[styles.metaLine, { color: c.mutedForeground }]}>
              Chuẩn bị: {(content as SpeakingPart3Content).preparationSeconds}s · Nói:{" "}
              {(content as SpeakingPart3Content).speakingSeconds}s
            </Text>
          </>
        )}
      </View>
      <TextInput
        style={[styles.textArea, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
        placeholder="Nhập bài nói của bạn..."
        placeholderTextColor={c.mutedForeground}
        multiline
        textAlignVertical="top"
        value={text}
        onChangeText={onChangeText}
      />
    </View>
  );
}

// ─── Completed ───────────────────────────────────────────────────────────────

function Completed({ session, exam }: { session: ExamSession; exam: any }) {
  const c = useThemeColors();
  const router = useRouter();

  const scores: { skill: Skill; score: number | null }[] = [
    { skill: "listening", score: session.listeningScore },
    { skill: "reading", score: session.readingScore },
    { skill: "writing", score: session.writingScore },
    { skill: "speaking", score: session.speakingScore },
  ];

  const statusLabel: Record<string, string> = { submitted: "Đã nộp", completed: "Hoàn thành", abandoned: "Đã hủy" };

  return (
    <BouncyScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.completedContent}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.heading, { color: c.foreground }]}>Kết quả thi {exam ? `— Đề ${exam.level}` : ""}</Text>
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>{statusLabel[session.status] ?? session.status}</Text>
      </View>

      {session.overallScore !== null && (
        <View style={[styles.overallBox, { backgroundColor: c.primary + "18" }]}>
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm, fontWeight: "500" }}>Điểm tổng</Text>
          <Text style={[styles.overallScore, { color: c.primary }]}>
            {session.overallScore}<Text style={{ fontSize: fontSize.lg, color: c.mutedForeground }}>/10</Text>
          </Text>
        </View>
      )}

      {scores.map(({ skill, score }) => (
        <ScoreRow key={skill} skill={skill} score={score} colors={c} />
      ))}

      <HapticTouchable style={[styles.outlineBtn, { borderColor: c.border }]} onPress={() => router.replace("/(app)/(tabs)")}>
        <Text style={{ color: c.foreground, fontWeight: "600" }}>Về trang chủ</Text>
      </HapticTouchable>
    </BouncyScrollView>
  );
}

function ScoreRow({ skill, score, colors: c }: { skill: Skill; score: number | null; colors: any }) {
  const skillColor = useSkillColor(skill);
  return (
    <View style={[styles.skillRow, { backgroundColor: skillColor + "15" }]}>
      <SkillIcon skill={skill} size={18} />
      <Text style={{ flex: 1, fontWeight: "600", fontSize: fontSize.sm, color: c.foreground }}>{SKILL_LABELS[skill]}</Text>
      <Text style={{ fontWeight: "700", fontSize: fontSize.sm, color: c.foreground }}>
        {score !== null ? `${score}/10` : "Đang chấm"}
      </Text>
    </View>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useTimer(startedAt: string, durationMinutes: number): number {
  const calc = () => {
    if (durationMinutes <= 0) return 0;
    const endMs = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  };
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    if (durationMinutes <= 0) return;
    const interval = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMinutes]);
  return remaining;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  timerArea: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timerText: { fontSize: fontSize.lg, fontWeight: "700", fontVariant: ["tabular-nums"] },
  saveLabel: { fontSize: fontSize.xs, marginLeft: spacing.sm },
  submitTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Tabs — fixed height wrapper prevents expansion
  tabsWrapper: {
    borderBottomWidth: 1,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  skillTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
  },

  // Question area
  questionScroll: { flex: 1 },
  questionContent: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  questionCounter: { fontSize: fontSize.sm, fontWeight: "500" },

  // Bottom nav
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  navBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  navBtnText: { fontSize: fontSize.sm, fontWeight: "600" },
  navCounter: { fontSize: fontSize.sm, fontVariant: ["tabular-nums"] },

  // Question content shared
  section: { gap: spacing.md },
  passageBox: { borderRadius: radius.lg, padding: spacing.base },
  passageTitle: { fontSize: fontSize.base, fontWeight: "700", marginBottom: spacing.sm },
  passageText: { fontSize: fontSize.sm, lineHeight: 22 },
  audioLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.lg, padding: spacing.base },
  itemBlock: { gap: spacing.sm },
  stem: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 22 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: { fontSize: fontSize.sm, flex: 1 },
  promptBox: { borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm },
  promptText: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 22 },
  instructionText: { fontSize: fontSize.sm, lineHeight: 22 },
  metaLine: { fontSize: fontSize.xs, marginTop: spacing.xs },
  textArea: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  wordCount: { fontSize: fontSize.xs, textAlign: "right" },

  // Completed
  completedContent: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.xs },
  heading: { fontSize: fontSize.xl, fontWeight: "700" },
  overallBox: { borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.xs },
  overallScore: { fontSize: fontSize["3xl"], fontWeight: "800" },
  skillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.lg, padding: spacing.md },
  outlineBtn: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center" },
});
