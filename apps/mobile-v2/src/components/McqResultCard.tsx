// McqResultCard — inline result celebration for listening/reading practice.
// Mirrors apps/frontend-v3/src/features/practice/components/ListeningInProgress.tsx
// celebration card (mascot + score + back button).
import { StyleSheet, Text, View } from "react-native";

import { DepthButton } from "@/components/DepthButton";
import { ExerciseFeedbackCard } from "@/components/ExerciseFeedbackCard";
import { Mascot } from "@/components/Mascot";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { ExerciseFeedbackContentType, SubmitResult } from "@/hooks/use-practice";

interface Props {
  result: SubmitResult;
  accentColor: string;
  onBack: () => void;
  feedback?: {
    contentType: ExerciseFeedbackContentType;
    contentId: string;
  };
}

export function McqResultCard({ result, accentColor, onBack, feedback }: Props) {
  const c = useThemeColors();
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const mascot = pct >= 60 ? "happy" : "think";

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderBottomColor: "#CACACA",
        },
      ]}
    >
      <Mascot name={mascot} size={88} animation="pop" />
      <Text style={[s.score, { color: c.foreground }]}>
        {result.score}/{result.total}
      </Text>
      <Text style={[s.label, { color: c.mutedForeground }]}>câu đúng · {pct}%</Text>
      <DepthButton
        onPress={onBack}
        style={{
          marginTop: spacing.md,
          minWidth: 200,
          backgroundColor: accentColor,
          borderColor: accentColor,
        }}
      >
        Về danh sách
      </DepthButton>
      {feedback ? (
        <View style={s.feedbackWrap}>
          <ExerciseFeedbackCard contentType={feedback.contentType} contentId={feedback.contentId} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  score: {
    fontSize: fontSize["3xl"],
    fontFamily: fontFamily.extraBold,
    marginTop: spacing.sm,
  },
  label: { fontSize: fontSize.sm },
  feedbackWrap: { width: "100%", marginTop: spacing.md },
});
