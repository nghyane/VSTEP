import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ConversationTurnView } from "@/components/ConversationTurnView";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useConversationSession } from "@/hooks/use-conversation-session";
import { useSpeakingConversationReview } from "@/hooks/use-practice";
import { useSpeechToText, type MicState } from "@/hooks/useSpeechToText";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const MAX_RECORD_SECONDS = 30;

export default function SpeakingConversationScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const micPulseAnim = useRef(new Animated.Value(0)).current;

  const conv = useConversationSession(scenarioId ?? "");
  const review = useSpeakingConversationReview(conv.session?.sessionId ?? "", !!conv.summary);

  const [micState, setMicState] = useState<MicState>("idle");
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);

  const speechToText = useSpeechToText({
    maxSeconds: MAX_RECORD_SECONDS,
    language: "en-US",
    onResult: (transcript) => {
      conv.setInput(transcript);
      setMicState("idle");
    },
    onEnd: () => setMicState("idle"),
    onError: () => setMicState("idle"),
  });

  // Mic pulse animation
  useEffect(() => {
    if (speechToText.state === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      micPulseAnim.setValue(0);
    }
  }, [speechToText.state, micPulseAnim]);

  // Auto-scroll
  useEffect(() => {
    const handle = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(handle);
  }, [conv.turns.length, conv.summary]);

  const progress = useMemo(() => {
    if (!conv.session) return "0/0";
    const userTurns = conv.turns.filter((turn) => turn.role === "user").length;
    return `${userTurns}/${conv.session.scenario.expectedTurns}`;
  }, [conv.session, conv.turns]);

  const handleMicPress = () => {
    if (micState === "listening") {
      speechToText.stop();
      setMicState("stopped");
      return;
    }
    if (micState === "idle") {
      conv.setInput("");
      speechToText.start();
      setMicState("listening");
    }
  };

  const handleClose = () => {
    if (conv.summary) {
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
          onPress: () => conv.endSession(),
        },
      ],
    );
  };

  if (conv.isStarting || !conv.session) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.skillSpeaking} />
        <Text style={[s.loadingText, { color: c.mutedForeground }]}>Đang mở phòng roleplay...</Text>
        {conv.errorText && <Text style={[s.errorText, { color: c.destructive }]}>{conv.errorText}</Text>}
        {conv.isStartError && (
          <DepthButton onPress={() => conv.retryStart()} style={{ minWidth: 140, backgroundColor: c.skillSpeaking, borderColor: c.skillSpeaking }}>
            Thử lại
          </DepthButton>
        )}
      </View>
    );
  }

  const session = conv.session;

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.topBar, { borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={handleClose} style={s.iconButton}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={s.topCopy}>
          <Text style={[s.topTitle, { color: c.foreground }]} numberOfLines={1}>{session.scenario.title}</Text>
          <Text style={[s.topSub, { color: c.mutedForeground }]}>{session.scenario.characterName} · {progress} lượt</Text>
        </View>
        <HapticTouchable
          disabled={conv.isEnding || !!conv.summary}
          onPress={() => conv.endSession()}
          style={[s.endButton, { backgroundColor: c.coinTint, opacity: conv.summary ? 0.5 : 1 }]}
        >
          <Text style={[s.endText, { color: c.coinDark }]}>{conv.isEnding ? "..." : "End"}</Text>
        </HapticTouchable>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.chatScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DepthCard style={s.scenarioCard}>
          <Text style={[s.scenarioLabel, { color: c.coinDark }]}>AI ROLEPLAY</Text>
          <Text style={[s.scenarioTitle, { color: c.foreground }]}>{session.scenario.description ?? "Phản xạ nhanh bằng tiếng Anh với AI."}</Text>
          {session.scenario.targetVocab.length > 0 && (
            <View style={s.chipRow}>
              {session.scenario.targetVocab.slice(0, 6).map((word) => (
                <HapticTouchable key={word} onPress={() => conv.appendWord(word)} style={[s.vocabChip, { backgroundColor: c.coinTint }]}>
                  <Text style={[s.vocabText, { color: c.coinDark }]}>{word}</Text>
                </HapticTouchable>
              ))}
            </View>
          )}
        </DepthCard>

        {conv.turns.map((turn) => (
          <ConversationTurnView
            key={turn.id}
            turn={turn}
            scenario={session.scenario}
            isSpeaking={speakingTurnId === turn.id}
            onSpeak={() => conv.speakTurn(turn)}
            onAppendWord={conv.appendWord}
          />
        ))}

        {conv.isSubmitting && (
          <View style={s.pendingRow}>
            <View style={[s.pendingDot, { backgroundColor: c.skillSpeaking }]} />
            <Text style={[s.pendingText, { color: c.mutedForeground }]}>Đang xử lý...</Text>
          </View>
        )}

        {conv.errorText && !conv.isStarting && (
          <View style={[s.notice, { backgroundColor: c.warningTint, borderColor: c.warning }]}>
            <Text style={[s.noticeText, { color: c.foreground }]}>{conv.errorText}</Text>
          </View>
        )}

        {conv.summary && <ReviewBlock summary={conv.summary} review={review.data ?? null} loading={review.isLoading} c={c} />}
      </ScrollView>

      {!conv.summary ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: c.borderLight, backgroundColor: c.surface }]}>
          {speechToText.state === "listening" && (
            <View style={[s.sttBlock, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[s.sttLabel, { color: c.mutedForeground }]}>Đang nghe...</Text>
              <Text style={[s.sttTranscript, { color: c.foreground }]} numberOfLines={2}>
                {speechToText.transcript || "Nói vào micro..."}
              </Text>
              <View style={s.sttTimerRow}>
                <Ionicons name="timer-outline" size={14} color={c.mutedForeground} />
                <Text style={[s.sttTimer, { color: c.mutedForeground }]}>{speechToText.elapsed}s / {MAX_RECORD_SECONDS}s</Text>
              </View>
            </View>
          )}

          <View style={s.inputRow}>
            <TextInput
              value={conv.input}
              onChangeText={conv.setInput}
              placeholder={speechToText.isAvailable ? "Nhập hoặc dùng micro để nói..." : "Nhập câu trả lời..."}
              placeholderTextColor={c.placeholder}
              multiline
              style={[s.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]}
            />
            <HapticTouchable
              onPress={conv.sendText}
              disabled={conv.input.trim().length === 0 || conv.isSubmitting}
              style={[s.sendButton, { backgroundColor: c.skillSpeaking, opacity: conv.input.trim().length === 0 || conv.isSubmitting ? 0.45 : 1 }]}
            >
              {conv.isSubmitting ? <ActivityIndicator color={c.foreground} /> : <Ionicons name="send" size={20} color={c.foreground} />}
            </HapticTouchable>
          </View>

          {speechToText.isAvailable && (
            <View style={s.micRow}>
              {speechToText.state === "listening" ? (
                <Animated.View
                  style={[
                    s.micPulse,
                    {
                      opacity: micPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
                      transform: [{ scale: micPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
                    },
                  ]}
                />
              ) : null}
              <DepthButton
                onPress={handleMicPress}
                disabled={!speechToText.isAvailable || speechToText.state === "listening"}
                variant={speechToText.state === "listening" ? "destructive" : "secondary"}
                size="sm"
                style={s.micButton}
              >
                <Ionicons
                  name={speechToText.state === "listening" ? "stop" : "mic"}
                  size={18}
                  color={speechToText.state === "listening" ? "#fff" : c.skillSpeaking}
                />
                <Text style={[s.micButtonText, { color: speechToText.state === "listening" ? "#fff" : c.skillSpeaking }]}>
                  {speechToText.state === "listening" ? "Dừng" : "Nói"}
                </Text>
              </DepthButton>
            </View>
          )}
        </View>
      ) : (
        <View style={[s.doneFooter, { paddingBottom: insets.bottom + spacing.md, backgroundColor: c.surface, borderTopColor: c.borderLight }]}>
          <DepthButton fullWidth onPress={() => router.back()} style={{ backgroundColor: c.skillSpeaking, borderColor: c.skillSpeaking }}>
            Quay lại Speaking
          </DepthButton>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function ReviewBlock({
  summary,
  review,
  loading,
  c,
}: {
  summary: { userTurnCount: number; vocabUsedPct: number; grammarOkPct: number };
  review: { strengths: string[]; improvements: string[]; correctedSentences: { original: string; corrected: string; explanation: string }[]; tip: string | null } | null;
  loading: boolean;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <DepthCard style={s.reviewCard}>
      <Text style={[s.reviewTitle, { color: c.foreground }]}>Review phiên nói</Text>
      <View style={s.reviewStats}>
        <Stat label="Lượt" value={String(summary.userTurnCount)} c={c} />
        <Stat label="Từ vựng" value={`${summary.vocabUsedPct}%`} c={c} />
        <Stat label="Grammar" value={`${summary.grammarOkPct}%`} c={c} />
      </View>
      {loading ? <ActivityIndicator color={c.skillSpeaking} /> : null}
      {review?.strengths?.length ? <ReviewList title="Điểm tốt" items={review.strengths} c={c} /> : null}
      {review?.improvements?.length ? <ReviewList title="Cần cải thiện" items={review.improvements} c={c} /> : null}
      {review?.correctedSentences?.length ? (
        <View style={s.reviewSection}>
          <Text style={[s.reviewSectionTitle, { color: c.foreground }]}>Câu sửa nhanh</Text>
          {review.correctedSentences.slice(0, 3).map((item, i) => (
            <View key={`${item.original}-${i}`} style={[s.correction, { borderColor: c.border }]}>
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

function ReviewList({ title, items, c }: { title: string; items: string[]; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={s.reviewSection}>
      <Text style={[s.reviewSectionTitle, { color: c.foreground }]}>{title}</Text>
      {items.slice(0, 4).map((item) => (
        <Text key={item} style={[s.reviewItem, { color: c.mutedForeground }]}>• {item}</Text>
      ))}
    </View>
  );
}

function Stat({ label, value, c }: { label: string; value: string; c: ReturnType<typeof useThemeColors> }) {
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
  pendingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },
  pendingText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  footer: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  doneFooter: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  input: { flex: 1, maxHeight: 120, minHeight: 48, borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, textAlignVertical: "top" },
  sendButton: { width: 48, height: 48, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  sttBlock: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs },
  sttLabel: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1 },
  sttTranscript: { fontSize: fontSize.sm, lineHeight: 21, fontFamily: fontFamily.medium },
  sttTimerRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sttTimer: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  micRow: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.sm },
  micPulse: { position: "absolute", width: 40, height: 40, borderRadius: 20 },
  micButton: { width: 100 },
  micButtonText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
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
