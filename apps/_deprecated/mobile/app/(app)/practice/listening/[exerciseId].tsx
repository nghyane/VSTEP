import { useEffect, useRef, useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MascotResult } from "@/components/MascotStates";
import { useListeningExerciseDetail } from "@/features/practice/queries";
import { startMcqSession } from "@/features/practice/actions";
import { useMcqSession } from "@/features/practice/use-mcq-session";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import type { McqQuestion } from "@/features/practice/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ListeningExerciseScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useListeningExerciseDetail(exerciseId);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Cleanup audio
  useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

  const session = useMcqSession("listening", sessionId, data?.questions ?? []);

  async function handleStart() {
    if (!data || starting) return;
    setStarting(true);
    try {
      const s = await startMcqSession("listening", exerciseId);
      setSessionId(s.id);
      await loadAudio(data.exercise.audioUrl);
    } catch { /* handled */ } finally {
      setStarting(false);
    }
  }

  async function loadAudio(url: string) {
    try {
      const { sound: s } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
      s.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setPosition(status.positionMillis);
        setDuration(status.durationMillis ?? 0);
        if (status.didJustFinish) setPlaying(false);
      });
      setSound(s);
    } catch { /* ignore */ }
  }

  async function togglePlay() {
    if (!sound) return;
    if (playing) { await sound.pauseAsync(); setPlaying(false); }
    else { await sound.playAsync(); setPlaying(true); }
  }

  async function skip(delta: number) {
    if (!sound) return;
    const next = Math.max(0, Math.min(position + delta * 1000, duration));
    await sound.setPositionAsync(next);
  }

  if (isLoading) return <LoadingScreen />;
  if (!data) return null;

  const { exercise, questions } = data;
  const progress = duration > 0 ? position / duration : 0;

  // Result screen
  if (session.result) {
    return (
      <View style={[s.root, { backgroundColor: c.background, paddingBottom: insets.bottom }]}>
        <View style={s.focusBar}>
          <DepthButton onPress={handleStart} disabled={starting} size="lg" fullWidth>
              {starting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
            </DepthButton>
        </View>
      </View>
    );
  }

  // In-progress
  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[s.inHeader, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[s.inTitle, { color: c.foreground }]}>{exercise.title}</Text>
          <Text style={[s.inMeta, { color: c.subtle }]}>Part {exercise.part} · {questions.length} câu</Text>
        </View>
        <Text style={[s.inProgress, { color: c.subtle }]}>{session.answeredCount}/{questions.length}</Text>
      </View>

      {/* Questions scrollable */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            selected={session.answers[q.id] ?? null}
            result={session.result}
            onSelect={(idx) => session.select(q.id, idx)}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sticky bottom: AudioBar + Submit */}
      <View style={[s.bottom, { borderTopColor: c.border, paddingBottom: insets.bottom || spacing.base }]}>
        {/* AudioBar */}
        <View style={[s.audioBar, { backgroundColor: c.muted }]}>
          <HapticTouchable onPress={() => skip(-5)} style={s.audioBtn}>
            <Ionicons name="play-back" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <HapticTouchable onPress={togglePlay} style={[s.playBtn, { backgroundColor: c.primary }]}>
            <Ionicons name={playing ? "pause" : "play"} size={18} color="#FFF" />
          </HapticTouchable>
          <HapticTouchable onPress={() => skip(5)} style={s.audioBtn}>
            <Ionicons name="play-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <View style={[s.progressTrack, { backgroundColor: c.border }]}>
            <View style={[s.progressFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[s.timeText, { color: c.subtle }]}>
            {fmt(position)}/{fmt(duration)}
          </Text>
        </View>

        {/* Question nav dots */}
        <View style={s.navDots}>
          {questions.map((q, i) => {
            const answered = session.answers[q.id] != null;
            return (
              <View
                key={q.id}
                style={[s.dot, { backgroundColor: answered ? c.primary : c.border }]}
              />
            );
          })}
        </View>

        {/* Submit */}
        <HapticTouchable
          style={[
            s.submitBtn,
            {
              backgroundColor: session.answeredCount < questions.length ? c.muted : c.primary,
              opacity: session.submitting ? 0.7 : 1,
            },
          ]}
          onPress={session.submit}
          disabled={session.submitting || session.answeredCount < questions.length}
        >
          {session.submitting
            ? <ActivityIndicator color="#FFF" size="small" />
            : <Text style={[s.submitText, { color: session.answeredCount < questions.length ? c.mutedForeground : "#FFF" }]}>
                Nộp bài ({session.answeredCount}/{questions.length})
              </Text>}
        </HapticTouchable>
      </View>
    </View>
  );
}

function QuestionCard({
  question, index, selected, result, onSelect,
}: {
  question: McqQuestion;
  index: number;
  selected: number | null;
  result: ReturnType<typeof useMcqSession>["result"];
  onSelect: (i: number) => void;
}) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={[s.qNum, { color: c.subtle }]}>Câu {index + 1}</Text>
      <Text style={[s.qText, { color: c.foreground }]}>{question.question}</Text>
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = result && question.correctIndex === i;
          const isWrong = result && isSelected && question.correctIndex !== i;
          const bg = isCorrect ? c.primaryTint : isWrong ? c.destructiveTint : isSelected ? c.primaryTint : c.card;
          const border = isCorrect ? c.primary : isWrong ? c.destructive : isSelected ? c.primary : c.border;
          return (
            <HapticTouchable
              key={i}
              style={[s.option, { backgroundColor: bg, borderColor: border }]}
              onPress={() => !result && onSelect(i)}
              disabled={!!result}
            >
              <Text style={[s.optionLetter, { color: isSelected || isCorrect ? c.primary : c.subtle }]}>
                {["A", "B", "C", "D"][i]}.
              </Text>
              <Text style={[s.optionText, { color: c.foreground }]}>{opt}</Text>
              {isCorrect && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
              {isWrong && <Ionicons name="close-circle" size={18} color={c.destructive} />}
            </HapticTouchable>
          );
        })}
      </View>
      {result && question.explanation && (
        <Text style={[s.explanation, { color: c.subtle }]}>💡 {question.explanation}</Text>
      )}
    </View>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}


const s = StyleSheet.create({
  root: { flex: 1 },
  focusBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  focusTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  preview: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing["2xl"], gap: spacing.sm },
  partBadge: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  partBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  previewDesc: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  previewMeta: { fontSize: fontSize.sm },
  startBtn: { borderRadius: radius.button, paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, marginTop: spacing.lg },
  startBtnText: { color: "#FFF", fontSize: fontSize.base, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  inHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1 },
  inTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  inMeta: { fontSize: fontSize.xs, marginTop: 2 },
  inProgress: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  bottom: { borderTopWidth: 1, gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  audioBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.lg, padding: spacing.sm },
  audioBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  timeText: { fontSize: 11, fontFamily: fontFamily.medium, minWidth: 36 },
  navDots: { flexDirection: "row", gap: 5, justifyContent: "center", flexWrap: "wrap", paddingVertical: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  submitBtn: { borderRadius: radius.button, paddingVertical: spacing.md, alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  qNum: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, marginBottom: 4 },
  qText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, lineHeight: 20 },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  optionLetter: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, minWidth: 20 },
  optionText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18 },
  explanation: { fontSize: fontSize.xs, lineHeight: 18, marginTop: spacing.sm, fontStyle: "italic" },
});
