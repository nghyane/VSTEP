import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Audio } from "expo-av";
import { resolveAssetUrl } from "@/lib/asset-url";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { FocusHeader } from "@/components/FocusHeader";
import { McqQuestionCard } from "@/components/McqQuestionCard";
import { McqResultCard } from "@/components/McqResultCard";
import { SubmitFooter } from "@/components/SubmitFooter";
import { SupportPanel } from "@/components/SupportPanel";
import {
  useListeningExerciseDetail, useMcqSession,
  startListeningSession, submitListeningSession,
} from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { McqQuestion } from "@/hooks/use-practice";

const COLOR = "#1CB0F6";

export default function ListeningExerciseScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { data: detail, isLoading } = useListeningExerciseDetail(exerciseId ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startMutation = useMutation({
    mutationFn: () => startListeningSession(exerciseId ?? ""),
    onSuccess: (res) => setSessionId(res.id),
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
      <PreviewScreen
        detail={detail}
        starting={startMutation.isPending}
        onStart={() => startMutation.mutate()}
        onBack={() => router.back()}
        insets={insets}
        c={c}
      />
    );
  }

  return (
    <InProgressScreen
      detail={detail}
      sessionId={sessionId}
      onBack={() => router.back()}
      insets={insets}
      c={c}
    />
  );
}

function PreviewScreen({ detail, starting, onStart, onBack, insets, c }: any) {
  const { exercise, questions } = detail;
  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]} numberOfLines={1}>{exercise.title}</Text>
        <View style={[s.partChip, { backgroundColor: COLOR + "18" }]}>
          <Text style={[s.partChipText, { color: COLOR }]}>Part {exercise.part}</Text>
        </View>
      </View>
      <View style={[s.fullCenter, { flex: 1 }]}>
        <View style={[s.previewIcon, { backgroundColor: COLOR + "18" }]}>
          <Ionicons name="headset" size={40} color={COLOR} />
        </View>
        <Text style={[s.previewTitle, { color: c.foreground }]}>{exercise.title}</Text>
        {exercise.description && (
          <Text style={[s.previewDesc, { color: c.mutedForeground }]}>{exercise.description}</Text>
        )}
        <Text style={[s.previewMeta, { color: c.subtle }]}>{questions.length} câu hỏi</Text>
        <DepthButton
          onPress={onStart}
          disabled={starting}
          style={{ marginTop: spacing.xl, minWidth: 200, backgroundColor: COLOR, borderColor: COLOR }}
        >
          {starting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
        </DepthButton>
      </View>
    </View>
  );
}

