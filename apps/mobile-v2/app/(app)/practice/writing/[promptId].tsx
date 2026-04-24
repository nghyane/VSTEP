import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { SupportPanel } from "@/components/SupportPanel";
import {
  useWritingPromptDetail,
  startWritingSession,
  submitWritingSession,
  type WritingPromptDetail,
} from "@/hooks/use-practice";
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
      router={router}
    />
  );
}

interface EditorScreenProps {
  detail: WritingPromptDetail;
  sessionId: string;
  onBack: () => void;
  insets: { top: number; bottom: number };
  c: ReturnType<typeof useThemeColors>;
  router: ReturnType<typeof useRouter>;
}

function EditorScreen({ detail, sessionId, onBack, insets, c, router }: EditorScreenProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<{ submissionId: string; wordCount: number } | null>(null);
  const wc = countWords(text);
  const inRange = wc >= detail.minWords && wc <= detail.maxWords;
  const over = wc > detail.maxWords;

  const submitMutation = useMutation({
    mutationFn: () => submitWritingSession(sessionId, text),
    onSuccess: (res) =>
      setSubmitted({ submissionId: res.submissionId, wordCount: res.wordCount }),
  });

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
        <Text style={[s.wordCount, { color: over ? "#EA4335" : inRange ? COLOR : c.subtle }]}>
          {wc}/{detail.minWords}–{detail.maxWords}
        </Text>
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
              onPress={() => router.push(`/(app)/grading/writing/${submitted.submissionId}` as any)}
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
            {/* Prompt card */}
            <DepthCard style={s.promptCard}>
              <Text style={[s.promptLabel, { color: COLOR }]}>Đề bài — Task {detail.part}</Text>
              <Text style={[s.promptText, { color: c.foreground }]}>{detail.prompt}</Text>

              {detail.keywords && detail.keywords.length > 0 && (
                <View style={s.keywordsSection}>
                  <Text style={[s.reqLabel, { color: c.mutedForeground }]}>Từ khóa gợi ý</Text>
                  <View style={s.startersRow}>
                    {detail.keywords.map((kw) => (
                      <View key={kw} style={[s.starterChip, { backgroundColor: c.infoTint }]}>
                        <Text style={[s.starterText, { color: c.info }]}>{kw}</Text>
                      </View>
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
                  <Text style={[s.reqLabel, { color: c.mutedForeground }]}>Gợi ý mở đầu</Text>
                  <View style={s.startersRow}>
                    {detail.sentenceStarters.map((st) => (
                      <View key={st} style={[s.starterChip, { backgroundColor: c.muted }]}>
                        <Text style={[s.starterText, { color: c.mutedForeground }]}>{st}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </DepthCard>

            {/* Support panel */}
            <SupportPanel
              skill="writing"
              sessionId={sessionId}
              hasTranscript={!!detail.sampleAnswer}
              hasKeywords={!!(detail.keywords && detail.keywords.length > 0)}
              accentColor={COLOR}
            />

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
                style={[s.editor, { color: c.foreground }]}
                value={text}
                onChangeText={setText}
                placeholder="Viết bài của bạn ở đây..."
                placeholderTextColor={c.placeholder}
                multiline
                textAlignVertical="top"
                scrollEnabled
              />
            </DepthCard>

            {/* Sample answer (if available) */}
            {detail.sampleAnswer && (
              <DepthCard
                style={{
                  ...s.sampleCard,
                  backgroundColor: c.muted,
                }}
              >
                <Text style={[s.sampleLabel, { color: c.mutedForeground }]}>Bài mẫu tham khảo</Text>
                <Text style={[s.sampleText, { color: c.foreground }]}>{detail.sampleAnswer}</Text>
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
  wordCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center", paddingHorizontal: spacing.xl },
  previewMeta: { fontSize: fontSize.sm, marginTop: spacing.sm },
  previewNote: { fontSize: fontSize.xs, marginTop: spacing.xs },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  resultTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  resultSub: { fontSize: fontSize.sm },
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  promptText: { fontSize: fontSize.sm, lineHeight: 22 },
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
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1 },
});
