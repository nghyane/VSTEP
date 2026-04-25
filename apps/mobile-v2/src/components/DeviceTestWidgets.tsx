import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { HapticTouchable } from "./HapticTouchable";

const TEST_AUDIO_URL =
  "https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Audio Test Player ──

export function AudioTestPlayer() {
  const c = useThemeColors();
  const audioRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: TEST_AUDIO_URL },
          { shouldPlay: false },
        );
        if (mounted) {
          audioRef.current = sound;
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.durationMillis != null) {
            setDuration(status.durationMillis / 1000);
            setLoading(false);
          }
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      audioRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    const interval = setInterval(async () => {
      const status = await audioRef.current!.getStatusAsync();
      if (status.isLoaded) {
        setCurrentTime(status.positionMillis / 1000);
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        await audio.pauseAsync();
        setPlaying(false);
      } else {
        await audio.playAsync();
        setPlaying(true);
        setPassed(true);
      }
    } catch {
      /* ignore */
    }
  }, [playing]);

  const progress = duration > 0 ? currentTime / duration : 0;

  if (loading) {
    return (
      <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <ActivityIndicator color={c.primary} />
        <Text style={[s.audioLabel, { color: c.subtle }]}>Đang tải audio...</Text>
      </View>
    );
  }

  return (
    <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.audioHeader}>
        <Ionicons name="volume-high" size={18} color={passed ? c.primary : c.subtle} />
        <Text style={[s.audioLabel, { color: c.foreground }]}>
          {passed ? "Đã kiểm tra" : "Nghe thử âm thanh"}
        </Text>
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: c.primary }]} />
      </View>

      <View style={s.audioControls}>
        <Text style={[s.timeText, { color: c.subtle }]}>{formatTime(currentTime)}</Text>
        <HapticTouchable onPress={handleToggle} style={[s.playBtn, { backgroundColor: playing ? c.muted : c.primary }]}>
          <Ionicons name={playing ? "pause" : "play"} size={18} color={playing ? c.mutedForeground : c.primaryForeground} />
        </HapticTouchable>
        <Text style={[s.timeText, { color: c.subtle }]}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

// ── Mic Test ──

export function MicTest() {
  const c = useThemeColors();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRec, setIsRec] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [playback, setPlayback] = useState<Audio.Sound | null>(null);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setIsRec(true);
      setAudioUri(null);
    } catch {
      /* ignore */
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRec(false);
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }

  async function playRecording() {
    if (!audioUri) return;
    try {
      if (playback) {
        await playback.unloadAsync();
        setPlayback(null);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setPlayback(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => undefined);
          setPlayback(null);
        }
      });
      await sound.playAsync();
    } catch {
      /* ignore */
    }
  }

  return (
    <View style={[s.micCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.micHeader}>
        <Ionicons name="mic" size={18} color={isRec ? c.destructive : audioUri ? c.primary : c.subtle} />
        <Text style={[s.micLabel, { color: c.foreground }]}>
          {isRec ? "Đang ghi âm..." : audioUri ? "Đã kiểm tra" : "Thu âm thử"}
        </Text>
      </View>

      <View style={s.micControls}>
        {!isRec && !audioUri && (
          <HapticTouchable onPress={startRecording} style={[s.micBtn, { backgroundColor: c.primary }]}>
            <Ionicons name="mic" size={20} color={c.primaryForeground} />
            <Text style={s.micBtnText}>Bắt đầu thu</Text>
          </HapticTouchable>
        )}

        {isRec && (
          <HapticTouchable onPress={stopRecording} style={[s.micBtn, { backgroundColor: c.destructive }]}>
            <Ionicons name="stop" size={20} color={c.primaryForeground} />
            <Text style={s.micBtnText}>Dừng thu</Text>
          </HapticTouchable>
        )}

        {audioUri && !isRec && (
          <HapticTouchable onPress={playRecording} style={[s.micBtn, { backgroundColor: playback ? c.muted : c.primary }]}>
            <Ionicons name={playback ? "stop" : "play"} size={20} color={playback ? c.mutedForeground : c.primaryForeground} />
            <Text style={[s.micBtnText, { color: playback ? c.mutedForeground : c.primaryForeground }]}>
              {playback ? "Dừng" : "Nghe lại"}
            </Text>
          </HapticTouchable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  audioCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm },
  audioHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  audioLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#E5E5E5" },
  progressFill: { height: 6, borderRadius: 3 },
  audioControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  timeText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, minWidth: 36, textAlign: "center" },

  micCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm },
  micHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  micLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  micControls: { flexDirection: "row", justifyContent: "center" },
  micBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  micBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
