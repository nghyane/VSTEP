import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const maxMs = part.durationMinutes * 60 * 1000;
  const {
    audioUri,
    elapsedMs,
    error: recorderError,
    isRecording: isRec,
    reset: resetRecorder,
    setAudioUri,
    start: startRecorder,
    stop: stopRecorder,
  } = useExpoAudioRecorder({ maxMs });
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
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
    void resetRecorder();
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setIsPlaying(false);
    setRecError(null);
    setRecordedSeconds(0);
  }, [partIdx, resetRecorder]);

  useEffect(() => () => {
    soundRef.current?.unloadAsync().catch(() => undefined);
  }, []);

  async function startRec() {
    setRecError(null);
    const started = await startRecorder();
    if (!started) {
      setRecError(recorderError ?? "Khong the khoi tao ghi am.");
    }
  }

  const stopRec = useCallback(async () => {
    const uri = await stopRecorder();
    const duration = Math.max(1, Math.round(elapsedMs / 1000));
    if (!uri) {
      setRecError("Ghi am that bai, khong co file.");
      setRecordedSeconds(0);
      return;
    }
    setAudioUri(uri);
    setRecordedSeconds(duration);
  }, [elapsedMs, setAudioUri, stopRecorder]);

  async function uploadAudio(): Promise<string | null> {
    if (!audioUri) return null;
    setUploading(true);
    try {
      const { audioKey } = await uploadSpeakingAudio(audioUri, "exam_speaking");
      return audioKey;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmRecord() {
    const audioKey = await uploadAudio();
    if (!audioKey) {
      setRecError("Táº£i lÃªn tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i.");
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
      setRecError(`KhÃ´ng phÃ¡t Ä‘Æ°á»£c: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleRerecord() {
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setIsPlaying(false);
    void resetRecorder();
    setRecError(null);
    setRecordedSeconds(0);
    onClearSpeakingAnswer(part.id);
  }

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
        <Text style={[s.promptLabel, { color: accentDark }]}>Part {part.part} Â· {part.type}</Text>
        <Text style={[s.promptMeta, { color: c.mutedForeground }]}>{part.durationMinutes} phÃºt Â· Ghi Ã¢m cÃ¢u tráº£ lá»i</Text>
      </View>
      <View style={[s.recCard, { backgroundColor: c.card, borderColor: isRec ? accentColor : c.border }]}>
        <View style={[s.recStatusPill, { backgroundColor: isRec ? c.destructiveTint : uploading ? c.infoTint : hasRecording ? c.primaryTint : c.coinTint }]}>
          <Ionicons
            name={isRec ? "radio-button-on" : uploading ? "cloud-upload-outline" : hasRecording ? "checkmark-circle" : audioUri ? "play-circle-outline" : "mic-outline"}
            size={15}
            color={isRec ? c.destructive : uploading ? c.info : hasRecording ? c.primary : accentDark}
          />
          <Text style={[s.recStatusText, { color: isRec ? c.destructive : uploading ? c.info : hasRecording ? c.primaryDark : accentDark }]}>
            {isRec ? "Äang ghi Ã¢m" : uploading ? "Äang táº£i lÃªn" : hasRecording ? "ÄÃ£ lÆ°u cÃ¢u tráº£ lá»i" : audioUri ? "Sáºµn sÃ ng xÃ¡c nháº­n" : "Sáºµn sÃ ng ghi"}
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
              {isRec ? "Dá»«ng ghi Ã¢m" : "Báº¯t Ä‘áº§u nÃ³i"}
            </DepthButton>
          </>
        )}
        {audioUri && !hasRecording && (
          <>
            <DepthButton variant="secondary" onPress={handlePlayback} disabled={isPlaying || uploading}>
              {isPlaying ? "Äang phÃ¡t..." : "Nghe láº¡i"}
            </DepthButton>
            <DepthButton variant="secondary" onPress={handleRerecord} disabled={uploading}>
              Ghi Ã¢m láº¡i
            </DepthButton>
            <DepthButton onPress={handleConfirmRecord} disabled={uploading}>
              {uploading ? "Äang táº£i lÃªn..." : "XÃ¡c nháº­n & tiáº¿p"}
            </DepthButton>
          </>
        )}
        {hasRecording && (
          <View style={s.doneRow}>
            <Ionicons name="checkmark-circle" size={16} color={c.primary} />
            <Text style={[s.doneText, { color: c.primaryDark }]}>ÄÃ£ ghi Ã¢m Â· {recordedSeconds || part.durationMinutes * 60}s</Text>
          </View>
        )}
        {recError && <Text style={[s.errorText, { color: c.destructive }]}>{recError}</Text>}
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
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center" },
});
