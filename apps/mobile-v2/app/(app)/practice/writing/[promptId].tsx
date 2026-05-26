import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { PassageWordView } from "@/components/PassageWordView";
import { WritingReviewSheet } from "@/components/WritingReviewSheet";
import { WritingWordProgress } from "@/components/WritingWordProgress";
import {
  useWritingPromptDetail,
  startWritingSession,
  submitWritingSession,
  type WritingPromptDetail,
} from "@/hooks/use-practice";
import { translateText } from "@/lib/translate";
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
            <Ionicons name="create" size={40} color={COLOR} />
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
  const [translateMode, setTranslateMode] = useState(false);
  const [showSample, setShowSample] = useState(false);
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
  function toggleSampleTr() {
    if (sampleTr) {
      setSampleTr(null);
      setSampleTrError(false);
      return;
    }
    if (sampleTrLoading) return;
    setSampleTrLoading(true);
    setSampleTrError(false);
    translateText(detail.sampleAnswer!, "en", "vi")
      .then((res) => {
        setSampleTr(res ?? "");
      })
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
                <HapticTouchable onPress={() => setTranslateMode(!translateMode)} style={s.dictToggle}>
                  <Text
                    style={[
                      s.dictBtn,
                      {
                        color: translateMode ? "#FFF" : c.subtle,
                        backgroundColor: translateMode ? COLOR : "transparent",
                        borderColor: translateMode ? COLOR : c.muted,
                      },
                    ]}
                  >
                    Từ điển
                  </Text>
                </HapticTouchable>
              </View>
              <PassageWordView
                passage={detail.prompt}
                wordTapMode={translateMode}
                accentColor={COLOR}
                c={c}
              />

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
                onChangeText={setText}
                onSelectionChange={handleSelectionChange}
                selection={selection}
                placeholder="Viết bài của bạn ở đây..."
                placeholderTextColor={c.placeholder}
                multiline
                textAlignVertical="top"
                scrollEnabled
              />
            </DepthCard>

            {/* Sample answer — collapsed by default, expandable with translation toggle */}
            {hasSample && detail.sampleAnswer && (
              <DepthCard style={[s.sampleCard, { backgroundColor: c.muted }]}>
                <View style={s.promptHeader}>
                  <Text style={[s.sampleLabel, { color: c.mutedForeground }]}>Bài mẫu tham khảo</Text>
                  <View style={s.sampleActions}>
                    <HapticTouchable onPress={() => setShowSample(!showSample)} style={s.dictToggle}>
                      <Text
                        style={[
                          s.dictBtn,
                          {
                            color: showSample ? "#FFF" : c.subtle,
                            backgroundColor: showSample ? COLOR : "transparent",
                            borderColor: showSample ? COLOR : c.muted,
                          },
                        ]}
                      >
                        {showSample ? "Ẩn" : "Xem"}
                      </Text>
                    </HapticTouchable>
                  </View>
                </View>
                {showSample && (
                  <>
                    <Text style={[s.sampleText, { color: c.foreground }]}>{detail.sampleAnswer}</Text>
                    <View style={s.sampleActions}>
                      <HapticTouchable onPress={toggleSampleTr} style={s.dictToggle}>
                        <Text
                          style={[
                            s.dictBtn,
                            {
                              color: sampleTr || sampleTrError ? "#FFF" : c.subtle,
                              backgroundColor: sampleTr || sampleTrError ? COLOR : "transparent",
                              borderColor: sampleTr || sampleTrError ? COLOR : c.muted,
                            },
                          ]}
                        >
                          {sampleTrLoading ? "..." : sampleTr ? "Ẩn dịch" : "Dịch"}
                        </Text>
                      </HapticTouchable>
                    </View>
                    {sampleTr ? (
                      <View style={[s.transBlock, { borderLeftColor: COLOR + "60" }]}>
                        <Text style={[s.transLabel, { color: COLOR }]}>Dịch</Text>
                        <Text style={[s.transText, { color: c.mutedForeground }]}>{sampleTr}</Text>
                      </View>
                    ) : sampleTrError ? (
                      <Text style={[s.transText, { color: c.destructive }]}>Không thể dịch. Thử lại sau.</Text>
                    ) : null}
                  </>
                )}
              </DepthCard>
            )}
          </>
        )}
      </ScrollView>

      {!submitted && (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.base, borderTopColor: c.borderLight }]}>
          <DepthButton
            fullWidth
            disabled={submitMutation.isPending || wc === 0}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              submitMutation.mutate();
            }}
            style={{ backgroundColor: COLOR, borderColor: COLOR }}
          >
            {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
          </DepthButton>
        </View>
      )}

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
  scroll: { padding: spacing.xl, gap: spacing.lg },
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  resultTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  resultSub: { fontSize: fontSize.sm },
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  promptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
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
  sampleLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  sampleText: { fontSize: fontSize.sm, lineHeight: 22 },
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
});
