import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { DepthButton } from "@/components/DepthButton";
import { presignUpload } from "@/hooks/use-practice";
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
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRec, setIsRec] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);
  const accentColor = themeColors.light.skillSpeaking;
  const accentDark = themeColors.light.skillSpeaking + "CC";
  const isBusy = isRec || uploading;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const progressPct = Math.min(100, Math.round((elapsedSeconds / part.durationMinutes * 60) * 100));

  useEffect(() => {
    onBusyChange(isBusy);
    return () => onBusyChange(false);
  }, [isBusy, onBusyChange]);

  useEffect(() => {
    setAudioUri(null);
    setIsRec(false);
    setRecording(null);
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setIsPlaying(false);
    setRecError(null);
    setElapsedMs(0);
    setRecordedSeconds(0);
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, [partIdx]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    soundRef.current?.unloadAsync().catch(() => undefined);
  }, []);

  async function startRec() {
    setRecError(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setRecError("Không có quyền truy cập micro.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRec(true);
      setElapsedMs(0);
      startRef.current = Date.now();
      tickRef.current = setInterval(() => {
        if (!startRef.current) return;
        setElapsedMs(Date.now() - startRef.current);
      }, 200);
    } catch {
      setRecError("Không thể khởi tạo ghi âm.");
    }
  }

  const stopRec = useCallback(async () => {
    if (!recording) return;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const uri = recording.getURI();
      const duration = Math.max(1, Math.round(elapsedMs / 1000));
      if (!uri) {
        setRecError("Ghi âm thất bại, không có file.");
        setIsRec(false);
        setRecording(null);
        return;
      }
      setAudioUri(uri);
      setRecordedSeconds(duration);
      setIsRec(false);
      setRecording(null);
    } catch {
      setRecError("Không thể dừng ghi âm. Hãy thử ghi lại.");
      setAudioUri(null);
      setRecordedSeconds(0);
      setIsRec(false);
      setRecording(null);
    }
  }, [elapsedMs, recording]);

  useEffect(() => {
    if (isRec && recording && elapsedMs >= part.durationMinutes * 60 * 1000) {
      void stopRec();
    }
  }, [elapsedMs, isRec, part.durationMinutes, recording, stopRec]);

  async function uploadAudio(): Promise<string | null> {
    if (!audioUri) return null;
    setUploading(true);
    try {
      const presign = await presignUpload("exam_speaking");
      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      await fetch(presign.uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: { "Content-Type": "audio/webm" },
      }).then((res) => {
        if (!res.ok) throw new Error("Upload failed");
      });
      return presign.audioKey;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmRecord() {
    const audioKey = await uploadAudio();
    if (!audioKey) {
      setRecError("Tải lên thất bại. Vui lòng thử lại.");
      return;
    }
    const duration = recordedSeconds || Math.max(1, Math.round(elapsedMs / 1000));
    const answer: SpeakingAnswer = { partId: part.id, audioUrl: audioKey, durationSeconds: duration };
    onSetSpeakingAnswer(part.id, answer);
    onDone(part.id);
  }

  async function handlePlayback() {
    if (!audioUri) return;
    try {
      await soundRef.current?.unloadAsync().catch(() => undefined);
      soundRef.current = null;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => { if (status.isLoaded) setIsPlaying(status.isPlaying); },
      );
      soundRef.current = newSound;
    } catch (e: unknown) {
      setRecError(`Không phát được: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleRerecord() {
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setIsPlaying(false);
    setAudioUri(null);
    setRecError(null);
    setElapsedMs(0);
    setRecordedSeconds(0);
    onClearSpeakingAnswer(part.id);
  }

  const hasRecording = done.has(part.id);

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {parts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
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
        <Text style={[s.promptLabel, { color: accentDark }]}>Part {part.part} · {part.type}</Text>
        <Text style={[s.promptMeta, { color: c.mutedForeground }]}>{part.durationMinutes} phút · Ghi âm câu trả lời</Text>
      </View>
      <View style={[s.recCard, { backgroundColor: c.card, borderColor: isRec ? accentColor : c.border }]}>
        <View style={[s.recStatusPill, { backgroundColor: isRec ? c.destructiveTint : uploading ? c.infoTint : hasRecording ? c.primaryTint : c.coinTint }]}>
          <Ionicons
            name={isRec ? "radio-button-on" : uploading ? "cloud-upload-outline" : hasRecording ? "checkmark-circle" : audioUri ? "play-circle-outline" : "mic-outline"}
            size={15}
            color={isRec ? c.destructive : uploading ? c.info : hasRecording ? c.primary : accentDark}
          />
          <Text style={[s.recStatusText, { color: isRec ? c.destructive : uploading ? c.info : hasRecording ? c.primaryDark : accentDark }]}>
            {isRec ? "Đang ghi âm" : uploading ? "Đang tải lên" : hasRecording ? "Đã lưu câu trả lời" : audioUri ? "Sẵn sàng xác nhận" : "Sẵn sàng ghi"}
          </Text>
        </View>
        {!audioUri && !hasRecording && (
          <>
            {isRec && (
              <View style={s.recTimerBlock}>
                <Text style={[s.timerText, { color: accentDark }]}>
                  {elapsedSeconds}s / {part.durationMinutes * 60}s
                </Text>
                <View style={[s.recProgressTrack, { backgroundColor: c.borderLight }]}>
                  <View style={[s.recProgressFill, { width: `${progressPct}%`, backgroundColor: accentColor }]} />
                </View>
              </View>
            )}
            <DepthButton onPress={isRec ? stopRec : startRec} disabled={uploading}>
              {isRec ? "Dừng ghi âm" : "Bắt đầu nói"}
            </DepthButton>
          </>
        )}
        {audioUri && !hasRecording && (
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
        )}
        {hasRecording && (
          <View style={s.doneRow}>
            <Ionicons name="checkmark-circle" size={16} color={c.primary} />
            <Text style={[s.doneText, { color: c.primaryDark }]}>Đã ghi âm · {recordedSeconds || part.durationMinutes * 60}s</Text>
          </View>
        )}
        {recError && <Text style={[s.errorText, { color: c.destructive }]}>{recError}</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  panelScroll: { padding: spacing.xl, gap: spacing.lg },
  sectionTabs: { borderBottomWidth: 1, flexGrow: 0 },
  sectionTab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 2 },
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
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center" },
});