function InProgressScreen({ detail, sessionId, onBack, insets, c }: any) {
  const { exercise, questions } = detail;
  const session = useMcqSession(sessionId, submitListeningSession, "listening");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [unlockedSupport, setUnlockedSupport] = useState<number[]>([]);
  const [showSub, setShowSub] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const hasSub = !!exercise.transcript || (exercise.wordTimestamps ?? []).length > 0;

  useEffect(() => {
    if (!exercise.audioUrl) return;
    setAudioError(null);
    const audioUrl = resolveAssetUrl(exercise.audioUrl);
    let s: Audio.Sound | null = null;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: loaded } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          (status) => {
            if (!status.isLoaded) return;
            setPosition(status.positionMillis ?? 0);
            setDuration(status.durationMillis ?? 0);
            setPlaying(status.isPlaying);
            if (status.durationMillis && status.durationMillis > 0) {
              Animated.timing(progressAnim, {
                toValue: (status.positionMillis ?? 0) / status.durationMillis,
                duration: 100,
                useNativeDriver: false,
              }).start();
            }
          },
        );
        s = loaded;
        setSound(loaded);
      } catch {
        setSound(null);
        setPlaying(false);
        setAudioError("Không tải được audio. Vui lòng thử lại sau.");
      }
    })();
    return () => { s?.unloadAsync().catch(() => undefined); };
  }, [exercise.audioUrl]);

  async function togglePlay() {
    if (!sound) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (playing) await sound.pauseAsync();
      else await sound.playAsync();
    } catch (e: any) {
      setPlaying(false);
      setAudioError(`Không phát được audio: ${e?.message ?? e}`);
    }
  }

  function fmt(ms: number) {
    const sec = Math.floor(ms / 1000);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }

  const pct = duration > 0 ? position / duration : 0;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Focus header */}
      <FocusHeader
        current={session.answeredCount}
        total={questions.length}
        accentColor={COLOR}
        onClose={onBack}
        c={c}
      />

      {/* Subtitle toggle */}
      {showSub && hasSub && (
        <View style={[s.subCard, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
          <Text style={[s.subText, { color: c.mutedForeground }]}>
            {exercise.vietnameseTranscript ?? exercise.transcript ?? "(Không có bản dịch)"}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
        {/* Audio card */}
        <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
          <Text style={[s.audioPartLabel, { color: COLOR }]}>Part {exercise.part}</Text>
          <Text style={[s.audioTitle, { color: c.foreground }]}>{exercise.title}</Text>
          {exercise.description && (
            <Text style={[s.audioDesc, { color: c.mutedForeground }]}>{exercise.description}</Text>
          )}
          <View style={s.audioControls}>
            <TouchableOpacity
              onPress={togglePlay}
              disabled={!sound || !!audioError}
              style={[s.playBtn, { backgroundColor: audioError ? c.mutedForeground : COLOR }]}
            >
              <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={[s.audioTrack, { backgroundColor: c.muted }]}>
                <Animated.View style={[s.audioFill, { backgroundColor: COLOR, width: `${pct * 100}%` }]} />
              </View>
              <View style={s.audioTimes}>
                <Text style={[s.audioTime, { color: c.subtle }]}>{fmt(position)}</Text>
                <Text style={[s.audioTime, { color: c.subtle }]}>{fmt(duration)}</Text>
              </View>
            </View>
            {hasSub && (
              <TouchableOpacity onPress={() => setShowSub(!showSub)} style={s.subToggle}>
                <Ionicons name={showSub ? "text" : "text-outline"} size={18} color={showSub ? COLOR : c.subtle} />
              </TouchableOpacity>
            )}
          </View>
          {audioError && <Text style={[s.audioError, { color: c.destructive }]}>{audioError}</Text>}
        </View>

        {/* Result — mirrors FE v3 ListeningInProgress celebration card */}
        {session.result && (
          <McqResultCard result={session.result} accentColor={COLOR} onBack={onBack} />
        )}

        {/* Support panel */}
        {!session.result && (
          <SupportPanel
            skill="listening"
            sessionId={sessionId}
            hasTranscript={hasSub}
            hasKeywords={(exercise.keywords ?? []).length > 0}
            accentColor={COLOR}
            unlockedLevels={unlockedSupport}
            onUnlock={(level) => {
              setUnlockedSupport((prev) => (prev.includes(level) ? prev : [...prev, level]));
              if (level === 2) {
                setShowSub(true);
              }
            }}
          />
        )}

        {/* Questions — McqQuestionCard mirrors FE v3 QuestionList */}
        {questions.map((q: McqQuestion, qi: number) => (
          <McqQuestionCard
            key={q.id}
            question={q}
            index={qi}
            selected={session.answers[q.id] ?? null}
            onSelect={(idx: number) => session.select(q.id, idx)}
            result={session.result}
            accentColor={COLOR}
          />
        ))}
      </ScrollView>

      {/* Submit footer */}
      {!session.result && (
        <View style={[s.footer, { borderTopColor: c.borderLight }]}>
          <SubmitFooter
            answeredCount={session.answeredCount}
            total={questions.length}
            submitting={session.submitting}
            accentColor={COLOR}
            onSubmit={() => session.submit()}
            c={c}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  closeBtn: { padding: spacing.xs },
  topBarTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, flex: 1 },
  partChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  partChipText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  previewDesc: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.xs },
  previewMeta: { fontSize: fontSize.xs, marginTop: spacing.xs, marginBottom: spacing.xl },
  subCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.xs },
  subText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium, lineHeight: 22 },
  panelScroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  audioCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  audioPartLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  audioTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  audioDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  audioControls: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  audioTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  audioFill: { height: "100%", borderRadius: 3 },
  audioTimes: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  audioTime: { fontSize: 10 },
  audioError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  subToggle: { padding: spacing.xs },
  footer: { backgroundColor: "#FFFFFF" },
});
