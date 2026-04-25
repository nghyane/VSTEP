import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotResult } from "@/components/MascotStates";
import {
  useSpeakingTaskDetail,
  startSpeakingSession,
  submitSpeakingSession,
  presignUpload,
  type SpeakingTopic,
} from "@/hooks/use-practice";
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
            <Ionicons name="mic" size={40} color={COLOR_TEXT} />
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
    content: { topics: SpeakingTopic[] };
  };
  sessionId: string;
  onBack: () => void;
  insets: { top: number; bottom: number };
  c: ReturnType<typeof useThemeColors>;
  router: ReturnType<typeof useRouter>;
}

function RecordScreen({ detail, sessionId, onBack, insets, c, router }: RecordScreenProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);
  const maxMs = detail.speakingSeconds * 1000;
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
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setIsRecording(true);
      setElapsedMs(0);
      startRef.current = Date.now();
      tickRef.current = setInterval(() => {
        if (!startRef.current) return;
        const el = Date.now() - startRef.current;
        setElapsedMs(el);
        if (el >= maxMs) stopRecording(rec);
      }, 100);
    } catch {
      // permission denied — silently ignore
    }
  }, [maxMs]);

  const stopRecording = useCallback(async (rec?: Audio.Recording) => {
    const r = rec ?? recording;
    if (!r) return;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    await r.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    setAudioUri(r.getURI());
    setIsRecording(false);
    setRecording(null);
  }, [recording]);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  // Upload audio to presign URL, then submit
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!audioUri) throw new Error("No audio file");

      // Step 1: Get presigned upload URL
      const presign = await presignUpload("speaking");

      // Step 2: Upload raw audio bytes to presigned URL
      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      await fetch(presign.uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: { "Content-Type": "audio/webm" },
      });

      // Step 3: Submit with audio_key
      return submitSpeakingSession(sessionId, presign.audioKey, Math.round(elapsedMs / 1000));
    },
    onSuccess: (res) => {
      setSubmitted(res.submissionId);
      const allSentences = detail.content.topics.reduce(
        (acc, t) => acc + t.questions.length,
        0,
      );
      setTotalSentences(allSentences);
      setScore(0);
    },
  });

  const handlePlayback = useCallback(async () => {
    if (!audioUri) return;
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    await sound.playAsync();
  }, [audioUri]);

  if (submitted) {
    return (
      <View style={[s.root, { backgroundColor: c.background }]}>
        <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
          <HapticTouchable onPress={onBack} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={c.foreground} />
          </HapticTouchable>
          <Text style={[s.topBarTitle, { color: c.foreground }]}>Kết quả luyện nói</Text>
        </View>
        <MascotResult
          score={score}
          total={totalSentences}
          onBack={onBack}
          backLabel="Quay lại"
        />
      </View>
    );
  }

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
          {detail.content.topics.map((topic) => (
            <View key={topic.name} style={s.topicBlock}>
              <Text style={[s.topicName, { color: c.foreground }]}>{topic.name}</Text>
              {topic.questions.map((q) => (
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
            <TouchableOpacity onPress={() => stopRecording()} style={s.waveformBtn}>
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
            </TouchableOpacity>
          ) : (
            <View style={s.micBtnWrap}>
              {audioUri ? (
                <>
                  <TouchableOpacity onPress={handlePlayback} style={[s.micBtn, { backgroundColor: c.muted, borderBottomColor: "#CACACA" }]}>
                    <Ionicons name="play" size={28} color={c.mutedForeground} />
                    <Text style={[s.micBtnText, { color: c.mutedForeground }]}>Nghe lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={startRecording} style={[s.micBtn, { backgroundColor: COLOR, borderBottomColor: COLOR_DARK }]}>
                    <Ionicons name="refresh" size={28} color="#fff" />
                    <Text style={[s.micBtnText, { color: "#fff" }]}>Ghi âm lại</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={startRecording} style={[s.micBtn, { backgroundColor: COLOR, borderBottomColor: COLOR_DARK }]}>
                  <Ionicons name="mic" size={28} color="#fff" />
                  <Text style={[s.micBtnText, { color: "#fff" }]}>Bắt đầu nói</Text>
                </TouchableOpacity>
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
          <DepthButton
            fullWidth
            disabled={submitMutation.isPending}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
  submittingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
});
