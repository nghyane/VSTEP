// SrsRatingButtons — 4-button row for SRS quality rating.
// Mirrors apps/frontend-v3/src/features/vocab/components/SrsRatingButtons.tsx
// Colors map to FE v3 tokens: destructive (Quên), warning (Khó),
// primary (Nhớ), info (Dễ).
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

export type SrsRating = 1 | 2 | 3 | 4;

interface Props {
  disabled: boolean;
  onRate: (rating: SrsRating) => void;
}

interface RatingMeta {
  label: string;
  rating: SrsRating;
  bg: keyof ReturnType<typeof useThemeColors>;
  fg: keyof ReturnType<typeof useThemeColors>;
}

const RATINGS: RatingMeta[] = [
  { label: "Quên", rating: 1, bg: "destructiveTint", fg: "destructive" },
  { label: "Khó", rating: 2, bg: "warningTint", fg: "warning" },
  { label: "Nhớ", rating: 3, bg: "primaryTint", fg: "primary" },
  { label: "Dễ", rating: 4, bg: "infoTint", fg: "info" },
];

export function SrsRatingButtons({ disabled, onRate }: Props) {
  const c = useThemeColors();

  return (
    <View style={s.row}>
      {RATINGS.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => onRate(item.rating)}
          disabled={disabled}
          style={[
            s.btn,
            {
              backgroundColor: c[item.bg],
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[s.label, { color: c[item.fg] }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.base },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
  },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center" },
});
