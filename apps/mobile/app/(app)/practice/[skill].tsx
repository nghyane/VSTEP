import { useEffect, useReducer, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { SKILL_LABELS } from "@/components/SkillIcon";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ObjectiveResultView } from "@/components/ObjectiveResultView";
import { WritingAnnotationsView } from "@/components/WritingAnnotationsView";
import { WritingTier1View, assembleTemplateText } from "@/components/writing/WritingTier1View";
import { WritingTier2View } from "@/components/writing/WritingTier2View";
import type { WritingScaffold, WritingTemplatePayload, WritingGuidedPayload, WritingScaffoldSection } from "@/types/api";
import { useStartPractice, useSubmitPractice, useCompletePractice } from "@/hooks/use-practice";
import { usePresignUpload, uploadToPresignedUrl } from "@/hooks/use-uploads";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Skill, PracticeStartResponse, PracticeCurrentItem, PracticeProgress } from "@/types/api";
import type { ThemeColors } from "@/theme/colors";
import {
  detectContentKind,
  isReadingGapFillContent,
  isReadingMatchingContent,
  type QuestionContent,
  type QuestionItem,
  type ListeningContent,
  type ReadingContent,
  type ReadingGapFillContent,
  type ReadingMatchingContent,
  type WritingContent,
  type SpeakingPart1Content,
  type SpeakingPart2Content,
  type SpeakingPart3Content,
} from "@/types/content";

// ─── State reducer ───────────────────────────────────────────────────────────

interface State {
  currentItemIndex: number;
  answers: Record<string, string>;
  text: string;
  audioUri: string | null;
  audioDuration: number;
}

type Action =
  | { type: "GO_TO"; index: number }
  | { type: "NEXT"; total: number }
  | { type: "PREV" }
  | { type: "ANSWER"; idx: string; value: string }
  | { type: "SET_TEXT"; text: string }
  | { type: "SET_AUDIO"; uri: string; ms: number }
  | { type: "CLEAR_AUDIO" }
  | { type: "RESET" };

