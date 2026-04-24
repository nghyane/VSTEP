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

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { useListeningExerciseDetail, useMcqSession, startListeningSession, submitListeningSession } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { McqQuestion, SubmitResult } from "@/hooks/use-practice";

const COLOR = "#1CB0F6";
const COLOR_DARK = "#0E7ABF";

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
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!exercise.audioUrl) return;
    let s: Audio.Sound;
    (async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: loaded } = await Audio.Sound.createAsync(
        { uri: exercise.audioUrl },
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
    })();
    return () => { s?.unloadAsync(); };
  }, [exercise.audioUrl]);

  async function togglePlay() {
    if (!sound) return;
    if (playing) await sound.pauseAsync();
    else await sound.playAsync();
  }

  function fmt(ms: number) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const pct = duration > 0 ? position / duration : 0;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
          <View style={[s.progressFill, { backgroundColor: COLOR, width: `${(session.answeredCount / questions.length) * 100}%` }]} />
        </View>
        <Text style={[s.progressCount, { color: c.subtle }]}>{session.answeredCount}/{questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Audio card */}
        <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
          <Text style={[s.audioPartLabel, { color: COLOR }]}>Part {exercise.part}</Text>
          <Text style={[s.audioTitle, { color: c.foreground }]}>{exercise.title}</Text>
          {exercise.description && (
            <Text style={[s.audioDesc, { color: c.mutedForeground }]}>{exercise.description}</Text>
          )}
          <View style={s.audioControls}>
            <TouchableOpacity onPress={togglePlay} style={[s.playBtn, { backgroundColor: COLOR }]}>
              <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={[s.audioTrack, { backgroundColor: c.muted }]}>
                <Animated.View style={[s.audioFill, { backgroundColor: COLOR, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
              </View>
              <View style={s.audioTimes}>
                <Text style={[s.audioTime, { color: c.subtle }]}>{fmt(position)}</Text>
                <Text style={[s.audioTime, { color: c.subtle }]}>{fmt(duration)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Result */}
        {session.result && (
          <ResultCard result={session.result} onBack={onBack} c={c} />
        )}

        {/* Questions */}
        {questions.map((q: McqQuestion, qi: number) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={qi}
            selected={session.answers[q.id] ?? null}
            result={session.result}
            onSelect={(i: number) => session.select(q.id, i)}
            color={COLOR}
            c={c}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      {!session.result && (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.base, borderTopColor: c.borderLight }]}>
          <DepthButton
            fullWidth
            disabled={session.submitting || session.answeredCount < questions.length}
            onPress={session.submit}
            style={{ backgroundColor: COLOR, borderColor: COLOR }}
          >
            {session.submitting ? "Đang nộp..." : `Nộp bài (${session.answeredCount}/${questions.length})`}
          </DepthButton>
        </View>
      )}
    </View>
  );
}

function ResultCard({ result, onBack, c }: { result: SubmitResult; onBack: () => void; c: any }) {
  const pct = Math.round((result.score / result.total) * 100);
  return (
    <View style={[s.resultCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
      <Text style={[s.resultScore, { color: c.foreground }]}>{result.score}/{result.total}</Text>
      <Text style={[s.resultSub, { color: c.mutedForeground }]}>câu đúng · {pct}%</Text>
      <DepthButton variant="secondary" onPress={onBack} style={{ marginTop: spacing.md }}>Về danh sách</DepthButton>
    </View>
  );
}

function QuestionCard({ question, index, selected, result, onSelect, color, c }: {
  question: McqQuestion; index: number; selected: number | null;
  result: SubmitResult | null; onSelect: (i: number) => void; color: string; c: any;
}) {
  const answered = !!result;
  const item = result?.items.find((it) => it.questionId === question.id);

  return (
    <View style={[s.questionCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
      <Text style={[s.questionNum, { color: color }]}>Câu {index + 1}</Text>
      <Text style={[s.questionText, { color: c.foreground }]}>{question.question}</Text>
      <View style={s.options}>
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = answered && item?.correctIndex === i;
          const isWrong = answered && isSelected && !item?.isCorrect;
          return (
            <TouchableOpacity
              key={i}
              disabled={answered}
              onPress={() => onSelect(i)}
              style={[
                s.option,
                {
                  borderColor: isCorrect ? color : isWrong ? "#EA4335" : isSelected ? color : c.border,
                  backgroundColor: isCorrect ? color + "18" : isWrong ? "#FFE6E4" : isSelected ? color + "12" : c.background,
                },
              ]}
            >
              <View style={[s.optionDot, { borderColor: isCorrect ? color : isWrong ? "#EA4335" : isSelected ? color : c.border, backgroundColor: (isSelected || isCorrect) ? color : "transparent" }]}>
                {(isSelected || isCorrect) && <View style={s.optionDotInner} />}
              </View>
              <Text style={[s.optionText, { color: isWrong ? "#EA4335" : isCorrect || isSelected ? color : c.foreground }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {answered && item?.explanation && (
        <View style={[s.explanation, { backgroundColor: c.muted }]}>
          <Text style={[s.explanationText, { color: c.mutedForeground }]}>{item.explanation}</Text>
        </View>
      )}
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
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.full },
  progressCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 32, textAlign: "right" },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  // Preview
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  previewDesc: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.sm, lineHeight: 20, paddingHorizontal: spacing.xl },
  previewMeta: { fontSize: fontSize.sm, marginTop: spacing.sm },
  // Audio card
  audioCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  audioPartLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  audioTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  audioDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  audioControls: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  audioTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  audioFill: { height: "100%", borderRadius: 3 },
  audioTimes: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  audioTime: { fontSize: 10 },
  // Result
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center" },
  resultScore: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold },
  resultSub: { fontSize: fontSize.sm, marginTop: 4 },
  // Question
  questionCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  questionNum: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  questionText: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 24 },
  options: { gap: spacing.sm },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optionDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optionText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  explanation: { borderRadius: radius.md, padding: spacing.md },
  explanationText: { fontSize: fontSize.xs, lineHeight: 18 },
  // Footer
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1 },
});
