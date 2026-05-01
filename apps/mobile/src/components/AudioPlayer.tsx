import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";

// ---------------------------------------------------------------------------
// Presigned URL resolution — mirrors frontend's storage.ts
// Private R2 paths (e.g. "listening/b1_part2.wav") need presigning.
// Full URLs (http/https) are used as-is.
// ---------------------------------------------------------------------------

function isFullUrl(s: string): boolean {
  return s.startsWith("http://") || s.startsWith("https://");
}

function usePresignedUrl(storageKey: string | undefined) {
  return useQuery({
    queryKey: ["presigned-url", storageKey],
    queryFn: async () => {
      if (!storageKey) return "";
      if (isFullUrl(storageKey)) return storageKey;
      return storageKey; // mock: use key as URL directly
    },
    enabled: !!storageKey,
    staleTime: 50 * 60 * 1000, // 50 min cache (URL valid 60 min)
    gcTime: 60 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// AudioPlayer component
// ---------------------------------------------------------------------------

interface AudioPlayerProps {
  audioUrl: string;
  seekable?: boolean;
}

export function AudioPlayer({ audioUrl, seekable = true }: AudioPlayerProps) {
  const c = useThemeColors();
  const { data: resolvedUrl, isLoading: resolving, error: presignError } = usePresignedUrl(audioUrl);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!resolvedUrl) return;
    let mounted = true;
    setIsLoaded(false);
    setLoadError(false);

    async function load() {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: resolvedUrl! },
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
        if (mounted) setLoadError(true);
      }
    }

    load();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [resolvedUrl]);

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

  // Loading state while resolving presigned URL
  if (resolving) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.controls}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>Đang tải audio...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (presignError || loadError) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.controls}>
          <Ionicons name="alert-circle-outline" size={20} color={c.destructive} />
          <Text style={{ color: c.destructive, fontSize: fontSize.xs }}>Không thể tải audio</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
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
        <Text style={[styles.timeText, { color: c.subtle }]}>{formatMs(positionMs)}</Text>
        <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: c.primary }]} />
        </View>
        <Text style={[styles.timeText, { color: c.subtle }]}>{formatMs(durationMs)}</Text>
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

export { usePresignedUrl };

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