const initialState: State = {
  currentItemIndex: 0,
  answers: {},
  text: "",
  audioUri: null,
  audioDuration: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GO_TO":
      return { ...state, currentItemIndex: Math.max(0, action.index) };
    case "NEXT":
      return { ...state, currentItemIndex: Math.min(state.currentItemIndex + 1, action.total - 1) };
    case "PREV":
      return { ...state, currentItemIndex: Math.max(0, state.currentItemIndex - 1) };
    case "ANSWER":
      return { ...state, answers: { ...state.answers, [action.idx]: action.value } };
    case "SET_TEXT":
      return { ...state, text: action.text };
    case "SET_AUDIO":
      return { ...state, audioUri: action.uri, audioDuration: action.ms };
    case "CLEAR_AUDIO":
      return { ...state, audioUri: null, audioDuration: 0 };
    case "RESET":
      return initialState;
  }
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function PracticeQuestionScreen() {
  const { skill, level: levelParam, part: partParam } = useLocalSearchParams<{ skill: string; level?: string; part?: string }>();
  const c = useThemeColors();
  const router = useRouter();

  // Session-based practice flow
  const startMutation = useStartPractice();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<PracticeCurrentItem | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [currentLevel, setCurrentLevel] = useState("A2");

  const submitMutation = useSubmitPractice(sessionId ?? "");
  const completeMutation = useCompletePractice(sessionId ?? "");
  const presignMutation = usePresignUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [passageVisible, setPassageVisible] = useState(true);
  const [reviewResult, setReviewResult] = useState<import("@/types/api").PracticeSubmitResult | null>(null);
  const [nextItem, setNextItem] = useState<PracticeCurrentItem | null>(null);
  const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({});

  // Auto-start practice session on mount
  useEffect(() => {
    if (!skill || sessionId) return;
    startMutation.mutate(
      {
        skill: skill as Skill,
        mode: "free",
        level: levelParam || undefined,
        itemsCount: undefined,
        focusKp: undefined,
        part: partParam ? Number(partParam) : undefined,
      },
      {
        onSuccess: (data: PracticeStartResponse) => {
          setSessionId(data.session.id);
          setCurrentItem(data.currentItem);
          setProgress(data.progress);
          setCurrentLevel(data.session.level);
        },
      },
    );
  }, [skill]);

  // Reset answer state when current question changes
  const questionId = currentItem?.question?.id;
  useEffect(() => {
    dispatch({ type: "RESET" });
    setPassageVisible(true);
    setFilledBlanks({});
  }, [questionId]);

  if (startMutation.isPending) {
    const loadingTexts: Record<string, string[]> = {
      writing: ["Đang phân tích trình độ...", "Đang chọn đề bài phù hợp...", "Đang tạo hướng dẫn viết..."],
      speaking: ["Đang phân tích trình độ...", "Đang chọn chủ đề nói..."],
      listening: ["Đang tải bài nghe..."],
      reading: ["Đang tải bài đọc..."],
    };
    const texts = loadingTexts[skill as string] ?? ["Đang tải..."];
    return <PracticeLoadingScreen texts={texts} />;
  }
  if (startMutation.isError) {
    const errMsg = startMutation.error.message;
    const isNoQuestion = /no practice question|không tìm thấy/i.test(errMsg);
    return (
      <ScreenWrapper>
        <View style={styles.headerRow}>
          <HapticTouchable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={c.foreground} />
          </HapticTouchable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>
            {SKILL_LABELS[skill as Skill] ?? skill}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name={isNoQuestion ? "library-outline" : "alert-circle-outline"} size={48} color={isNoQuestion ? c.mutedForeground : c.destructive} />
          <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.base, textAlign: "center" }}>
            {isNoQuestion ? `Chưa có câu hỏi ${SKILL_LABELS[skill as Skill]} ở trình độ ${currentLevel}` : errMsg}
          </Text>
          {isNoQuestion && (
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm, textAlign: "center" }}>
              Thử chọn câu hỏi cụ thể ở level khác
            </Text>
          )}
        </View>
        <View style={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"] }}>
          {isNoQuestion && (
            <HapticTouchable
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.md, backgroundColor: c.primary }}
              onPress={() => router.replace({ pathname: "/(app)/practice/browse" as any, params: { skill } })}
            >
              <Ionicons name="search-outline" size={18} color={c.primaryForeground} />
              <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Chọn câu hỏi</Text>
            </HapticTouchable>
          )}
          <HapticTouchable
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.md, backgroundColor: c.muted }}
            onPress={() => router.back()}
          >
            <Text style={[styles.btnLabel, { color: c.foreground }]}>Quay lại</Text>
          </HapticTouchable>
        </View>
      </ScreenWrapper>
    );
  }
  if (!currentItem || !currentItem.question) {
    return (
      <ScreenWrapper>
        <View style={styles.headerRow}>
          <HapticTouchable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={c.foreground} />
          </HapticTouchable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>
            {SKILL_LABELS[skill as Skill] ?? skill}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          icon="school-outline"
          title="Không còn câu hỏi phù hợp"
          subtitle={`Trình độ hiện tại: ${currentLevel}`}
        />
        <View style={{ padding: spacing.xl }}>
          <HapticTouchable
            style={[styles.primaryBtn, { backgroundColor: c.primary }]}
            onPress={() => {
              if (sessionId) {
                completeMutation.mutate(undefined, {
                  onSuccess: () => router.replace("/(app)/practice"),
                });
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="checkmark-done" size={18} color={c.primaryForeground} />
            <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Hoàn thành</Text>
          </HapticTouchable>
        </View>
      </ScreenWrapper>
    );
  }

  const question = currentItem.question;
  const content = question.content as QuestionContent;
  const kind = detectContentKind(content, skill);
  const items: QuestionItem[] = "items" in content ? (content as ListeningContent | ReadingContent).items : [];
  const totalItems = kind === "objective" ? items.length : 1;
  const objItem = kind === "objective" ? items[state.currentItemIndex] ?? null : null;
  const isLastItem = state.currentItemIndex >= totalItems - 1;

  const allAnswered = (() => {
    if (kind === "objective") return Object.keys(state.answers).length >= totalItems;
    if (kind === "writing") {
      const scaffold = currentItem?.writingScaffold;
      if (scaffold?.type === "template" && scaffold.payload && "sections" in scaffold.payload) {
        // Tier 1: at least 1 blank filled
        return Object.values(filledBlanks).some((v) => v.trim().length > 0);
      }
      return state.text.trim().length > 0;
    }
    return state.audioUri !== null;
  })();

  const isBusy = submitMutation.isPending || isUploading;
  const canSubmit = allAnswered && !isBusy;

  async function handleSubmit() {
    if (!canSubmit || !sessionId) return;
    setUploadError(null);

    let answer: Record<string, unknown>;
    if (kind === "objective") {
      answer = { answers: state.answers };
    } else if (kind === "speaking" && state.audioUri) {
      setIsUploading(true);
      try {
        const fileSize = await getFileSize(state.audioUri);
        const uploadContentType = "audio/wav";
        const presign = await presignMutation.mutateAsync({ contentType: uploadContentType, fileSize });
        await uploadToPresignedUrl(presign.uploadUrl, state.audioUri, uploadContentType, presign.headers);
        answer = { audioPath: presign.audioPath };
      } catch (err) {
        setIsUploading(false);
        setUploadError(err instanceof Error ? err.message : "Tải âm thanh thất bại, vui lòng thử lại");
        return;
      }
      setIsUploading(false);
    } else {
      // Writing: assemble from template blanks (tier 1) or textarea (tier 2/3)
      const scaffold = currentItem?.writingScaffold;
      if (scaffold?.type === "template" && scaffold.payload && "sections" in scaffold.payload) {
        const assembled = assembleTemplateText((scaffold.payload as WritingTemplatePayload).sections, filledBlanks);
        answer = { text: assembled };
      } else {
        answer = { text: state.text.trim() };
      }
    }

    submitMutation.mutate(
      { answer },
      {
        onSuccess: (submitResult) => {
          setProgress(submitResult.progress);
          // Store result for review phase + next item for later
          setReviewResult(submitResult);
          setNextItem(submitResult.currentItem);
        },
      },
    );
  }

  function handleNextAfterReview() {
    if (nextItem) {
      setCurrentItem(nextItem);
      setNextItem(null);
      setReviewResult(null);
    } else {
      // No more questions — complete session
      completeMutation.mutate(undefined, {
        onSuccess: () => {
          if (reviewResult?.submissionId) {
            router.replace(`/(app)/practice/result/${reviewResult.submissionId}`);
          } else {
            router.replace("/(app)/practice");
          }
        },
      });
    }
  }

  // ─── Review phase — show result after submit ─────────────────────────
  if (reviewResult) {
    const gr = reviewResult.result;
    const isObj = kind === "objective";
    const hasResult = gr && (gr.score != null || (gr.items && gr.items.length > 0));
    const isSubjective = kind === "writing" || kind === "speaking";

    // Writing/Speaking: AI chấm async → poll submission status → auto-navigate when done
    if (isSubjective && !hasResult && reviewResult.submissionId) {
      return <WaitingForGrading submissionId={reviewResult.submissionId} kind={kind} nextItem={nextItem} onNext={handleNextAfterReview} />;
    }

    return (
      <ScreenWrapper>
        <View style={styles.headerRow}>
          <HapticTouchable onPress={handleNextAfterReview}>
            <Ionicons name="arrow-back" size={24} color={c.foreground} />
          </HapticTouchable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Kết quả</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] }}>
          {/* Score summary */}
          {gr?.score != null && (
            <View style={[styles.reviewScoreBox, { backgroundColor: c.primary + "15" }]}>
              <Text style={{ color: c.primary, fontSize: 36, fontWeight: "800" }}>{gr.score}/10</Text>
              {gr.band && <Text style={{ color: c.primary, fontWeight: "600" }}>{gr.band}</Text>}
            </View>
          )}

          {/* Objective breakdown */}
          {isObj && gr?.items && gr.items.length > 0 && (
            <ObjectiveResultView
              items={gr.items}
              userAnswers={gr.userAnswers}
              correctAnswers={gr.correctAnswers}
            />
          )}

          {/* Writing/Speaking annotations */}
          {gr?.annotations && <WritingAnnotationsView annotations={gr.annotations} />}

          {/* Criteria scores */}
          {gr?.criteria && gr.criteria.length > 0 && (
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: c.foreground, fontWeight: "700", fontSize: fontSize.base }}>Điểm thành phần</Text>
              {gr.criteria.map((cr) => (
                <View key={cr.key} style={{ gap: 2 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: c.foreground, fontSize: fontSize.sm }}>{cr.name}</Text>
                    <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "700" }}>{cr.score}/10</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: c.muted, borderRadius: 2 }}>
                    <View style={{ height: 4, backgroundColor: c.primary, borderRadius: 2, width: `${cr.score * 10}%` as any }} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Feedback text */}
          {gr?.feedback && (
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: c.foreground, fontWeight: "700", fontSize: fontSize.base }}>Nhận xét</Text>
              <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{gr.feedback}</Text>
            </View>
          )}
        </ScrollView>

        {/* Next button */}
        <View style={{ padding: spacing.xl, borderTopWidth: 1, borderTopColor: c.border }}>
          <HapticTouchable
            style={[styles.primaryBtn, { backgroundColor: c.primary }]}
            onPress={handleNextAfterReview}
          >
            <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>
              {nextItem ? "Câu tiếp theo" : "Hoàn thành"}
            </Text>
            <Ionicons name={nextItem ? "arrow-forward" : "checkmark"} size={18} color={c.primaryForeground} />
          </HapticTouchable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      {/* Header */}
      <View style={styles.headerRow}>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.foreground} />
        </HapticTouchable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>
          {SKILL_LABELS[skill as Skill] ?? skill}
        </Text>
        <View style={[styles.levelBadge, { backgroundColor: c.primary + "18" }]}>
          <Text style={[styles.levelText, { color: c.primary }]}>{currentLevel}</Text>
        </View>
      </View>

      {/* Session progress */}
      {progress && (
        <ProgressBar current={progress.current} total={progress.total} colors={c} />
      )}

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {kind === "objective" && objItem && (
          <ObjectiveItemView
            content={content as ListeningContent | ReadingContent}
            skill={skill as Skill}
            item={objItem}
            itemIndex={state.currentItemIndex}
            selectedAnswer={state.answers[String(state.currentItemIndex)]}
            onSelect={(val) => dispatch({ type: "ANSWER", idx: String(state.currentItemIndex), value: val })}
            passageVisible={passageVisible}
            onTogglePassage={() => setPassageVisible((v) => !v)}
            colors={c}
          />
        )}

        {kind === "writing" && (() => {
          const scaffold = currentItem?.writingScaffold;
          const scaffoldType = scaffold?.type ?? "freeform";
          const wContent = content as WritingContent;

          if (scaffoldType === "template" && scaffold?.payload && "sections" in scaffold.payload) {
            return (
              <WritingTier1View
                sections={(scaffold.payload as WritingTemplatePayload).sections}
                filledBlanks={filledBlanks}
                onBlankChange={(id, val) => setFilledBlanks((prev) => ({ ...prev, [id]: val }))}
                onAssembleText={() => assembleTemplateText((scaffold.payload as WritingTemplatePayload).sections, filledBlanks)}
              />
            );
          }

          if (scaffoldType === "guided" && scaffold?.payload && "outline" in scaffold.payload) {
            return (
              <WritingTier2View
                content={wContent}
                hints={scaffold.payload as WritingGuidedPayload}
                text={state.text}
                onChangeText={(t) => dispatch({ type: "SET_TEXT", text: t })}
              />
            );
          }

          // Tier 3 freeform — existing WritingView
          return (
            <WritingView
              content={wContent}
              text={state.text}
              onChangeText={(t) => dispatch({ type: "SET_TEXT", text: t })}
              wordCount={state.text.trim().split(/\s+/).filter(Boolean).length}
              colors={c}
            />
          );
        })()}

        {kind === "speaking" && (
          <SpeakingView
            content={content as SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content}
            audioUri={state.audioUri}
            audioDurationMs={state.audioDuration}
            onRecorded={(uri, ms) => dispatch({ type: "SET_AUDIO", uri, ms })}
            onClear={() => dispatch({ type: "CLEAR_AUDIO" })}
            colors={c}
          />
        )}

        {(submitMutation.isError || presignMutation.isError || uploadError) && (
          <Text style={[styles.errorText, { color: c.destructive }]}>
            {uploadError ?? presignMutation.error?.message ?? submitMutation.error?.message ?? "Lỗi khi nộp bài"}
          </Text>
        )}
      </ScrollView>

      {/* Item pills (for multi-item objective questions) */}
      {kind === "objective" && totalItems > 1 && (
        <ItemPills
          total={totalItems}
          current={state.currentItemIndex}
          answers={state.answers}
          onPress={(i) => dispatch({ type: "GO_TO", index: i })}
          colors={c}
        />
      )}

      {/* Bottom nav */}
      <View style={[styles.bottomBar, { borderTopColor: c.border, backgroundColor: c.background }]}>
        {kind === "objective" && totalItems > 1 ? (
          <View style={styles.navRow}>
            <HapticTouchable
              style={[styles.navBtn, { borderColor: c.border, opacity: state.currentItemIndex === 0 ? 0.4 : 1 }]}
              onPress={() => dispatch({ type: "PREV" })}
              disabled={state.currentItemIndex === 0}
            >
              <Ionicons name="chevron-back" size={18} color={c.foreground} />
              <Text style={[styles.btnLabel, { color: c.foreground }]}>Trước</Text>
            </HapticTouchable>

            {isLastItem && allAnswered ? (
              <HapticTouchable
                style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: isBusy ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={c.primaryForeground} />
                ) : (
                  <>
                    <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Nộp bài</Text>
                    <Ionicons name="checkmark" size={18} color={c.primaryForeground} />
                  </>
                )}
              </HapticTouchable>
            ) : (
              <HapticTouchable
                style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: isLastItem ? 0.4 : 1 }]}
                onPress={() => dispatch({ type: "NEXT", total: totalItems })}
                disabled={isLastItem}
              >
                <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Tiếp theo</Text>
                <Ionicons name="chevron-forward" size={18} color={c.primaryForeground} />
              </HapticTouchable>
            )}
          </View>
        ) : (
          <HapticTouchable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              borderRadius: radius.lg,
              paddingVertical: spacing.md,
              backgroundColor: allAnswered ? c.primary : c.muted,
              opacity: isBusy ? 0.7 : 1,
            }}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isBusy ? (
              <>
                <ActivityIndicator size="small" color={c.primaryForeground} />
                <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Đang nộp bài...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={18} color={allAnswered ? c.primaryForeground : c.mutedForeground} />
                <Text style={[styles.btnLabel, { color: allAnswered ? c.primaryForeground : c.mutedForeground }]}>Nộp bài</Text>
              </>
            )}
          </HapticTouchable>
        )}
      </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────

