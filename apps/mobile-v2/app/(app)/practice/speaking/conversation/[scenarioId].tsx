import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import {
  endSpeakingConversation,
  SpeakingConversationEndSummary,
  SpeakingConversationSession,
  SpeakingConversationTurn,
  SpeakingConversationTurnFeedback,
  startSpeakingConversation,
  submitSpeakingConversationTurn,
  useSpeakingConversationReview,
} from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function SpeakingConversationScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const startedRef = useRef(false);
  const [session, setSession] = useState<SpeakingConversationSession | null>(null);
  const [turns, setTurns] = useState<SpeakingConversationTurn[]>([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<SpeakingConversationEndSummary | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const review = useSpeakingConversationReview(session?.sessionId ?? "", !!summary);
  const speakingColor = c.skillSpeaking;
  const speakingText = c.coinDark;

  const startMutation = useMutation({
    mutationFn: () => startSpeakingConversation(scenarioId ?? ""),
    onSuccess: (res) => {
      setSession(res);
      setTurns(res.turns);
      setErrorText(null);
      const firstAi = res.turns.find((turn) => turn.role === "ai" || turn.role === "assistant");
      if (firstAi) speakTurn(firstAi);
    },
    onError: () => setErrorText("Không thể bắt đầu hội thoại. Thử lại sau nhé."),
  });

  const turnMutation = useMutation({
    mutationFn: (text: string) => {
      if (!session) throw new Error("No conversation session");
      return submitSpeakingConversationTurn(session.sessionId, text, 1);
    },
    onSuccess: (res) => {
      setTurns((prev) => [...prev, res.userTurn, res.aiTurn]);
      setInput("");
      setErrorText(res.session.shouldEnd ? "Bạn đã đủ lượt mục tiêu. Có thể kết thúc để xem review." : null);
      speakTurn(res.aiTurn);
    },
    onError: () => setErrorText("Tin nhắn chưa gửi được. Kiểm tra mạng rồi thử lại."),
  });

  const endMutation = useMutation({
    mutationFn: () => {
      if (!session) throw new Error("No conversation session");
      return endSpeakingConversation(session.sessionId);
    },
    onSuccess: (res) => {
      setSummary(res);
      setErrorText(null);
    },
    onError: () => setErrorText("Chưa thể kết thúc phiên. Thử lại một lần nữa."),
  });

  useEffect(() => {
    if (!scenarioId || startedRef.current) return;
    startedRef.current = true;
    startMutation.mutate();
  }, [scenarioId, startMutation]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(handle);
  }, [turns.length, summary]);

  const progress = useMemo(() => {
    if (!session) return "0/0";
    const userTurns = turns.filter((turn) => turn.role === "user").length;
    return `${userTurns}/${session.scenario.expectedTurns}`;
  }, [session, turns]);

  const appendWord = (word: string) => {
    setInput((value) => (value.trim().length > 0 ? `${value.trim()} ${word}` : word));
  };

  const speakTurn = (turn: SpeakingConversationTurn) => {
    Speech.stop();
    setSpeakingTurnId(turn.id);
    Speech.speak(turn.text, {
      language: "en-US",
      rate: 0.9,
      onDone: () => setSpeakingTurnId(null),
      onStopped: () => setSpeakingTurnId(null),
      onError: () => setSpeakingTurnId(null),
    });
  };

  const handleClose = () => {
    if (summary) {
      router.back();
      return;
    }
    Alert.alert(
      "Kết thúc hội thoại?",
      "Phiên này chưa xem review. Bạn muốn kết thúc và thoát không?",
      [
        { text: "Ở lại", style: "cancel" },
        {
          text: "Kết thúc",
          style: "destructive",
          onPress: () => endMutation.mutate(undefined, { onSettled: () => router.back() }),
        },
      ],
    );
  };

  const send = () => {
    const text = input.trim();
    if (!text || turnMutation.isPending || summary) return;
    turnMutation.mutate(text);
  };

  if (startMutation.isPending || !session) {
    return (
      <View style={[s.center, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={speakingColor} />
        <Text style={[s.loadingText, { color: c.mutedForeground }]}>Đang mở phòng roleplay...</Text>
        {errorText ? <Text style={[s.errorText, { color: c.destructive }]}>{errorText}</Text> : null}
        {startMutation.isError ? (
          <DepthButton onPress={() => startMutation.mutate()} style={{ minWidth: 140, backgroundColor: speakingColor, borderColor: speakingColor }}>
            Thử lại
          </DepthButton>
        ) : null}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.topBar, { paddingTop: insets.top + spacing.md, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={handleClose} style={s.iconButton}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={s.topCopy}>
          <Text style={[s.topTitle, { color: c.foreground }]} numberOfLines={1}>{session.scenario.title}</Text>
          <Text style={[s.topSub, { color: c.mutedForeground }]}>{session.scenario.characterName} · {progress} lượt</Text>
        </View>
        <HapticTouchable
          disabled={endMutation.isPending || !!summary}
          onPress={() => endMutation.mutate()}
          style={[s.endButton, { backgroundColor: c.coinTint, opacity: summary ? 0.5 : 1 }]}
        >
          <Text style={[s.endText, { color: speakingText }]}>{endMutation.isPending ? "..." : "End"}</Text>
        </HapticTouchable>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.chatScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DepthCard style={s.scenarioCard}>
          <Text style={[s.scenarioLabel, { color: speakingText }]}>AI ROLEPLAY</Text>
          <Text style={[s.scenarioTitle, { color: c.foreground }]}>{session.scenario.description ?? "Phản xạ nhanh bằng tiếng Anh với AI."}</Text>
          {session.scenario.targetVocab.length > 0 ? (
            <View style={s.chipRow}>
              {session.scenario.targetVocab.slice(0, 6).map((word) => (
                <HapticTouchable key={word} onPress={() => appendWord(word)} style={[s.vocabChip, { backgroundColor: c.coinTint }]}>
                  <Text style={[s.vocabText, { color: speakingText }]}>{word}</Text>
                </HapticTouchable>
              ))}
            </View>
          ) : null}
        </DepthCard>

        {turns.map((turn) => (
          <TurnBubble key={turn.id} turn={turn} appendWord={appendWord} isSpeaking={speakingTurnId === turn.id} onSpeak={() => speakTurn(turn)} />
        ))}

        {errorText ? (
          <View style={[s.notice, { backgroundColor: c.warningTint, borderColor: c.warning }]}>
            <Text style={[s.noticeText, { color: c.foreground }]}>{errorText}</Text>
          </View>
        ) : null}

        {summary ? (
          <ReviewBlock summary={summary} review={review.data ?? null} loading={review.isLoading} />
        ) : null}
      </ScrollView>

      {!summary ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: c.borderLight, backgroundColor: c.surface }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập câu trả lời hoặc transcript sau khi nói..."
            placeholderTextColor={c.placeholder}
            multiline
            style={[s.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]}
          />
          <HapticTouchable
            onPress={send}
            disabled={input.trim().length === 0 || turnMutation.isPending}
            style={[s.sendButton, { backgroundColor: speakingColor, opacity: input.trim().length === 0 ? 0.45 : 1 }]}
          >
            {turnMutation.isPending ? <ActivityIndicator color={c.foreground} /> : <Ionicons name="send" size={20} color={c.foreground} />}
          </HapticTouchable>
        </View>
      ) : (
        <View style={[s.doneFooter, { paddingBottom: insets.bottom + spacing.md, backgroundColor: c.surface, borderTopColor: c.borderLight }]}>
          <DepthButton fullWidth onPress={() => router.back()} style={{ backgroundColor: speakingColor, borderColor: speakingColor }}>
            Quay lại Speaking
          </DepthButton>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function TurnBubble({
  turn,
  appendWord,
  isSpeaking,
  onSpeak,
}: {
  turn: SpeakingConversationTurn;
  appendWord: (word: string) => void;
  isSpeaking: boolean;
  onSpeak: () => void;
}) {
  const c = useThemeColors();
  const isUser = turn.role === "user";
  return (
    <View style={[s.turnWrap, isUser ? s.turnRight : s.turnLeft]}>
      <View
        style={[
          s.bubble,
          {
            backgroundColor: isUser ? c.coinTint : c.card,
            borderColor: isUser ? c.skillSpeaking : c.border,
          },
        ]}
      >
        <View style={s.bubbleHeader}>
          <Text style={[s.bubbleRole, { color: isUser ? c.coinDark : c.subtle }]}>{isUser ? "Bạn" : "AI"}</Text>
          {!isUser ? (
            <HapticTouchable onPress={onSpeak} style={[s.speakMini, { backgroundColor: isSpeaking ? c.coinTint : c.surfaceTint }]}>
              <Ionicons name={isSpeaking ? "volume-high" : "volume-medium-outline"} size={14} color={c.coinDark} />
            </HapticTouchable>
          ) : null}
        </View>
        <Text style={[s.bubbleText, { color: c.foreground }]}>{turn.text}</Text>
        {turn.feedback ? <TurnFeedback feedback={turn.feedback} /> : null}
        {turn.suggestedWords.length > 0 ? (
          <View style={s.chipRow}>
            {turn.suggestedWords.slice(0, 4).map((word) => (
              <HapticTouchable key={word} onPress={() => appendWord(word)} style={[s.smallChip, { backgroundColor: c.surfaceTint }]}>
                <Text style={[s.smallChipText, { color: c.foreground }]}>{word}</Text>
              </HapticTouchable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function TurnFeedback({ feedback }: { feedback: SpeakingConversationTurnFeedback }) {
  const c = useThemeColors();
  const used = feedback.vocabCheck?.filter((item) => item.used).length ?? feedback.wordCount?.used ?? 0;
  const target = feedback.vocabCheck?.length ?? feedback.wordCount?.target ?? 0;
  return (
    <View style={[s.feedbackBox, { backgroundColor: c.surfaceTint, borderColor: c.borderLight }]}>
      <View style={s.feedbackLine}>
        <Ionicons name={feedback.grammarOk === false ? "alert-circle-outline" : "checkmark-circle-outline"} size={15} color={feedback.grammarOk === false ? c.warning : c.success} />
        <Text style={[s.feedback, { color: c.mutedForeground }]}>
          Grammar {feedback.grammarOk === false ? "cần sửa" : "ổn"}{target > 0 ? ` · vocab ${used}/${target}` : ""}
        </Text>
      </View>
      {feedback.better && (
        <Text style={[s.feedbackBetter, { color: c.foreground }]}>{feedback.better}</Text>
      )}
    </View>
  );
}

function ReviewBlock({
  summary,
  review,
  loading,
}: {
  summary: SpeakingConversationEndSummary;
  review: NonNullable<ReturnType<typeof useSpeakingConversationReview>["data"]> | null;
  loading: boolean;
}) {
  const c = useThemeColors();
  return (
    <DepthCard style={s.reviewCard}>
      <Text style={[s.reviewTitle, { color: c.foreground }]}>Review phiên nói</Text>
      <View style={s.reviewStats}>
        <Stat label="Lượt" value={String(summary.userTurnCount)} />
        <Stat label="Từ vựng" value={`${summary.vocabUsedPct}%`} />
        <Stat label="Grammar" value={`${summary.grammarOkPct}%`} />
      </View>
      {loading ? <ActivityIndicator color={c.skillSpeaking} /> : null}
      {review?.strengths?.length ? <ReviewList title="Điểm tốt" items={review.strengths} /> : null}
      {review?.improvements?.length ? <ReviewList title="Cần cải thiện" items={review.improvements} /> : null}
      {review?.correctedSentences?.length ? (
        <View style={s.reviewSection}>
          <Text style={[s.reviewSectionTitle, { color: c.foreground }]}>Câu sửa nhanh</Text>
          {review.correctedSentences.slice(0, 3).map((item) => (
            <View key={`${item.original}-${item.corrected}`} style={[s.correction, { borderColor: c.border }]}>
              <Text style={[s.correctionText, { color: c.mutedForeground }]}>{item.original}</Text>
              <Text style={[s.correctionText, { color: c.foreground }]}>{item.corrected}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {review?.tip ? <Text style={[s.tip, { color: c.coinDark }]}>{review.tip}</Text> : null}
    </DepthCard>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  const c = useThemeColors();
  return (
    <View style={s.reviewSection}>
      <Text style={[s.reviewSectionTitle, { color: c.foreground }]}>{title}</Text>
      {items.slice(0, 4).map((item) => (
        <Text key={item} style={[s.reviewItem, { color: c.mutedForeground }]}>• {item}</Text>
      ))}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={[s.stat, { backgroundColor: c.coinTint }]}>
      <Text style={[s.statValue, { color: c.coinDark }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  loadingText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  errorText: { fontSize: fontSize.sm, textAlign: "center" },
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topCopy: { flex: 1 },
  topTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  topSub: { fontSize: fontSize.xs, marginTop: 2 },
  endButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  endText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  chatScroll: { padding: spacing.lg, gap: spacing.md },
  scenarioCard: { gap: spacing.sm, padding: spacing.lg },
  scenarioLabel: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1 },
  scenarioTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, lineHeight: 22 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  vocabChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  vocabText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  turnWrap: { width: "100%" },
  turnLeft: { alignItems: "flex-start" },
  turnRight: { alignItems: "flex-end" },
  bubble: { maxWidth: "86%", borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  bubbleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  bubbleRole: { fontSize: 10, fontFamily: fontFamily.extraBold },
  speakMini: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  bubbleText: { fontSize: fontSize.sm, lineHeight: 21 },
  feedback: { fontSize: fontSize.xs, lineHeight: 18 },
  feedbackBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  feedbackLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  feedbackBetter: { fontSize: fontSize.xs, lineHeight: 18, fontFamily: fontFamily.semiBold },
  smallChip: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full },
  smallChipText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  notice: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  noticeText: { fontSize: fontSize.sm, lineHeight: 20 },
  footer: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  doneFooter: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 120, minHeight: 48, borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, textAlignVertical: "top" },
  sendButton: { width: 48, height: 48, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  reviewCard: { gap: spacing.md, padding: spacing.lg },
  reviewTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  reviewStats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" },
  statValue: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  statLabel: { fontSize: fontSize.xs },
  reviewSection: { gap: spacing.xs },
  reviewSectionTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  reviewItem: { fontSize: fontSize.sm, lineHeight: 20 },
  correction: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  correctionText: { fontSize: fontSize.xs, lineHeight: 18 },
  tip: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
});
