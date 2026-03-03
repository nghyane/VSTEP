import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
      : text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || submitMutation.isPending) return;

    const answer =
      kind === "objective"
        ? { answers }
        : { text: text.trim() };

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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={c.foreground} />
          </TouchableOpacity>
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
            text={text}
            onChangeText={setText}
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: c.border }]}
            onPress={pickAnother}
          >
            <Ionicons name="shuffle-outline" size={18} color={c.foreground} />
            <Text style={[styles.btnText, { color: c.foreground }]}>Câu hỏi khác</Text>
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>
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
                <TouchableOpacity
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
                </TouchableOpacity>
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
  text,
  onChangeText,
}: {
  content: SpeakingPart1Content | SpeakingPart2Content | SpeakingPart3Content;
  text: string;
  onChangeText: (t: string) => void;
}) {
  const c = useThemeColors();

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

      <TextInput
        style={[
          styles.textArea,
          { backgroundColor: c.card, borderColor: c.border, color: c.foreground },
        ]}
        placeholder="Nhập bài nói của bạn..."
        placeholderTextColor={c.mutedForeground}
        multiline
        textAlignVertical="top"
        value={text}
        onChangeText={onChangeText}
      />
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
});
