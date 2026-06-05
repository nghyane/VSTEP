import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { getApiErrorMessage } from "@/lib/api";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import { submitExerciseFeedback, type ExerciseFeedbackContentType } from "@/hooks/use-practice";

interface Props {
  contentType: ExerciseFeedbackContentType;
  contentId: string;
}

export function ExerciseFeedbackCard({ contentType, contentId }: Props) {
  const c = useThemeColors();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const mutation = useMutation({
    mutationFn: () => submitExerciseFeedback({
      contentType,
      contentId,
      rating,
      comment: comment.trim() || undefined,
    }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <View style={[styles.card, styles.center, { backgroundColor: c.primaryTint, borderColor: c.primary }]}>
        <Text style={[styles.title, { color: c.primaryDark }]}>Cảm ơn bạn đã góp ý!</Text>
        <Text style={[styles.subtitle, { color: c.subtle }]}>Phản hồi giúp đội ngũ cải thiện bài luyện tập.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.foreground }]}>Bài này hữu ích không?</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <HapticTouchable
            key={value}
            onPress={() => setRating(value)}
            disabled={mutation.isPending}
            style={[
              styles.star,
              {
                backgroundColor: value <= rating ? c.coin : c.surface,
                borderColor: value <= rating ? c.coinDark : c.border,
              },
            ]}
          >
            <Text style={[styles.starText, { color: value <= rating ? "#FFFFFF" : c.subtle }]}>★</Text>
          </HapticTouchable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        editable={!mutation.isPending}
        placeholder="Góp ý thêm nếu bạn muốn..."
        placeholderTextColor={c.placeholder}
        maxLength={1000}
        multiline
        style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.foreground }]}
      />
      {mutation.isError ? (
        <Text style={[styles.error, { color: c.destructive }]}>{getApiErrorMessage(mutation.error)}</Text>
      ) : null}
      <DepthButton fullWidth onPress={() => mutation.mutate()} disabled={rating === 0 || mutation.isPending}>
        {mutation.isPending ? "Đang gửi..." : "Gửi phản hồi"}
      </DepthButton>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  center: { alignItems: "center" },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center" },
  starRow: { flexDirection: "row", gap: spacing.xs },
  star: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  starText: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, lineHeight: 22 },
  input: { minHeight: 86, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, textAlignVertical: "top", fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  error: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
