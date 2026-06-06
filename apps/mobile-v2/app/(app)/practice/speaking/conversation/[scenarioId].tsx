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
import { useSpeechToText } from "@/hooks/useSpeechToText";
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

  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);

  // Auto-end active session only when the screen is actually unmounted.
  // Do not depend on conv/session objects here: mic/STT state updates re-render this
  // screen, and effect cleanup would otherwise end the session immediately.
  const cleanupRef = useRef(false);
  const latestConvRef = useRef(conv);
  latestConvRef.current = conv;

  useEffect(() => {
    return () => {
      const latest = latestConvRef.current;
      if (!cleanupRef.current && latest.session && !latest.summary) {
        cleanupRef.current = true;
        latest.endSession();
      }
    };
  }, []);

  const speechToText = useSpeechToText({
    maxSeconds: MAX_RECORD_SECONDS,
    language: "en-US",
    onResult: (transcript) => {
      // Auto-submit transcript directly (mirror FE v3 doSubmit).
      conv.submitVoice(transcript);
    },
  });

  // Mic pulse animation (listening + AI speaking states)
  useEffect(() => {
    const active = speechToText.state === "listening" || speechToText.state === "processing" || !!speakingTurnId;
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      micPulseAnim.stopAnimation();
      micPulseAnim.setValue(0);
    }
  }, [speechToText.state, speakingTurnId, micPulseAnim]);

  // Auto-scroll
  useEffect(() => {
    const handle = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(handle);
  }, [conv.turns.length, conv.summary, speechToText.state, conv.isSubmitting]);

  const progress = useMemo(() => {
    if (!conv.session) return "0/0";
    const userTurns = conv.turns.filter((turn) => turn.role === "user").length;
    return `${userTurns}/${conv.session.scenario.expectedTurns}`;
  }, [conv.session, conv.turns]);

  const handleMicPress = async () => {
    if (speechToText.state === "listening") {
      speechToText.stop();
      return;
    }
    if (speechToText.isAvailable === false) {
      Alert.alert(
        "Chua the dung micro",
        speechToText.error ?? "Nhan dien giong noi can development build. Expo Go chua ho tro tinh nang nay.",
      );
      return;
    }
    if (speechToText.state === "idle") {
      const started = await speechToText.start();
      if (!started && speechToText.error) {
        Alert.alert("Chua the dung micro", speechToText.error);
      }
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

  if (conv.isStarting) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.skillSpeaking} />
        <Text style={[s.loadingText, { color: c.mutedForeground }]}>Đang mở phòng roleplay...</Text>
      </View>
    );
  }

  if (conv.isStartError) {
    // BE Flow 6 (commit 3ff8a4a) introduced 422 active-conflict + 503 service-down.
    // - active-conflict → no retry; user must end the prior session.
    // - service-down / generic → retry button.
    const isConflict = conv.startErrorKind === "active-conflict";
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <Ionicons
          name={isConflict ? "warning-outline" : "cloud-offline-outline"}
          size={48}
          color={c.destructive}
        />
        <Text style={[s.errorTitle, { color: c.foreground }]}>
          {isConflict ? "Phiên hội thoại đang mở" : "Không thể bắt đầu"}
        </Text>
        <Text style={[s.errorText, { color: c.mutedForeground }]}>
          {conv.startErrorMessage ?? "Vui lòng thử lại."}
        </Text>
        <View style={s.errorActions}>
          {!isConflict && (
            <DepthButton
              onPress={() => conv.retryStart()}
              style={{ minWidth: 140, backgroundColor: c.skillSpeaking, borderColor: c.skillSpeaking }}
            >
              Thử lại
            </DepthButton>
          )}
          <DepthButton
            variant="secondary"
            onPress={() => router.back()}
            style={{ minWidth: 140 }}
          >
            Quay lại
          </DepthButton>
        </View>
      </View>
    );
  }

  if (!conv.session) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.skillSpeaking} />
      </View>
    );
  }

  const session = conv.session;

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.topBar, { borderBottomColor: c.borderLight, paddingTop: insets.top + spacing.sm }]}>
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
                <View key={word} style={[s.vocabChip, { backgroundColor: c.coinTint }]}>
                  <Text style={[s.vocabText, { color: c.coinDark }]}>{word}</Text>
                </View>
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
            onSpeak={() => {
              setSpeakingTurnId(turn.id);
              conv.speakTurn(turn);
              // Roughly 90ms per character — clear highlight after estimated playback.
              const ms = Math.max(2000, turn.text.length * 90);
              setTimeout(() => {
                setSpeakingTurnId((current) => (current === turn.id ? null : current));
              }, ms);
            }}
          />
        ))}

        {speechToText.state === "processing" ? <UserTurnProcessingBubble /> : null}

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
          {/* Live transcript while listening (mirror FE v3 listening state) */}
          {(speechToText.state === "listening" || speechToText.state === "processing") && (
            <View style={[s.sttBlock, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[s.sttLabel, { color: c.mutedForeground }]}>
                {speechToText.state === "processing" ? "Đang chuyển thành chữ..." : "Đang nghe..."}
              </Text>
              <Text style={[s.sttTranscript, { color: c.foreground }]} numberOfLines={2}>
                {speechToText.transcript || (speechToText.state === "processing" ? "Đang xử lý bản ghi..." : "Nói vào micro...")}
              </Text>
              <View style={s.sttTimerRow}>
                <Ionicons name="timer-outline" size={14} color={c.mutedForeground} />
                <Text style={[s.sttTimer, { color: c.mutedForeground }]}>{speechToText.elapsed}s / {MAX_RECORD_SECONDS}s</Text>
              </View>
            </View>
          )}

          {/* Mic-only input — mirror FE v3 mic-centered footer */}
          <View style={s.micCenter}>
            {speakingTurnId ? (
              /* AI đang phát — nhấn để bỏ qua (FE v3 "speaking" state) */
              <View style={s.micLargeWrap}>
                <Animated.View
                  style={[
                    s.micPulseLarge,
                    {
                      backgroundColor: c.skillSpeaking + "20",
                      opacity: micPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
                      transform: [{ scale: micPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
                    },
                  ]}
                />
                <HapticTouchable onPress={() => setSpeakingTurnId(null)} style={[s.micLargeBtn, { backgroundColor: c.skillSpeaking, borderBottomColor: c.coinDark }]}>
                  <Ionicons name="volume-high" size={28} color={c.primaryForeground} />
                </HapticTouchable>
              </View>
            ) : speechToText.state === "listening" ? (
              <View style={s.micLargeWrap}>
                <Animated.View
                  style={[
                    s.micPulseLarge,
                    {
                      backgroundColor: c.destructive + "40",
                      opacity: micPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
                      transform: [{ scale: micPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
                    },
                  ]}
                />
                <HapticTouchable onPress={handleMicPress} style={[s.micLargeBtn, { backgroundColor: c.destructive, borderBottomColor: "#B5322A" }]}>
                  <View style={[s.micStopSquare, { backgroundColor: c.primaryForeground }]} />
                </HapticTouchable>
              </View>
            ) : speechToText.state === "processing" ? (
              <View style={[s.micLargeBtn, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <ActivityIndicator size="small" color={c.skillSpeaking} />
              </View>
            ) : (
              <HapticTouchable
                onPress={handleMicPress}
                disabled={
                  conv.isSubmitting ||
                  speechToText.isAvailable === null
                }
                style={[s.micLargeBtn, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: "#CACACA", opacity: conv.isSubmitting ? 0.5 : 1 }]}
              >
                {speechToText.isAvailable === null ? (
                  <ActivityIndicator size="small" color={c.skillSpeaking} />
                ) : (
                  <Ionicons name="mic" size={28} color={c.skillSpeaking} />
                )}
              </HapticTouchable>
            )}
            <Text style={[s.micHint, { color: c.mutedForeground }]}>
              {speakingTurnId
                ? "Đang phát · Nhấn để bỏ qua"
                : speechToText.state === "listening"
                  ? `${speechToText.elapsed}s / ${MAX_RECORD_SECONDS}s`
                  : speechToText.state === "processing"
                    ? "Đang chuyển giọng nói thành chữ..."
                  : speechToText.isAvailable === false
                    ? "Thiết bị không hỗ trợ"
                    : speechToText.isAvailable === null
                      ? "Đang kiểm tra..."
                      : conv.isSubmitting
                        ? "Đang xử lý..."
                        : "Nhấn để nói"}
            </Text>

            {speechToText.error && speechToText.state !== "unavailable" && (
              <Text style={[s.sttError, { color: c.destructive }]}>{speechToText.error}</Text>
            )}
          </View>
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

function UserTurnProcessingBubble() {
  const c = useThemeColors();
  return (
    <View style={s.userProcessingWrap}>
      <View style={[s.userProcessingBubble, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[s.processingDot, { backgroundColor: c.mutedForeground }]} />
        <View style={[s.processingDot, { backgroundColor: c.mutedForeground }]} />
        <View style={[s.processingDot, { backgroundColor: c.mutedForeground }]} />
      </View>
    </View>
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
        <Stat label="Ngữ pháp" value={`${summary.grammarOkPct}%`} c={c} />
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
  errorTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, textAlign: "center" },
  errorText: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  errorActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
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
  notice: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  noticeText: { fontSize: fontSize.sm, lineHeight: 20 },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },
  pendingText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  userProcessingWrap: { alignItems: "flex-end" },
  userProcessingBubble: { flexDirection: "row", gap: spacing.xs, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  processingDot: { width: 7, height: 7, borderRadius: 4 },
  footer: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  doneFooter: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  sttBlock: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs },
  sttLabel: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1 },
  sttTranscript: { fontSize: fontSize.sm, lineHeight: 21, fontFamily: fontFamily.medium },
  sttTimerRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sttTimer: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  micCenter: { alignItems: "center", gap: spacing.xs },
  micLargeWrap: { position: "relative", width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  micPulseLarge: { position: "absolute", width: 72, height: 72, borderRadius: 36, backgroundColor: "transparent" },
  micLargeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  micStopSquare: { width: 20, height: 20, borderRadius: 4 },
  micHint: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
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
  sttError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center", marginTop: spacing.xs },
});
