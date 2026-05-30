import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { DepthButton } from "@/components/DepthButton";
import { useExpoAudioRecorder } from "@/hooks/use-audio-recorder";
import { uploadSpeakingAudio } from "@/lib/audio-upload";
import { useThemeColors, spacing, radius, fontSize, fontFamily, colors as themeColors } from "@/theme";
import type { ExamVersionSpeakingPart } from "@/types/api";

interface SpeakingAnswer {
  partId: string;
  audioUrl: string | null;
  durationSeconds: number;
}

interface SpeakingPanelProps {
  parts: ExamVersionSpeakingPart[];
  done: Set<string>;
  onDone: (partId: string) => void;
  onSetSpeakingAnswer: (partId: string, answer: SpeakingAnswer) => void;
  onClearSpeakingAnswer: (partId: string) => void;
  onBusyChange: (busy: boolean) => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { top: number; bottom: number; left: number; right: number };
}

export function SpeakingPanel({ parts, done, onDone, onSetSpeakingAnswer, onClearSpeakingAnswer, onBusyChange, c, insets }: SpeakingPanelProps) {
  const [partIdx, setPartIdx] = useState(0);
  const part = parts[partIdx];
  const maxSeconds = Math.max(1, (part?.durationMinutes ?? 1) * 60);
  const maxMs = maxSeconds * 1000;
  const {
    audioUri,
    elapsedMs,
    error: recorderError,
    isRecording,
    reset: resetRecorder,
    setAudioUri,
    start: startRecorder,
    stop: stopRecorder,
  } = useExpoAudioRecorder({ maxMs });
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const accentColor = themeColors.light.skillSpeaking;
  const accentDark = themeColors.light.skillSpeaking + "CC";
  const isBusy = isRecording || uploading;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const progressPct = Math.min(100, Math.round((elapsedSeconds / maxSeconds) * 100));

  useEffect(() => {
    onBusyChange(isBusy);
    return () => onBusyChange(false);
  }, [isBusy, onBusyChange]);

  useEffect(() => {
    void resetRecorder();
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setIsPlaying(false);
    setRecordedSeconds(0);
  }, [partIdx, resetRecorder]);

  useEffect(() => () => {
    soundRef.current?.unloadAsync().catch(() => undefined);
  }, []);

  const showRecordingNotice = useCallback((message: string) => {
    Alert.alert("Không thể ghi âm", message);
  }, []);

  async function startRec() {
    const started = await startRecorder();
    if (!started) {
      if (__DEV__ && recorderError) {
        console.warn("Exam speaking recorder failed", recorderError);
      }
      showRecordingNotice("Thiết bị hoặc bản chạy hiện tại chưa hỗ trợ ghi âm. Hãy thử lại trong development build.");
    }
  }

  const stopRec = useCallback(async () => {
    const duration = Math.max(1, Math.round((elapsedMs || 1000) / 1000));
    const uri = await stopRecorder();
    if (!uri) {
      showRecordingNotice("Không tạo được file ghi âm. Hãy thử ghi lại.");
      setRecordedSeconds(0);
      return;
    }
    setAudioUri(uri);
    setRecordedSeconds(duration);
  }, [elapsedMs, setAudioUri, showRecordingNotice, stopRecorder]);

  async function uploadAudio(): Promise<string | null> {
    if (!audioUri) return null;
    setUploading(true);
    try {
      const { audioKey } = await uploadSpeakingAudio(audioUri, "exam_speaking");
      return audioKey;
    } catch (error) {
      if (__DEV__) {
        console.warn("Exam speaking upload failed", error);
      }
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmRecord() {
    const audioKey = await uploadAudio();
    if (!audioKey) {
      Alert.alert("Chưa lưu được ghi âm", "Vui lòng kiểm tra mạng và thử lại.");
      return;
    }
    const duration = recordedSeconds || Math.max(1, Math.round((elapsedMs || 1000) / 1000));
    const answer: SpeakingAnswer = { partId: part.id, audioUrl: audioKey, durationSeconds: duration };
    onSetSpeakingAnswer(part.id, answer);
    onDone(part.id);
  }

  async function handlePlayback() {
    if (!audioUri) return;
    try {
      await soundRef.current?.unloadAsync().catch(() => undefined);
      soundRef.current = null;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) setIsPlaying(status.isPlaying);
        },
      );
      soundRef.current = newSound;
    } catch (error) {
      if (__DEV__) {
        console.warn("Exam speaking playback failed", error);
      }
      Alert.alert("Không phát được ghi âm", "Vui lòng thử ghi lại.");
    }
  }

  function handleRerecord() {
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setIsPlaying(false);
    void resetRecorder();
    setRecordedSeconds(0);
    onClearSpeakingAnswer(part.id);
  }

  if (!part) return null;

  const hasRecording = done.has(part.id);

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {parts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.sectionTabs, { borderBottomColor: c.borderLight }]} contentContainerStyle={s.sectionTabsContent}>
          {parts.map((p, i) => (
            <TouchableOpacity
              key={p.id}
              disabled={isBusy}
              onPress={() => setPartIdx(i)}
              style={[s.sectionTab, { borderBottomColor: i === partIdx ? accentColor : "transparent", opacity: isBusy && i !== partIdx ? 0.45 : 1 }]}
            >
              <Text style={[s.sectionTabText, { color: i === partIdx ? accentDark : c.mutedForeground }]}>Part {p.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={[s.promptCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.promptLabel, { color: accentDark }]}>Part {part.part} - {part.type}</Text>
        <Text style={[s.promptMeta, { color: c.mutedForeground }]}>{part.durationMinutes} phút - Ghi âm câu trả lời</Text>
      </View>

      <View style={[s.recCard, { backgroundColor: c.card, borderColor: isRecording ? accentColor : c.border }]}>
        <View style={[s.recStatusPill, { backgroundColor: isRecording ? c.destructiveTint : uploading ? c.infoTint : hasRecording ? c.primaryTint : c.coinTint }]}>
          <Ionicons
            name={isRecording ? "radio-button-on" : uploading ? "cloud-upload-outline" : hasRecording ? "checkmark-circle" : audioUri ? "play-circle-outline" : "mic-outline"}
            size={15}
            color={isRecording ? c.destructive : uploading ? c.info : hasRecording ? c.primary : accentDark}
          />
          <Text style={[s.recStatusText, { color: isRecording ? c.destructive : uploading ? c.info : hasRecording ? c.primaryDark : accentDark }]}>
            {isRecording ? "Đang ghi âm" : uploading ? "Đang tải lên" : hasRecording ? "Đã lưu câu trả lời" : audioUri ? "Sẵn sàng xác nhận" : "Sẵn sàng ghi"}
          </Text>
        </View>

        {!audioUri && !hasRecording ? (
          <>
            {isRecording ? (
              <View style={s.recTimerBlock}>
                <Text style={[s.timerText, { color: accentDark }]}>
                  {elapsedSeconds}s / {maxSeconds}s
                </Text>
                <View style={[s.recProgressTrack, { backgroundColor: c.borderLight }]}>
                  <View style={[s.recProgressFill, { width: `${progressPct}%`, backgroundColor: accentColor }]} />
                </View>
              </View>
            ) : null}
            <DepthButton onPress={isRecording ? stopRec : startRec} disabled={uploading}>
              {isRecording ? "Dừng ghi âm" : "Bắt đầu nói"}
            </DepthButton>
          </>
        ) : null}

        {audioUri && !hasRecording ? (
          <>
            <DepthButton variant="secondary" onPress={handlePlayback} disabled={isPlaying || uploading}>
              {isPlaying ? "Đang phát..." : "Nghe lại"}
            </DepthButton>
            <DepthButton variant="secondary" onPress={handleRerecord} disabled={uploading}>
              Ghi âm lại
            </DepthButton>
            <DepthButton onPress={handleConfirmRecord} disabled={uploading}>
              {uploading ? "Đang tải lên..." : "Xác nhận & tiếp"}
            </DepthButton>
          </>
        ) : null}

        {hasRecording ? (
          <>
            <View style={s.doneRow}>
              <Ionicons name="checkmark-circle" size={16} color={c.primary} />
              <Text style={[s.doneText, { color: c.primaryDark }]}>Đã ghi âm - {recordedSeconds || maxSeconds}s</Text>
            </View>
            <DepthButton variant="secondary" onPress={handleRerecord} disabled={uploading}>
              Ghi lại phần này
            </DepthButton>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  panelScroll: { padding: spacing.xl, gap: spacing.lg },
  sectionTabs: { borderBottomWidth: 1, flexGrow: 0, flexShrink: 0, maxHeight: 58 },
  sectionTabsContent: { alignItems: "center", paddingHorizontal: spacing.sm, paddingRight: spacing.xl },
  sectionTab: { minWidth: 108, alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 2 },
  sectionTabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  promptMeta: { fontSize: fontSize.xs },
  recCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.lg },
  recStatusPill: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  recStatusText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  recTimerBlock: { width: "100%", alignItems: "center", gap: spacing.sm },
  recProgressTrack: { width: "100%", height: 8, borderRadius: radius.full, overflow: "hidden" },
  recProgressFill: { height: "100%", borderRadius: radius.full },
  timerText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  doneRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  doneText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
});