// ─── Practice loading screen (animated steps + pulse) ────────────────────────

function PracticeLoadingScreen({ texts }: { texts: string[] }) {
  const c = useThemeColors();
  const [step, setStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation on the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (texts.length <= 1) return;
    const interval = setInterval(() => {
      setStep((prev) => {
        const next = prev < texts.length - 1 ? prev + 1 : prev;
        Animated.timing(progressAnim, {
          toValue: (next + 1) / texts.length,
          duration: 400,
          useNativeDriver: false,
        }).start();
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [texts.length, progressAnim]);

  const SKILL_ICONS: Record<string, { icon: string; bg: string }> = {
    "Đang tải bài nghe...": { icon: "headset", bg: "#6366f1" },
    "Đang tải bài đọc...": { icon: "book", bg: "#10b981" },
    "Đang phân tích trình độ...": { icon: "analytics", bg: "#6366f1" },
    "Đang chọn đề bài phù hợp...": { icon: "document-text", bg: "#f59e0b" },
    "Đang tạo hướng dẫn viết...": { icon: "create", bg: "#8b5cf6" },
    "Đang chọn chủ đề nói...": { icon: "mic", bg: "#ef4444" },
  };

  const currentIcon = SKILL_ICONS[texts[step]] ?? { icon: "sparkles", bg: c.primary };

  return (
    <ScreenWrapper>
      <View style={loadingStyles.container}>
        {/* Animated icon */}
        <Animated.View style={[loadingStyles.iconRing, { borderColor: currentIcon.bg + "30", transform: [{ scale: pulseAnim }] }]}>
          <View style={[loadingStyles.iconInner, { backgroundColor: currentIcon.bg + "15" }]}>
            <Ionicons name={currentIcon.icon as any} size={32} color={currentIcon.bg} />
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={[loadingStyles.progressTrack, { backgroundColor: c.muted }]}>
          <Animated.View
            style={[
              loadingStyles.progressFill,
              {
                backgroundColor: currentIcon.bg,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["5%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Steps */}
        <View style={loadingStyles.stepsContainer}>
          {texts.map((text, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            const stepColor = isDone ? "#10b981" : isCurrent ? currentIcon.bg : c.mutedForeground;

            return (
              <Animated.View
                key={i}
                style={[
                  loadingStyles.stepRow,
                  { opacity: i <= step ? 1 : 0.35 },
                ]}
              >
                <View style={[loadingStyles.stepDot, { backgroundColor: isDone ? "#10b981" : isCurrent ? currentIcon.bg : c.border }]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  ) : isCurrent ? (
                    <ActivityIndicator size={8} color="#fff" />
                  ) : (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.mutedForeground }} />
                  )}
                </View>
                {i < texts.length - 1 && (
                  <View style={[loadingStyles.stepLine, { backgroundColor: isDone ? "#10b981" : c.border }]} />
                )}
                <Text style={{ color: stepColor, fontSize: fontSize.sm, fontWeight: isCurrent ? "600" : "400", flex: 1 }}>
                  {text}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Tip */}
        <View style={[loadingStyles.tipBox, { backgroundColor: c.muted }]}>
          <Ionicons name="bulb-outline" size={14} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs, flex: 1 }}>
            AI đang chuẩn bị bài phù hợp với trình độ của bạn
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing["2xl"],
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    width: "80%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  stepsContainer: {
    width: "100%",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    position: "absolute",
    left: 9,
    top: 20,
    width: 2,
    height: spacing.md,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: "100%",
  },
});

// ─── Waiting for AI grading (polls submission, auto-navigates) ───────────────

function WaitingForGrading({
  submissionId,
  kind,
  nextItem,
  onNext,
}: {
  submissionId: string;
  kind: string;
  nextItem: PracticeCurrentItem | null;
  onNext: () => void;
}) {
  const c = useThemeColors();
  const router = useRouter();
  const { data: sub } = useQuery({
    queryKey: ["submissions", submissionId],
    queryFn: () => api.get<import("@/types/api").Submission>(`/api/submissions/${submissionId}`),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "pending" || s === "processing" ? 5000 : false;
    },
  });

  // Auto-navigate when grading is done
  useEffect(() => {
    if (sub?.status === "completed" || sub?.status === "failed") {
      router.replace(`/(app)/submissions/${submissionId}`);
    }
  }, [sub?.status]);

  const isDone = sub?.status === "completed" || sub?.status === "failed";

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <HapticTouchable onPress={onNext}>
          <Ionicons name="arrow-back" size={24} color={c.foreground} />
        </HapticTouchable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Kết quả</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.md }}>
        {isDone ? (
          <Ionicons name="checkmark-circle" size={48} color={c.success} />
        ) : (
          <ActivityIndicator size="large" color={c.primary} />
        )}
        <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.base }}>
          {isDone ? "Đã chấm xong!" : "AI đang chấm bài..."}
        </Text>
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm, textAlign: "center" }}>
          {isDone
            ? "Đang chuyển sang kết quả..."
            : `Quá trình chấm ${kind === "writing" ? "bài viết" : "bài nói"} mất 1-3 phút`}
        </Text>
      </View>
      <View style={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"] }}>
        <HapticTouchable
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.md, backgroundColor: c.primary }}
          onPress={() => router.push(`/(app)/submissions/${submissionId}`)}
        >
          <Ionicons name="eye-outline" size={18} color={c.primaryForeground} />
          <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Xem chi tiết bài chấm</Text>
        </HapticTouchable>
        <HapticTouchable
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.md, backgroundColor: c.muted }}
          onPress={onNext}
        >
          <Text style={[styles.btnLabel, { color: c.foreground }]}>{nextItem ? "Câu tiếp theo" : "Hoàn thành"}</Text>
        </HapticTouchable>
      </View>
    </ScreenWrapper>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressBar({ current, total, colors: c }: { current: number; total: number; colors: ThemeColors }) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <View style={styles.progressWrapper}>
      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: c.primary }]} />
      </View>
      <Text style={[styles.progressLabel, { color: c.mutedForeground }]}>
        {current + 1}/{total}
      </Text>
    </View>
  );
}

