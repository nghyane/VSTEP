import { StyleSheet, Text, View } from "react-native";

import { HapticTouchable } from "./HapticTouchable";
import { spacing, fontSize, fontFamily, radius } from "@/theme";
import type { ThemeColors } from "@/theme";

interface SubmitFooterProps {
  answeredCount: number;
  total: number;
  submitting: boolean;
  submitError?: string | null;
  accentColor: string;
  onSubmit: () => void;
  c: ThemeColors;
}

export function SubmitFooter({
  answeredCount,
  total,
  submitting,
  submitError,
  accentColor,
  onSubmit,
  c,
}: SubmitFooterProps) {
  const canSubmit = answeredCount >= total;
  const missingCount = Math.max(0, total - answeredCount);

  return (
    <View style={[s.root, { borderTopColor: c.borderLight }]}>
      <View style={s.row}>
        <View style={s.nav}>
          {Array.from({ length: total }).map((_, i) => {
            const answered = i < answeredCount;
            return (
              <View
                key={i}
                style={[
                  s.dot,
                  {
                    backgroundColor: answered ? accentColor : c.muted,
                    borderColor: answered ? accentColor : c.border,
                  },
                ]}
              />
            );
          })}
        </View>

        <HapticTouchable
          onPress={onSubmit}
          disabled={submitting || !canSubmit}
          style={[
            s.submitBtn,
            {
              backgroundColor: canSubmit ? accentColor : c.muted,
              borderColor: canSubmit ? accentColor : c.border,
            },
          ]}
        >
          {submitting ? (
            <Text style={[s.submitText, { color: "#fff" }]}>Đang nộp...</Text>
          ) : (
            <Text style={[s.submitText, { color: canSubmit ? "#fff" : c.mutedForeground }]}>Nộp bài</Text>
          )}
        </HapticTouchable>
      </View>

      {submitError ? (
        <Text style={[s.hint, { color: c.destructive }]}>Không thể nộp bài: {submitError}</Text>
      ) : !canSubmit ? (
        <Text style={[s.hint, { color: c.mutedForeground }]}>Trả lời thêm {missingCount} câu để nộp bài.</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nav: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  submitBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  submitText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  hint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    textAlign: "right",
  },
});
