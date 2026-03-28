import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";

interface AudioPlayerProps {
  audioUrl: string;
  seekable?: boolean;
}

export function AudioPlayer({ audioUrl, seekable = true }: AudioPlayerProps) {
  const c = useThemeColors();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          (status) => {
            if (!mounted) return;
            if (status.isLoaded) {
              setPositionMs(status.positionMillis);
              setDurationMs(status.durationMillis ?? 0);
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPositionMs(0);
                sound.setPositionAsync(0);
              }
            }
          },
        );
        soundRef.current = sound;
        if (mounted) setIsLoaded(true);
      } catch {
        // Audio load failed silently
      }
    }

    load();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [audioUrl]);

  async function togglePlay() {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }

  async function skip(ms: number) {
    if (!soundRef.current || !seekable) return;
    const newPos = Math.max(0, Math.min(positionMs + ms, durationMs));
    await soundRef.current.setPositionAsync(newPos);
  }

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.muted }]}>
      <View style={styles.controls}>
        {seekable && (
          <HapticTouchable onPress={() => skip(-5000)} style={styles.skipBtn}>
            <Ionicons name="play-back" size={18} color={c.foreground} />
          </HapticTouchable>
        )}

        <HapticTouchable
          onPress={togglePlay}
          style={[styles.playBtn, { backgroundColor: c.primary }]}
          disabled={!isLoaded}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={22}
            color={c.primaryForeground}
          />
        </HapticTouchable>

        {seekable && (
          <HapticTouchable onPress={() => skip(5000)} style={styles.skipBtn}>
            <Ionicons name="play-forward" size={18} color={c.foreground} />
          </HapticTouchable>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <Text style={[styles.timeText, { color: c.mutedForeground }]}>{formatMs(positionMs)}</Text>
        <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: c.primary }]} />
        </View>
        <Text style={[styles.timeText, { color: c.mutedForeground }]}>{formatMs(durationMs)}</Text>
      </View>
    </View>
  );
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtn: {
    padding: spacing.sm,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timeText: {
    fontSize: fontSize.xs,
    fontVariant: ["tabular-nums"],
    minWidth: 36,
    textAlign: "center",
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
});