// ─── Item pills ──────────────────────────────────────────────────────────────

function ItemPills({
  total, current, answers, onPress, colors: c,
}: {
  total: number; current: number; answers: Record<string, string>;
  onPress: (i: number) => void; colors: ThemeColors;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: Math.max(0, current * 44 - 120), animated: true });
  }, [current]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillRow}
      style={styles.pillContainer}
    >
      {Array.from({ length: total }, (_, i) => {
        const answered = answers[String(i)] !== undefined;
        const active = i === current;
        return (
          <HapticTouchable
            key={i}
            style={[
              styles.pill,
              {
                backgroundColor: active ? c.primary : answered ? c.primary + "20" : c.card,
                borderColor: active ? c.primary : answered ? c.primary + "50" : c.border,
              },
            ]}
            onPress={() => onPress(i)}
          >
            {answered && !active ? (
              <Ionicons name="checkmark" size={14} color={c.primary} />
            ) : (
              <Text style={{
                color: active ? c.primaryForeground : c.foreground,
                fontWeight: "700",
                fontSize: fontSize.xs,
              }}>
                {i + 1}
              </Text>
            )}
          </HapticTouchable>
        );
      })}
    </ScrollView>
  );
}

// ─── Objective item view (single item) ───────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D"];

async function getFileSize(uri: string): Promise<number> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", uri);
    xhr.onload = () => {
      const len = xhr.getResponseHeader("Content-Length");
      resolve(len ? parseInt(len, 10) : 100000);
    };
    xhr.onerror = () => resolve(100000);
    xhr.send();
  });
}

