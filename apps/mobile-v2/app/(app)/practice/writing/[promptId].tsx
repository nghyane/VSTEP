import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputSelectionChangeEventData,
  type NativeSyntheticEvent,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { WritingReviewSheet } from "@/components/WritingReviewSheet";
import { WritingWordProgress } from "@/components/WritingWordProgress";
import {
  useWritingPromptDetail,
  startWritingSession,
  submitWritingSession,
  type WritingPromptDetail,
  type WritingSampleMarker,
} from "@/hooks/use-practice";
import { getApiErrorMessage } from "@/lib/api";
import { translateText, translateTextStrict } from "@/lib/translate";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#58CC02";
const COLOR_DARK = "#478700";

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function WritingExerciseScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const { data: detail, isLoading } = useWritingPromptDetail(promptId ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startMutation = useMutation({
    mutationFn: () => startWritingSession(promptId ?? ""),
    onSuccess: (res) => setSessionId(res.sessionId),
  });

  if (isLoading || !detail) {
    return (
      <View style={[s.fullCenter, { backgroundColor: c.background }]}>
        <ActivityIndicator color={COLOR} size="large" />
      </View>
    );
  }

  if (!sessionId) {
    return (
      <View style={[s.root, { backgroundColor: c.background }]}>
        <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
          <HapticTouchable onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="arrow-back" size={22} color={c.foreground} />
          </HapticTouchable>
          <Text style={[s.topBarTitle, { color: c.foreground }]} numberOfLines={1}>{detail.title}</Text>
          <View style={[s.partChip, { backgroundColor: COLOR + "18" }]}>
            <Text style={[s.partChipText, { color: COLOR }]}>Task {detail.part}</Text>
          </View>
        </View>
        <View style={[s.fullCenter, { flex: 1 }]}>
          <View style={[s.previewIcon, { backgroundColor: COLOR + "18" }]}>
            <GameIcon name="writing" size={48} />
          </View>
          <Text style={[s.previewTitle, { color: c.foreground }]}>{detail.title}</Text>
          <Text style={[s.previewMeta, { color: c.subtle }]}>
            {detail.minWords}–{detail.maxWords} từ{detail.estimatedMinutes ? ` · ${detail.estimatedMinutes} phút` : ""}
          </Text>
          <Text style={[s.previewNote, { color: c.mutedForeground }]}>AI sẽ chấm bài sau khi bạn nộp</Text>
          <DepthButton
            onPress={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            style={{ marginTop: spacing.xl, minWidth: 200, backgroundColor: COLOR, borderColor: COLOR }}
          >
            {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu viết"}
          </DepthButton>
          {startMutation.error ? (
            <Text style={[s.inlineError, { color: c.destructive }]}>
              Không thể bắt đầu bài viết: {getApiErrorMessage(startMutation.error)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <EditorScreen
      detail={detail}
      sessionId={sessionId}
      onBack={() => router.back()}
      insets={insets}
      c={c}
    />
  );
}

interface EditorScreenProps {
  detail: WritingPromptDetail;
  sessionId: string;
  onBack: () => void;
  insets: { top: number; bottom: number };
  c: ReturnType<typeof useThemeColors>;
}

function EditorScreen({ detail, sessionId, onBack, insets, c }: EditorScreenProps) {
  const [text, setText] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [submitted, setSubmitted] = useState<{ submissionId: string; wordCount: number } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [promptTr, setPromptTr] = useState<string | null>(null);
  const [promptTrLoading, setPromptTrLoading] = useState(false);
  const [promptTrError, setPromptTrError] = useState(false);
  const [sampleTr, setSampleTr] = useState<string | null>(null);
  const [sampleTrLoading, setSampleTrLoading] = useState(false);
  const [sampleTrError, setSampleTrError] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const wc = countWords(text);
  const inRange = wc >= detail.minWords && wc <= detail.maxWords;
  const hasKeywords = !!(detail.keywords && detail.keywords.length > 0);
  const hasSample = !!detail.sampleAnswer;

  const submitMutation = useMutation({
    mutationFn: () => submitWritingSession(sessionId, text),
    onSuccess: (res) => {
      setSubmitted({ submissionId: res.submissionId, wordCount: res.wordCount });
      setShowReview(true);
    },
  });

  function handleSelectionChange(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    setSelection(e.nativeEvent.selection);
  }

  // Insert a sentence starter (or keyword) at the current cursor position.
  // Mirrors handleInsertText in apps/frontend-v3 WritingInProgress.tsx.
  function insertAtCursor(insert: string) {
    if (submitted) return;
    const start = selection.start;
    const before = text.slice(0, start);
    const after = text.slice(start);
    const spaceBefore = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n") ? " " : "";
    const spaceAfter = after.length > 0 && !after.startsWith(" ") && !after.startsWith("\n") ? " " : "";
    const next = before + spaceBefore + insert + spaceAfter + after;
    setText(next);
    const pos = start + spaceBefore.length + insert.length + spaceAfter.length;
    setSelection({ start: pos, end: pos });
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // Toggle sample answer translation — fetch on first open, cache result.
  // If translateText returns original (API fail / same lang), still show it so user isn't left wondering.
  function togglePromptTr() {
    if (promptTr) {
      setPromptTr(null);
      setPromptTrError(false);
      return;
    }
    if (promptTrLoading) return;
    setPromptTrLoading(true);
    setPromptTrError(false);
    translateText(detail.prompt, "en", "vi")
      .then((res) => setPromptTr(res ?? ""))
      .catch(() => setPromptTrError(true))
      .finally(() => setPromptTrLoading(false));
  }

  function toggleSampleTr() {
    if (sampleTr) {
      setSampleTr(null);
      setSampleTrError(false);
      return;
    }
    if (sampleTrLoading) return;
    setSampleTrLoading(true);
    setSampleTrError(false);
    translateTextStrict(detail.sampleAnswer!, "en", "vi")
      .then((res) => setSampleTr(res))
      .catch(() => {
        setSampleTrError(true);
      })
      .finally(() => setSampleTrLoading(false));
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]} numberOfLines={1}>{detail.title}</Text>
        <View style={[s.partChip, { backgroundColor: COLOR + "18" }]}>
          <Text style={[s.partChipText, { color: COLOR }]}>Task {detail.part}</Text>
        </View>
      </View>

      {/* Word progress bar — mirrors WritingWordProgress in FE v3 */}
      <View style={[s.progressRow, { backgroundColor: c.surface, borderBottomColor: c.borderLight }]}>
        <WritingWordProgress count={wc} min={detail.minWords} max={detail.maxWords} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {submitted ? (
          <View style={[s.resultCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
            <Ionicons name="checkmark-circle" size={48} color={COLOR} />
            <Text style={[s.resultTitle, { color: c.foreground }]}>Đã nộp bài!</Text>
            <Text style={[s.resultSub, { color: c.mutedForeground }]}>
              {submitted.wordCount} từ · AI đang chấm bài
            </Text>
            <DepthButton
              onPress={() => setShowReview(true)}
              style={{ marginTop: spacing.md, backgroundColor: COLOR, borderColor: COLOR }}
            >
              Xem kết quả
            </DepthButton>
            <DepthButton variant="secondary" onPress={onBack} style={{ marginTop: spacing.sm }}>
              Về danh sách
            </DepthButton>
          </View>
        ) : (
          <>
            {/* Prompt card — with inline translation toggle */}
            <DepthCard style={s.promptCard}>
              <View style={s.promptHeader}>
                <Text style={[s.promptLabel, { color: COLOR }]}>Đề bài — Task {detail.part}</Text>
                <HapticTouchable onPress={togglePromptTr} style={s.dictToggle}>
                  <Text
                    style={[
                      s.dictBtn,
                      {
                        color: promptTr || promptTrError ? "#FFF" : c.subtle,
                        backgroundColor: promptTr || promptTrError ? COLOR : "transparent",
                        borderColor: promptTr || promptTrError ? COLOR : c.muted,
                      },
                    ]}
                  >
                    {promptTrLoading ? "..." : promptTr ? "Ẩn dịch" : "Dịch"}
                  </Text>
                </HapticTouchable>
              </View>
              <Text style={[s.promptText, { color: c.foreground }]}>{detail.prompt}</Text>
              {promptTr ? (
                <View style={[s.transBlock, { borderLeftColor: COLOR + "60" }]}>
                  <Text style={[s.transLabel, { color: COLOR }]}>Dịch</Text>
                  <Text style={[s.transText, { color: c.mutedForeground }]}>{promptTr}</Text>
                </View>
              ) : promptTrError ? (
                <Text style={[s.transText, { color: c.destructive }]}>Không thể dịch. Thử lại sau.</Text>
              ) : null}

              {hasKeywords && (
                <View style={s.keywordsSection}>
                  <Text style={[s.reqLabel, { color: c.mutedForeground }]}>Từ khóa gợi ý</Text>
                  <View style={s.startersRow}>
                    {detail.keywords.map((kw) => (
                      <Pressable
                        key={kw}
                        onPress={() => insertAtCursor(kw)}
                        style={({ pressed }) => [
                          s.starterChip,
                          { backgroundColor: c.infoTint, opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Text style={[s.starterText, { color: c.info }]}>{kw}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {detail.requiredPoints.length > 0 && (
                <View style={s.reqSection}>
                  <Text style={[s.reqLabel, { color: c.mutedForeground }]}>Yêu cầu</Text>
                  {detail.requiredPoints.map((pt) => (
                    <View key={pt} style={s.reqRow}>
                      <Text style={{ color: COLOR }}>•</Text>
                      <Text style={[s.reqText, { color: c.subtle }]}>{pt}</Text>
                    </View>
                  ))}
                </View>
              )}

              {detail.sentenceStarters.length > 0 && (
                <View style={s.startersSection}>
                  <Text style={[s.reqLabel, { color: c.mutedForeground }]}>Gợi ý mở đầu · nhấn để chèn</Text>
                  <View style={s.startersRow}>
                    {detail.sentenceStarters.map((st) => (
                      <Pressable
                        key={st}
                        onPress={() => insertAtCursor(st)}
                        style={({ pressed }) => [
                          s.starterChip,
                          { backgroundColor: c.muted, opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Text style={[s.starterText, { color: c.mutedForeground }]}>{st}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </DepthCard>

            {/* Editor — scrollable */}
            <DepthCard
              style={{
                ...s.editorCard,
                backgroundColor: c.card,
                borderColor: inRange ? COLOR : c.border,
                borderBottomColor: inRange ? COLOR_DARK : "#CACACA",
              }}
            >
              <TextInput
                ref={inputRef}
                style={[s.editor, { color: c.foreground }]}
                value={text}
                onChangeText={(next) => {
                  if (submitMutation.error) submitMutation.reset();
                  setText(next);
                }}
                onSelectionChange={handleSelectionChange}
                selection={selection}
                placeholder="Viết bài của bạn ở đây..."
                placeholderTextColor={c.placeholder}
                multiline
                textAlignVertical="top"
                scrollEnabled
              />
            </DepthCard>

            {/* Sample answer */}
            {hasSample && detail.sampleAnswer && (
              <DepthCard style={[s.sampleCard, { backgroundColor: c.card }]}>
                <View style={s.promptHeader}>
                  <View style={s.sampleTitleRow}>
                    <Ionicons name="book" size={18} color={COLOR} />
                    <Text style={[s.sampleLabel, { color: c.foreground }]}>Bài mẫu và chỉ dẫn</Text>
                  </View>
                  <HapticTouchable onPress={() => setShowSample(true)} style={s.dictToggle}>
                    <Text style={[s.dictBtn, { color: "#FFF", backgroundColor: COLOR, borderColor: COLOR }]}>
                      Xem
                    </Text>
                  </HapticTouchable>
                </View>
                <Text style={[s.sampleHint, { color: c.mutedForeground }]}>
                  Xem bài mẫu, các đoạn được tô màu và giải thích cách dùng cấu trúc.
                </Text>
              </DepthCard>
            )}
          </>
        )}
      </ScrollView>

      {!submitted && (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.base, borderTopColor: c.borderLight }]}>
          <DepthButton
            fullWidth
            disabled={submitMutation.isPending}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              submitMutation.mutate();
            }}
            style={{ backgroundColor: COLOR, borderColor: COLOR }}
          >
            {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
          </DepthButton>
          {submitMutation.error ? (
            <Text style={[s.inlineError, { color: c.destructive }]}>
              Không thể nộp bài: {getApiErrorMessage(submitMutation.error)}
            </Text>
          ) : null}
        </View>
      )}

      {hasSample && detail.sampleAnswer ? (
        <WritingSampleModal
          visible={showSample}
          answer={detail.sampleAnswer}
          markers={detail.sampleMarkers}
          translation={sampleTr}
          translationLoading={sampleTrLoading}
          translationError={sampleTrError}
          onToggleTranslation={toggleSampleTr}
          onClose={() => setShowSample(false)}
          c={c}
        />
      ) : null}

      {/* Inline grading sheet — polls every 5s via useWritingGradingResult */}
      {submitted ? (
        <WritingReviewSheet
          visible={showReview}
          submissionId={submitted.submissionId}
          onClose={() => setShowReview(false)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

interface SampleSegment {
  text: string;
  marker: WritingSampleMarker | null;
}

function WritingSampleModal({
  visible,
  answer,
  markers,
  translation,
  translationLoading,
  translationError,
  onToggleTranslation,
  onClose,
  c,
}: {
  visible: boolean;
  answer: string;
  markers: WritingSampleMarker[];
  translation: string | null;
  translationLoading: boolean;
  translationError: boolean;
  onToggleTranslation: () => void;
  onClose: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const [activeSegment, setActiveSegment] = useState<SampleSegment | null>(null);
  const segments = useMemo(() => buildSampleSegments(answer, markers), [answer, markers]);
  const isTranslated = translation !== null;
  const handleClose = () => {
    setActiveSegment(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[s.modalRoot, { backgroundColor: c.background }]}>
        <View style={[s.modalHeader, { borderBottomColor: c.borderLight, backgroundColor: c.surface }]}>
          <View>
            <Text style={[s.modalEyebrow, { color: COLOR }]}>Bài mẫu</Text>
            <Text style={[s.modalTitle, { color: c.foreground }]}>Cấu trúc và chỉ dẫn</Text>
          </View>
          <HapticTouchable onPress={handleClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={c.foreground} />
          </HapticTouchable>
        </View>

        <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
          <DepthCard style={[s.sampleAnswerCard, { backgroundColor: c.card }]}>
            <View style={s.sampleAnswerHeader}>
              <View style={s.sampleHeaderCopy}>
                <Text style={[s.sampleLabel, { color: c.foreground }]}>Bài mẫu</Text>
                <Text style={[s.sampleHint, { color: c.mutedForeground }]}>Nhấn vào đoạn tô màu để xem phân tích.</Text>
              </View>
              <HapticTouchable onPress={onToggleTranslation} style={s.dictToggle}>
                <Text
                  style={[
                    s.dictBtn,
                    {
                      color: isTranslated || translationError ? "#FFF" : c.subtle,
                      backgroundColor: isTranslated || translationError ? COLOR : "transparent",
                      borderColor: isTranslated || translationError ? COLOR : c.muted,
                    },
                  ]}
                >
                  {translationLoading ? "..." : isTranslated ? "Ẩn dịch" : "Dịch"}
                </Text>
              </HapticTouchable>
            </View>
            {translationError ? (
              <Text style={[s.transText, { color: c.destructive }]}>Không thể dịch. Thử lại sau.</Text>
            ) : null}
            <Text style={[s.sampleText, { color: c.foreground }]}>
              {segments.map((segment, index) => {
                if (!segment.marker) return <Text key={index}>{segment.text}</Text>;
                return (
                  <Text
                    key={index}
                    onPress={() => setActiveSegment(segment)}
                    style={[
                      s.sampleHighlight,
                      {
                        backgroundColor: markerColor(segment.marker.color) + "33",
                        color: c.foreground,
                      },
                    ]}
                  >
                    {segment.text}
                  </Text>
                );
              })}
            </Text>
            {translation ? (
              <View style={[s.transBlock, { borderLeftColor: COLOR + "60" }]}>
                <Text style={[s.transLabel, { color: COLOR }]}>Dịch</Text>
                <Text style={[s.transText, { color: c.mutedForeground }]}>{translation}</Text>
              </View>
            ) : null}
          </DepthCard>
        </ScrollView>

        <MarkerAnalysisModal
          segment={activeSegment}
          onClose={() => setActiveSegment(null)}
          c={c}
        />
      </View>
    </Modal>
  );
}

function MarkerAnalysisModal({
  segment,
  onClose,
  c,
}: {
  segment: SampleSegment | null;
  onClose: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const marker = segment?.marker ?? null;
  return (
    <Modal visible={!!marker} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.markerOverlay} onPress={onClose}>
        <Pressable style={[s.markerPopup, { backgroundColor: c.card, borderColor: marker ? markerColor(marker.color) : COLOR }]} onPress={() => {}}>
          <View style={s.markerPopupHeader}>
            <View style={[s.markerDot, { backgroundColor: marker ? markerColor(marker.color) : COLOR }]} />
            <Text style={[s.markerLabel, { color: c.foreground }]}>{marker?.label}</Text>
            <HapticTouchable onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={18} color={c.subtle} />
            </HapticTouchable>
          </View>
          {segment?.text ? <Text style={[s.markerSnippet, { color: c.subtle }]}>{segment.text}</Text> : null}
          {marker?.detail ? <Text style={[s.markerDetail, { color: c.mutedForeground }]}>{marker.detail}</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function markerColor(color: string) {
  switch (color) {
    case "blue":
      return "#60A5FA";
    case "pink":
      return "#F472B6";
    case "yellow":
      return "#FACC15";
    default:
      return COLOR;
  }
}

function buildSampleSegments(answer: string, markers: WritingSampleMarker[]): SampleSegment[] {
  if (markers.length === 0) return [{ text: answer, marker: null }];

  const ranges: { start: number; end: number; marker: WritingSampleMarker }[] = [];
  for (const marker of markers) {
    const range = findMarkerRange(answer, marker.match, marker.occurrence || 1);
    if (range) ranges.push({ ...range, marker });
  }

  ranges.sort((a, b) => a.start - b.start);

  const result: SampleSegment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor) result.push({ text: answer.slice(cursor, range.start), marker: null });
    result.push({ text: answer.slice(range.start, range.end), marker: range.marker });
    cursor = range.end;
  }
  if (cursor < answer.length) result.push({ text: answer.slice(cursor), marker: null });
  return result;
}

function normalizeMarkerText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findMarkerRange(answer: string, match: string, occurrence: number): { start: number; end: number } | null {
  let idx = -1;
  let found = 0;
  let searchFrom = 0;
  while (found < occurrence) {
    idx = answer.indexOf(match, searchFrom);
    if (idx === -1) break;
    found += 1;
    searchFrom = idx + 1;
  }
  if (idx !== -1 && found === occurrence) return { start: idx, end: idx + match.length };

  const normalizedTarget = normalizeMarkerText(match);
  if (!normalizedTarget) return null;

  const matches: { start: number; end: number }[] = [];
  const tokenRegex = /\S+/g;
  const tokens: { text: string; start: number; end: number }[] = [];
  let tokenMatch = tokenRegex.exec(answer);
  while (tokenMatch) {
    tokens.push({ text: tokenMatch[0], start: tokenMatch.index, end: tokenMatch.index + tokenMatch[0].length });
    tokenMatch = tokenRegex.exec(answer);
  }

  for (let start = 0; start < tokens.length; start++) {
    let text = "";
    for (let end = start; end < tokens.length; end++) {
      text = text ? `${text} ${tokens[end].text}` : tokens[end].text;
      const normalized = normalizeMarkerText(text);
      if (normalized === normalizedTarget) {
        matches.push({ start: tokens[start].start, end: tokens[end].end });
        break;
      }
      if (normalized.length > normalizedTarget.length + 12) break;
    }
  }

  return matches[occurrence - 1] ?? null;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  topBarTitle: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  partChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  partChipText: { fontSize: 11, fontFamily: fontFamily.bold },
  progressRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center", paddingHorizontal: spacing.xl },
  previewMeta: { fontSize: fontSize.sm, marginTop: spacing.sm },
  previewNote: { fontSize: fontSize.xs, marginTop: spacing.xs },
  inlineError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center", marginTop: spacing.sm },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  resultTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  resultSub: { fontSize: fontSize.sm },
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  promptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  promptText: { fontSize: fontSize.sm, lineHeight: 22, fontFamily: fontFamily.medium },
  dictToggle: { padding: spacing.xs },
  dictBtn: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
    borderWidth: 2,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  keywordsSection: { gap: spacing.xs },
  reqSection: { gap: spacing.xs },
  reqLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  reqRow: { flexDirection: "row", gap: spacing.sm },
  reqText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  startersSection: { gap: spacing.xs },
  startersRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  starterChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md },
  starterText: { fontSize: fontSize.xs },
  editorCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, minHeight: 280 },
  editor: { fontSize: fontSize.sm, lineHeight: 22, minHeight: 240 },
  sampleCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  sampleTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  sampleLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  sampleHint: { fontSize: fontSize.xs, lineHeight: 18 },
  sampleText: { fontSize: fontSize.sm, lineHeight: 28 },
  sampleHighlight: { borderRadius: 4 },
  sampleActions: { flexDirection: "row", gap: spacing.xs },
  transBlock: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    gap: 2,
  },
  transLabel: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  transText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    fontStyle: "italic",
    lineHeight: 20,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1 },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalEyebrow: { fontSize: 10, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 1 },
  modalTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  modalScroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  sampleAnswerCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  sampleAnswerHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  sampleHeaderCopy: { flex: 1, gap: 2 },
  analysisCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  analysisHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  analysisHeaderCopy: { flex: 1, gap: 2 },
  analysisSub: { fontSize: fontSize.xs, lineHeight: 18 },
  analysisEmpty: { fontSize: fontSize.xs, lineHeight: 18 },
  markerList: { gap: spacing.sm },
  markerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  markerDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  markerCopy: { flex: 1, gap: 2 },
  markerLabel: { flex: 1, fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  markerSnippet: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, lineHeight: 18 },
  markerDetail: { fontSize: fontSize.xs, lineHeight: 18 },
  markerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.38)", justifyContent: "center", padding: spacing.xl },
  markerPopup: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  markerPopupHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
