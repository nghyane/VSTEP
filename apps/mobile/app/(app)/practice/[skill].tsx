import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { SKILL_LABELS } from "@/components/SkillIcon";
import { useQuestions } from "@/hooks/use-questions";
import { useCreateSubmission } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type {
  Skill,
  Question,
  QuestionContent,
  ListeningContent,
  ReadingContent,
  WritingContent,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
} from "@/types/api";

type ContentKind = "objective" | "writing" | "speaking";

function detectContentKind(content: QuestionContent): ContentKind {
  if ("items" in content) return "objective";
  if ("prompt" in content) return "writing";
  return "speaking";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function PracticeQuestionScreen() {
  const { skill } = useLocalSearchParams<{ skill: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuestions({
    skill: skill as Skill,
    limit: 10,
  });

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  const questions = useMemo(() => data?.data ?? [], [data]);
  const question = useMemo(() => {
    if (questions.length === 0) return null;
    if (pickedId) {
      const found = questions.find((q) => q.id === pickedId);
      if (found) return found;
    }
    return pickRandom(questions);
  }, [questions, pickedId]);

  const pickAnother = useCallback(() => {
    if (questions.length <= 1) return;
    let next: Question;
    do {
      next = pickRandom(questions);
    } while (next.id === question?.id && questions.length > 1);
    setPickedId(next.id);
    setAnswers({});
    setText("");
    setAudioUri(null);
    setAudioDuration(0);
  }, [questions, question]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const submitMutation = useCreateSubmission();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={() => refetch()} />;
  if (!question)
    return (
      <ErrorScreen
        message={`Không có câu hỏi cho kỹ năng ${SKILL_LABELS[skill as Skill] ?? skill}`}
      />
    );

  const kind = detectContentKind(question.content);

  const canSubmit =
    kind === "objective"
      ? Object.keys(answers).length > 0
      : kind === "speaking"
        ? audioUri !== null
        : text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || submitMutation.isPending) return;

    let answer;
    if (kind === "objective") {
      answer = { answers };
    } else if (kind === "speaking") {
      answer = { audioUrl: audioUri!, durationSeconds: Math.round(audioDuration / 1000) };
    } else {
      answer = { text: text.trim() };
    }

    submitMutation.mutate(
      { questionId: question.id, answer },
      {
        onSuccess: (sub) => {
          router.replace(`/(app)/practice/result/${sub.id}`);
        },
      },
    );
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <ScreenWrapper>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <HapticTouchable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={c.foreground} />
          </HapticTouchable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>
            {SKILL_LABELS[skill as Skill] ?? skill}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Question content */}
        {kind === "objective" && (
          <ObjectiveView
            content={question.content as ListeningContent | ReadingContent}
            skill={skill as Skill}
            answers={answers}
            onSelect={(idx, val) => setAnswers((prev) => ({ ...prev, [idx]: val }))}
          />
        )}

        {kind === "writing" && (
          <WritingView
            content={question.content as WritingContent}
            text={text}
            onChangeText={setText}
            wordCount={wordCount}
          />
        )}

        {kind === "speaking" && (
          <SpeakingView
            content={question.content as SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content}
            audioUri={audioUri}
            audioDurationMs={audioDuration}
            onRecorded={(uri, duration) => { setAudioUri(uri); setAudioDuration(duration); }}
            onClear={() => { setAudioUri(null); setAudioDuration(0); }}
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <HapticTouchable
            style={[styles.secondaryBtn, { borderColor: c.border }]}
            onPress={pickAnother}
          >
            <Ionicons name="shuffle-outline" size={18} color={c.foreground} />
            <Text style={[styles.btnText, { color: c.foreground }]}>Câu hỏi khác</Text>
          </HapticTouchable>

          <HapticTouchable
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? c.primary : c.muted },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color={c.primaryForeground} />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={18}
                  color={canSubmit ? c.primaryForeground : c.mutedForeground}
                />
                <Text
                  style={[
                    styles.btnText,
                    { color: canSubmit ? c.primaryForeground : c.mutedForeground },
                  ]}
                >
                  Nộp bài
                </Text>
              </>
            )}
          </HapticTouchable>
        </View>

        {submitMutation.isError && (
          <Text style={[styles.errorText, { color: c.destructive }]}>
            {submitMutation.error?.message ?? "Lỗi khi nộp bài"}
          </Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

/* ---------- Objective (Listening / Reading) ---------- */

function ObjectiveView({
  content,
  skill,
  answers,
  onSelect,
}: {
  content: ListeningContent | ReadingContent;
  skill: Skill;
  answers: Record<string, string>;
  onSelect: (idx: string, val: string) => void;
}) {
  const c = useThemeColors();
  const OPTION_LETTERS = ["A", "B", "C", "D"];

  return (
    <View style={styles.section}>
      {"passage" in content && (
        <View style={[styles.passageBox, { backgroundColor: c.muted }]}>
          {"title" in content && content.title && (
            <Text style={[styles.passageTitle, { color: c.foreground }]}>{content.title}</Text>
          )}
          <Text style={[styles.passageText, { color: c.foreground }]}>{content.passage}</Text>
        </View>
      )}

      {skill === "listening" && (
        <View style={[styles.audioLabel, { backgroundColor: c.muted }]}>
          <Ionicons name="headset" size={20} color={c.primary} />
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "600" }}>
            Bài nghe
          </Text>
        </View>
      )}

      {content.items.map((item, i) => {
        const idx = String(i);
        return (
          <View key={idx} style={styles.itemBlock}>
            <Text style={[styles.stem, { color: c.foreground }]}>
              {i + 1}. {item.stem}
            </Text>
            {item.options.map((opt, oi) => {
              const letter = OPTION_LETTERS[oi] ?? String(oi);
              const selected = answers[idx] === letter;
              return (
                <HapticTouchable
                  key={oi}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: selected ? c.primary + "15" : c.card,
                      borderColor: selected ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => onSelect(idx, letter)}
                >
                  <View
                    style={[
                      styles.optionCircle,
                      {
                        backgroundColor: selected ? c.primary : "transparent",
                        borderColor: selected ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? c.primaryForeground : c.mutedForeground,
                        fontSize: fontSize.xs,
                        fontWeight: "700",
                      }}
                    >
                      {letter}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: c.foreground }]}>{opt}</Text>
                </HapticTouchable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/* ---------- Writing ---------- */

function WritingView({
  content,
  text,
  onChangeText,
  wordCount,
}: {
  content: WritingContent;
  text: string;
  onChangeText: (t: string) => void;
  wordCount: number;
}) {
  const c = useThemeColors();

  return (
    <View style={styles.section}>
      <View style={[styles.promptBox, { backgroundColor: c.muted }]}>
        <Text style={[styles.promptText, { color: c.foreground }]}>{content.prompt}</Text>
        {content.instructions && (
          <Text style={[styles.instructionText, { color: c.mutedForeground }]}>
            {content.instructions}
          </Text>
        )}
        {content.minWords && (
          <Text style={[styles.metaLine, { color: c.mutedForeground }]}>
            Tối thiểu: {content.minWords} từ
          </Text>
        )}
      </View>

      <TextInput
        style={[
          styles.textArea,
          { backgroundColor: c.card, borderColor: c.border, color: c.foreground },
        ]}
        placeholder="Nhập bài viết của bạn..."
        placeholderTextColor={c.mutedForeground}
        multiline
        textAlignVertical="top"
        value={text}
        onChangeText={onChangeText}
      />

      <Text style={[styles.wordCount, { color: c.mutedForeground }]}>
        {wordCount} từ{content.minWords ? ` / ${content.minWords} tối thiểu` : ""}
      </Text>
    </View>
  );
}

/* ---------- Speaking ---------- */

function SpeakingView({
  content,
  audioUri,
  audioDurationMs,
  onRecorded,
  onClear,
}: {
  content: SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content;
  audioUri: string | null;
  audioDurationMs: number;
  onRecorded: (uri: string, durationMs: number) => void;
  onClear: () => void;
}) {
  const c = useThemeColors();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function startRecording() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(rec);
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function stopRecording() {
    if (!recording) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const status = await recording.getStatusAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) onRecorded(uri, status.durationMillis ?? elapsed * 1000);
  }

  async function playAudio() {
    if (!audioUri) return;
    if (soundRef.current) await soundRef.current.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    soundRef.current = sound;
    setPlaying(true);
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) setPlaying(false);
    });
    await sound.playAsync();
  }

  function handleClear() {
    soundRef.current?.unloadAsync();
    setPlaying(false);
    onClear();
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <View style={styles.section}>
      <View style={[styles.promptBox, { backgroundColor: c.muted }]}>
        {"topics" in content &&
          (content as SpeakingPart1Content).topics.map((topic, i) => (
            <View key={i} style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.promptText, { color: c.foreground }]}>{topic.name}</Text>
              {topic.questions.map((q, qi) => (
                <Text key={qi} style={[styles.metaLine, { color: c.mutedForeground }]}>
                  • {q}
                </Text>
              ))}
            </View>
          ))}

        {"situation" in content && (
          <>
            <Text style={[styles.promptText, { color: c.foreground }]}>
              {(content as SpeakingPart2Content).situation}
            </Text>
            <Text style={[styles.metaLine, { color: c.mutedForeground }]}>
              Chuẩn bị: {(content as SpeakingPart2Content).preparationSeconds}s · Nói:{" "}
              {(content as SpeakingPart2Content).speakingSeconds}s
            </Text>
          </>
        )}

        {"centralIdea" in content && (
          <>
            <Text style={[styles.promptText, { color: c.foreground }]}>
              {(content as SpeakingPart3Content).centralIdea}
            </Text>
            {(content as SpeakingPart3Content).suggestions.map((s, i) => (
              <Text key={i} style={[styles.metaLine, { color: c.mutedForeground }]}>
                • {s}
              </Text>
            ))}
            <Text style={[styles.metaLine, { color: c.mutedForeground }]}>
              Chuẩn bị: {(content as SpeakingPart3Content).preparationSeconds}s · Nói:{" "}
              {(content as SpeakingPart3Content).speakingSeconds}s
            </Text>
          </>
        )}
      </View>

      {/* Recorder */}
      <View style={[styles.recorderBox, { backgroundColor: c.card, borderColor: c.border }]}>
        {!audioUri ? (
          <>
            <HapticTouchable
              style={[styles.micBtn, { backgroundColor: isRecording ? c.destructive : c.primary }]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={28} color={c.primaryForeground} />
            </HapticTouchable>
            <Text style={[styles.recorderLabel, { color: isRecording ? c.destructive : c.mutedForeground }]}>
              {isRecording ? formatTime(elapsed) : "Nhấn để thu âm"}
            </Text>
            {isRecording && (
              <View style={[styles.recordingDot, { backgroundColor: c.destructive }]} />
            )}
          </>
        ) : (
          <>
            <View style={styles.playbackRow}>
              <HapticTouchable
                style={[styles.playBtn, { backgroundColor: c.primary + "15" }]}
                onPress={playAudio}
                disabled={playing}
              >
                <Ionicons name={playing ? "volume-high" : "play"} size={22} color={c.primary} />
              </HapticTouchable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recorderLabel, { color: c.foreground }]}>Đã ghi âm</Text>
                <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>
                  {formatTime(Math.round(audioDurationMs / 1000))}
                </Text>
              </View>
              <HapticTouchable onPress={handleClear}>
                <Ionicons name="trash-outline" size={20} color={c.destructive} />
              </HapticTouchable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  section: { gap: spacing.md },
  passageBox: { borderRadius: radius.lg, padding: spacing.base },
  passageTitle: { fontSize: fontSize.base, fontWeight: "700", marginBottom: spacing.sm },
  passageText: { fontSize: fontSize.sm, lineHeight: 22 },
  audioLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  itemBlock: { gap: spacing.sm },
  stem: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 22 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: { fontSize: fontSize.sm, flex: 1 },
  promptBox: { borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm },
  promptText: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 22 },
  instructionText: { fontSize: fontSize.sm, lineHeight: 22 },
  metaLine: { fontSize: fontSize.xs, marginTop: spacing.xs },
  textArea: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  wordCount: { fontSize: fontSize.xs, textAlign: "right" },
  actions: { flexDirection: "row", gap: spacing.md },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  btnText: { fontSize: fontSize.sm, fontWeight: "600" },
  errorText: { fontSize: fontSize.sm, textAlign: "center" },
  recorderBox: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  recorderLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "100%" as any,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