function ObjectiveItemView({
  content, skill, item, itemIndex, selectedAnswer, onSelect, passageVisible, onTogglePassage, colors: c,
}: {
  content: ListeningContent | ReadingContent | ReadingGapFillContent | ReadingMatchingContent;
  skill: Skill;
  item: QuestionItem | null;
  itemIndex: number;
  selectedAnswer?: string;
  onSelect: (val: string) => void;
  passageVisible: boolean;
  onTogglePassage: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.section}>
      {/* Audio player for listening */}
      {skill === "listening" && "audioUrl" in content && content.audioUrl && (
        <AudioPlayer audioUrl={content.audioUrl} seekable />
      )}

      {/* Passage for standard reading */}
      {"passage" in content && (
        <View>
          <HapticTouchable
            style={[styles.passageToggle, { backgroundColor: c.muted }]}
            onPress={onTogglePassage}
          >
            <Ionicons name="document-text-outline" size={18} color={c.primary} />
            <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "600", flex: 1 }}>
              Đoạn văn
            </Text>
            <Ionicons name={passageVisible ? "chevron-up" : "chevron-down"} size={18} color={c.mutedForeground} />
          </HapticTouchable>
          {passageVisible && (
            <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
              {"title" in content && content.title && (
                <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>
              )}
              <Text style={[styles.passageText, { color: c.foreground }]}>
                {(content as ReadingContent).passage}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Gap-fill reading: text with gaps */}
      {isReadingGapFillContent(content) && (
        <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
          {content.title && <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>}
          <Text style={[styles.passageText, { color: c.foreground }]}>{content.textWithGaps}</Text>
        </View>
      )}

      {/* Matching reading: paragraphs + headings */}
      {isReadingMatchingContent(content) && (
        <View style={{ gap: spacing.sm }}>
          {content.title && <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>}
          <Text style={[styles.metaLine, { color: c.mutedForeground }]}>Nối đoạn văn với tiêu đề phù hợp:</Text>
          {content.paragraphs.map((p, i) => (
            <View key={i} style={[styles.passageBox, { backgroundColor: c.muted }]}>
              <Text style={{ color: c.primary, fontWeight: "700", fontSize: fontSize.sm }}>
                {p.label}
              </Text>
              <Text style={[styles.passageText, { color: c.foreground }]}>{p.text}</Text>
            </View>
          ))}
          <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, marginBottom: spacing.xs }}>
              Tiêu đề:
            </Text>
            {content.headings.map((h, i) => (
              <Text key={i} style={{ color: c.foreground, fontSize: fontSize.sm }}>
                {OPTION_LETTERS[i] ?? String(i)}. {h}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Single question item (MCQ) */}
      {item && (
        <View style={styles.itemBlock}>
          <Text style={[styles.stem, { color: c.foreground }]}>
            Câu {itemIndex + 1}. {item.stem}
          </Text>
          {item.options.map((opt, oi) => {
            const letter = OPTION_LETTERS[oi] ?? String(oi);
            const selected = selectedAnswer === letter;
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
                onPress={() => onSelect(letter)}
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
                  <Text style={{
                    color: selected ? c.primaryForeground : c.mutedForeground,
                    fontSize: fontSize.xs,
                    fontWeight: "700",
                  }}>
                    {letter}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: c.foreground }]}>{opt}</Text>
              </HapticTouchable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Writing view ────────────────────────────────────────────────────────────

function WritingView({
  content, text, onChangeText, wordCount, colors: c,
}: {
  content: WritingContent; text: string; onChangeText: (t: string) => void;
  wordCount: number; colors: ThemeColors;
}) {
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

// ─── Speaking view ───────────────────────────────────────────────────────────

function SpeakingView({
  content, audioUri, audioDurationMs, onRecorded, onClear, colors: c,
}: {
  content: SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content;
  audioUri: string | null; audioDurationMs: number;
  onRecorded: (uri: string, ms: number) => void; onClear: () => void;
  colors: ThemeColors;
}) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function startRecording() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync({
      android: {
        extension: ".wav",
        outputFormat: 6,
        audioEncoder: 0,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
      },
      ios: {
        extension: ".wav",
        outputFormat: 0x6C696E65,
        audioQuality: 96,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: { mimeType: "audio/wav", bitsPerSecond: 256000 },
    });
    setRecording(rec);
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function stopRecording() {
    if (!recording) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const status = await recording.getStatusAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) onRecorded(uri, status.durationMillis ?? elapsed * 1000);
  }

  async function playAudio() {
    if (!audioUri) return;
    if (soundRef.current) await soundRef.current.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    soundRef.current = sound;
    setPlaying(true);
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) setPlaying(false);
    });
    await sound.playAsync();
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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
            <Text style={[styles.promptText, { color: c.foreground }]}>{(content as SpeakingPart2Content).situation}</Text>
            <Text style={[styles.metaLine, { color: c.mutedForeground }]}>
              Chuẩn bị: {(content as SpeakingPart2Content).preparationSeconds}s · Nói: {(content as SpeakingPart2Content).speakingSeconds}s
            </Text>
          </>
        )}
        {"centralIdea" in content && (
          <>
            <Text style={[styles.promptText, { color: c.foreground }]}>{(content as SpeakingPart3Content).centralIdea}</Text>
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
              Chuẩn bị: {(content as SpeakingPart3Content).preparationSeconds}s · Nói: {(content as SpeakingPart3Content).speakingSeconds}s
            </Text>
          </>
        )}
      </View>

      {/* Recorder */}
      <View style={[styles.recorderBox, { backgroundColor: c.card, borderColor: c.border }]}>
        {!audioUri ? (
          <>
            <HapticTouchable
              style={[styles.micBtn, { backgroundColor: isRecording ? c.destructive : c.primary }]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={28} color={c.primaryForeground} />
            </HapticTouchable>
            <Text style={[styles.recorderLabel, { color: isRecording ? c.destructive : c.mutedForeground }]}>
              {isRecording ? formatTime(elapsed) : "Nhấn để thu âm"}
            </Text>
            {isRecording && <View style={[styles.recordingDot, { backgroundColor: c.destructive }]} />}
          </>
        ) : (
          <View style={styles.playbackRow}>
            <HapticTouchable
              style={[styles.playBtn, { backgroundColor: c.primary + "15" }]}
              onPress={playAudio}
              disabled={playing}
            >
              <Ionicons name={playing ? "volume-high" : "play"} size={22} color={c.primary} />
            </HapticTouchable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recorderLabel, { color: c.foreground }]}>Đã ghi âm</Text>
              <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>
                {formatTime(Math.round(audioDurationMs / 1000))}
              </Text>
            </View>
            <HapticTouchable onPress={() => { soundRef.current?.unloadAsync(); setPlaying(false); onClear(); }}>
              <Ionicons name="trash-outline" size={20} color={c.destructive} />
            </HapticTouchable>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  levelText: { fontSize: fontSize.xs, fontWeight: "700" },

  // Progress bar
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: fontSize.xs, fontWeight: "600", minWidth: 32 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },

  // Section
  section: { gap: spacing.md },

  // Passage
  passageToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  passageBox: { borderRadius: radius.lg, padding: spacing.base, marginTop: spacing.xs },
  passageTitle: { fontSize: fontSize.base, fontWeight: "700", marginBottom: spacing.sm },
  passageText: { fontSize: fontSize.sm, lineHeight: 22 },

  // Audio label
  audioLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.base,
  },

  // Item
  itemBlock: { gap: spacing.sm },
  stem: { fontSize: fontSize.base, fontWeight: "600", lineHeight: 24 },
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

  // Pills
  pillContainer: { maxHeight: 52 },
  pillRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, alignItems: "center" },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom bar
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  navRow: { flexDirection: "row", gap: spacing.md },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  btnLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  errorText: { fontSize: fontSize.sm, textAlign: "center" },

  // Writing
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

  // Speaking
  recorderBox: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  recorderLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  recordingDot: { width: 10, height: 10, borderRadius: 5 },
  playbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "100%" as any,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewScoreBox: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
});
