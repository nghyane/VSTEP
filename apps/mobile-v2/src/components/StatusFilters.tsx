// StatusFilters — Tất cả / Chưa làm / Đang làm / Hoàn thành pill picker.
// Mirrors the status segment in
// apps/frontend-v3/src/features/practice/components/SpeakingFilters.tsx.
// Default value is "Tất cả".
import { StyleSheet, Text, View } from "react-native";

import { HapticTouchable } from "@/components/HapticTouchable";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";

export const STATUS_OPTIONS = ["Tất cả", "Chưa làm", "Đang làm", "Hoàn thành"] as const;
export type StatusFilter = (typeof STATUS_OPTIONS)[number];

interface Props {
  status: StatusFilter;
  onStatusChange: (next: StatusFilter) => void;
}

export function StatusFilters({ status, onStatusChange }: Props) {
  const c = useThemeColors();
  return (
    <View style={s.row}>
      {STATUS_OPTIONS.map((opt) => {
        const active = status === opt;
        return (
          <HapticTouchable
            key={opt}
            onPress={() => onStatusChange(opt)}
            style={[
              s.pill,
              {
                backgroundColor: active ? c.primary : c.surface,
                borderColor: active ? c.primary : c.border,
              },
            ]}
          >
            <Text
              style={[
                s.pillText,
                { color: active ? c.primaryForeground : c.mutedForeground },
              ]}
            >
              {opt}
            </Text>
          </HapticTouchable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.button,
    borderWidth: 2,
  },
  pillText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
