import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import {
  useSpeakingTaskDetail,
  startSpeakingSession,
  submitSpeakingSession,
  type SpeakingTopic,
} from "@/hooks/use-practice";
import { useExpoAudioRecorder } from "@/hooks/use-audio-recorder";
import { getApiErrorMessage } from "@/lib/api";
import { uploadSpeakingAudio } from "@/lib/audio-upload";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";
const COLOR_DARK = "#DCAA00";
const COLOR_TEXT = "#A07800";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function SpeakingExerciseScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { data: detail, isLoading } = useSpeakingTaskDetail(taskId ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startMutation = useMutation({
    mutationFn: () => startSpeakingSession(taskId ?? ""),
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
          <View style={[s.partChip, { backgroundColor: COLOR + "25" }]}>
            <Text style={[s.partChipText, { color: COLOR_TEXT }]}>Part {detail.part}</Text>
          </View>
        </View>
        <View style={[s.fullCenter, { flex: 1 }]}>
          <View style={[s.previewIcon, { backgroundColor: COLOR + "25" }]}>
            <GameIcon name="speaking" size={48} />
          </View>
          <Text style={[s.previewTitle, { color: c.foreground }]}>{detail.title}</Text>
          <Text style={[s.previewMeta, { color: c.subtle }]}> 
            {detail.speakingSeconds}s · {detail.taskType}
          </Text>
          <Text style={[s.previewNote, { color: c.mutedForeground }]}>Ghi âm câu trả lời · AI chấm phát âm và nội dung</Text>
          <DepthButton
            onPress={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            style={{ marginTop: spacing.xl, minWidth: 200, backgroundColor: COLOR, borderColor: COLOR }}
          >
            {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu"}
          </DepthButton>
          {startMutation.error ? (
            <Text style={[s.inlineError, { color: c.destructive }]}>
              Không thể bắt đầu bài nói: {getApiErrorMessage(startMutation.error)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <RecordScreen
      detail={detail}
      sessionId={sessionId}
      onBack={() => router.back()}
      insets={insets}
      c={c}
      router={router}
    />
  );
}

interface RecordScreenProps {
  detail: {
    title: string;
    part: number;
    taskType: string;
    speakingSeconds: number;
    content: { topics?: SpeakingTopic[] } | null;
  };
  sessionId: string;
  onBack: () => void;
  insets: { top: number; bottom: number };
  c: ReturnType<typeof useThemeColors>;
  router: ReturnType<typeof useRouter>;
}

function RecordScreen({ detail, sessionId, onBack, insets, c, router }: RecordScreenProps) {
  const maxMs = detail.speakingSeconds * 1000;
  const recorder = useExpoAudioRecorder({ maxMs });
  const audioUri = recorder.audioUri;
  const isRecording = recorder.isRecording;
  const elapsedMs = recorder.elapsedMs;
  const countdown = Math.max(0, detail.speakingSeconds - elapsedMs / 1000);
  const barAnim = useRef(new Animated.Value(0)).current;

  // Waveform animation while recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(barAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(barAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      barAnim.stopAnimation();
      barAnim.setValue(0);
    }
  }, [barAnim, isRecording]);

  async function startRecording() {
    submitMutation.reset();
    const started = await recorder.start();
    if (!started) {
      Alert.alert(
        "Không thể ghi âm",
        recorder.error ?? "Hãy kiểm tra quyền truy cập micro trong cài đặt thiết bị.",
      );
    }
  }

  const stopRecording = useCallback(async () => {
    await recorder.stop();
  }, [recorder]);

  // Upload audio to presign URL, then submit
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!audioUri) throw new Error("No audio file");

      const { audioKey } = await uploadSpeakingAudio(audioUri, "practice_speaking");
      return submitSpeakingSession(sessionId, audioKey, Math.max(1, Math.ceil(elapsedMs / 1000)));
    },
    onSuccess: (res) => {
      router.replace({
        pathname: "/(app)/grading/speaking/[submissionId]",
        params: { submissionId: res.submissionId },
      } as never);
    },
  });

  const handlePlayback = useCallback(async () => {
    if (!audioUri) return;

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
  }, [audioUri]);

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]} numberOfLines={1}>{detail.title}</Text>
        <View style={[s.partChip, { backgroundColor: COLOR + "25" }]}>
          <Text style={[s.partChipText, { color: COLOR_TEXT }]}>Part {detail.part}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Prompt card */}
        <DepthCard style={s.promptCard}>
          <View style={[s.taskTypeBadge, { backgroundColor: COLOR + "25" }]}>
            <Text style={[s.taskTypeText, { color: COLOR_TEXT }]}>Part {detail.part} · {detail.taskType}</Text>
          </View>
          {detail.content?.topics?.map((topic) => (
            <View key={topic.name} style={s.topicBlock}>
              <Text style={[s.topicName, { color: c.foreground }]}>{topic.name}</Text>
              {(topic.questions ?? []).map((q) => (
                <View key={q} style={s.topicQRow}>
                  <Text style={{ color: COLOR }}>•</Text>
                  <Text style={[s.topicQ, { color: c.subtle }]}>{q}</Text>
                </View>
              ))}
            </View>
          ))}
        </DepthCard>

        {/* Recorder card */}
        <DepthCard
          style={{
            ...s.recorderCard,
            borderColor: isRecording ? COLOR : c.border,
            borderBottomColor: isRecording ? COLOR_DARK : "#CACACA",
          }}
        >
          {/* Countdown */}
          <View style={s.countdownRow}>
            <Text style={[s.countdownLabel, { color: c.mutedForeground }]}>Thời gian còn lại</Text>
            <Text style={[s.countdown, { color: isRecording && countdown < 10 ? "#FF9B00" : COLOR_TEXT }]}>
              {fmt(countdown)}
            </Text>
          </View>

          {/* Waveform / mic button */}
          {isRecording ? (
            <HapticTouchable onPress={() => stopRecording()} style={s.waveformBtn}>
              <View style={s.waveform}>
                {Array.from({ length: 20 }, (_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.waveBar,
                      { backgroundColor: COLOR },
                      {
                        transform: [{
                          scaleY: barAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3 + (i % 3) * 0.2, 0.6 + (i % 5) * 0.3],
                          }),
                        }],
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[s.waveHint, { color: c.mutedForeground }]}>Bấm để dừng</Text>
            </HapticTouchable>
          ) : (
            <View style={s.micBtnWrap}>
              {audioUri ? (
                <>
                  <HapticTouchable onPress={handlePlayback} style={[s.micBtn, { backgroundColor: c.muted, borderBottomColor: "#CACACA" }]}>
                    <Ionicons name="play" size={28} color={c.mutedForeground} />
                    <Text style={[s.micBtnText, { color: c.mutedForeground }]}>Nghe lại</Text>
                  </HapticTouchable>
                  <HapticTouchable onPress={startRecording} style={[s.micBtn, { backgroundColor: COLOR, borderBottomColor: COLOR_DARK }]}>
                    <Ionicons name="refresh" size={28} color="#fff" />
                    <Text style={[s.micBtnText, { color: "#fff" }]}>Ghi âm lại</Text>
                  </HapticTouchable>
                </>
              ) : (
                <HapticTouchable onPress={startRecording} style={[s.micBtn, { backgroundColor: COLOR, borderBottomColor: COLOR_DARK }]}>
                  <Ionicons name="mic" size={28} color="#fff" />
                  <Text style={[s.micBtnText, { color: "#fff" }]}>Bắt đầu nói</Text>
                </HapticTouchable>
              )}
            </View>
          )}

          {!isRecording && !audioUri && (
            <Text style={[s.recHint, { color: c.subtle }]}>Đọc đề bài, chuẩn bị rồi bấm để ghi âm</Text>
          )}

          {audioUri && !isRecording && (
            <Text style={[s.recHint, { color: c.success }]}>Đã ghi xong — sẵn sàng nộp bài</Text>
          )}
        </DepthCard>

        {/* Submit */}
        {audioUri && !isRecording && (
          <View style={s.submitBlock}>
          <DepthButton
            fullWidth
            disabled={submitMutation.isPending}
            onPress={() => {
              submitMutation.mutate();
            }}
            style={{ backgroundColor: COLOR, borderColor: COLOR }}
          >
            {submitMutation.isPending ? (
              <View style={s.submittingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[s.micBtnText, { color: "#fff" }]}>Đang upload...</Text>
              </View>
            ) : (
              "Nộp bài"
            )}
          </DepthButton>
          {submitMutation.error ? (
            <Text style={[s.inlineError, { color: c.destructive }]}>
              Không thể nộp bài: {getApiErrorMessage(submitMutation.error)}
            </Text>
          ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.md, borderBottomWidth: 1 },
  closeBtn: { padding: 4 },
  topBarTitle: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  partChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  partChipText: { fontSize: 11, fontFamily: fontFamily.bold },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center", paddingHorizontal: spacing.xl },
  previewMeta: { fontSize: fontSize.sm, marginTop: spacing.sm },
  previewNote: { fontSize: fontSize.xs, marginTop: spacing.xs, textAlign: "center", paddingHorizontal: spacing.xl },
  inlineError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center", marginTop: spacing.sm },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  resultTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  resultSub: { fontSize: fontSize.sm },
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  taskTypeBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  taskTypeText: { fontSize: 11, fontFamily: fontFamily.bold },
  topicBlock: { gap: spacing.xs },
  topicName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  topicQRow: { flexDirection: "row", gap: spacing.sm },
  topicQ: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  recorderCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.lg },
  countdownRow: { alignItems: "center", gap: 4 },
  countdownLabel: { fontSize: fontSize.xs },
  countdown: { fontSize: 40, fontFamily: fontFamily.extraBold },
  waveformBtn: { alignItems: "center", gap: spacing.sm },
  waveform: { flexDirection: "row", alignItems: "center", gap: 3, height: 48 },
  waveBar: { width: 4, height: 24, borderRadius: 2 },
  waveHint: { fontSize: fontSize.xs },
  micBtnWrap: { gap: spacing.sm, width: "100%" },
  micBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 0,
    borderBottomWidth: 4,
  },
  micBtnText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  recHint: { fontSize: fontSize.xs, textAlign: "center" },
  submitBlock: { gap: spacing.sm },
  submittingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
});
