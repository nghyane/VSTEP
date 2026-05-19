// McqQuestionCard — single MCQ question with options + post-submit review.
// Mirrors apps/frontend-v3/src/features/practice/components/QuestionList.tsx
// (ExplanationBlock) — shows "Chính xác" / "Chưa đúng" header + correct answer
// callout when wrong + explanation paragraph.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { HapticTouchable } from "@/components/HapticTouchable";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { McqQuestion, SubmitResult } from "@/hooks/use-practice";

const LETTERS = ["A", "B", "C", "D"];

interface Props {
  question: McqQuestion;
  index: number;
  selected: number | null;
  onSelect: (index: number) => void;
  result: SubmitResult | null;
  accentColor: string;
}

export function McqQuestionCard({
  question,
  index,
  selected,
  onSelect,
  result,
  accentColor,
}: Props) {
  const c = useThemeColors();
  const itemResult = result?.items.find((i) => i.questionId === question.id) ?? null;
  const hasResult = result !== null;
  const isCorrect = itemResult?.isCorrect ?? false;

  return (
    <View
      style={[
        s.card,
        { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" },
      ]}
    >
      <Text style={[s.questionLabel, { color: accentColor }]}>Câu {index + 1}</Text>
      <Text style={[s.questionText, { color: c.foreground }]}>{question.question}</Text>

      {question.options.map((opt, oi) => {
        const isSelected = selected === oi;
        let borderColor = c.border;
        let bgColor = c.surface;
        let textColor = c.foreground;
        let badgeBg = c.muted;
        let badgeFg = c.mutedForeground;

        if (hasResult && itemResult) {
          if (oi === itemResult.correctIndex) {
            borderColor = c.success;
            bgColor = c.primaryTint;
            textColor = c.primaryDark;
            badgeBg = c.success;
            badgeFg = c.primaryForeground;
          } else if (isSelected && !isCorrect) {
            borderColor = c.destructive;
            bgColor = c.destructiveTint;
            textColor = c.destructive;
            badgeBg = c.destructive;
            badgeFg = c.primaryForeground;
          }
        } else if (isSelected) {
          borderColor = accentColor;
          bgColor = accentColor + "18";
          textColor = accentColor;
          badgeBg = accentColor;
          badgeFg = c.primaryForeground;
        }

        return (
          <HapticTouchable
            key={`${question.id}-${oi}`}
            onPress={() => !hasResult && onSelect(oi)}
            disabled={hasResult}
            style={[s.option, { borderColor, backgroundColor: bgColor }]}
          >
            <View style={[s.badge, { backgroundColor: badgeBg }]}>
              <Text style={[s.badgeText, { color: badgeFg }]}>{LETTERS[oi] ?? ""}</Text>
            </View>
            <Text style={[s.optionText, { color: textColor }]}>{opt}</Text>
            {hasResult && itemResult && oi === itemResult.correctIndex ? (
              <Ionicons name="checkmark-circle" size={18} color={c.success} />
            ) : null}
          </HapticTouchable>
        );
      })}

      {hasResult && itemResult ? (
        <ExplanationBlock
          itemResult={itemResult}
          question={question}
          accentColor={accentColor}
        />
      ) : null}
    </View>
  );
}

interface ExplanationProps {
  itemResult: SubmitResult["items"][number];
  question: McqQuestion;
  accentColor: string;
}

function ExplanationBlock({ itemResult, question, accentColor }: ExplanationProps) {
  const c = useThemeColors();
  const correct = itemResult.isCorrect;
  const correctOption = question.options[itemResult.correctIndex];

  const borderColor = correct ? accentColor + "4D" : c.destructive + "4D";
  const bgColor = correct ? accentColor + "0D" : c.destructiveTint;
  const headerColor = correct ? accentColor : c.destructive;

  return (
    <View style={[s.explanationBlock, { borderColor, backgroundColor: bgColor }]}>
      <View style={s.explanationHeader}>
        <Ionicons
          name={correct ? "checkmark-circle" : "close-circle"}
          size={16}
          color={headerColor}
        />
        <Text style={[s.explanationHeaderText, { color: headerColor }]}>
          {correct ? "Chính xác!" : "Chưa đúng"}
        </Text>
      </View>

      {!correct && correctOption ? (
        <Text style={[s.correctAnswer, { color: c.foreground }]}>
          <Text style={{ color: c.mutedForeground }}>Đáp án đúng: </Text>
          <Text style={{ fontFamily: fontFamily.bold }}>
            {LETTERS[itemResult.correctIndex]}. {correctOption}
          </Text>
        </Text>
      ) : null}

      {itemResult.explanation ? (
        <Text style={[s.explanationText, { color: c.subtle }]}>{itemResult.explanation}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  questionLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  questionText: { fontSize: fontSize.base, fontFamily: fontFamily.bold, lineHeight: 22 },
  option: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  optionText: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  explanationBlock: {
    marginTop: spacing.xs,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  explanationHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  explanationHeaderText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  correctAnswer: { fontSize: fontSize.sm, lineHeight: 20 },
  explanationText: { fontSize: fontSize.sm, lineHeight: 20 },
});
