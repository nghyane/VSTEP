// LevelFilters — horizontal A1..C1 pill toggle.
// Mirrors apps/frontend-v3/src/features/practice/components/LevelFilters.tsx
// Single-select with toggle off (tap active level again clears the filter).
// Color tokens per level match FE v3 (success / info / warning / skill-speaking / destructive).
import { StyleSheet, Text, View } from "react-native";

import { HapticTouchable } from "@/components/HapticTouchable";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

interface Props {
  level: Level | null;
  onLevelChange: (next: Level | null) => void;
}

export function LevelFilters({ level, onLevelChange }: Props) {
  const c = useThemeColors();

  // Active tint per level — mirrors FE v3 LEVEL_COLORS.
  function activeTint(lv: Level): { bg: string; fg: string } {
    switch (lv) {
      case "A1": return { bg: c.success + "26", fg: c.success };
      case "A2": return { bg: c.info + "26", fg: c.info };
      case "B1": return { bg: c.warning + "26", fg: c.warning };
      case "B2": return { bg: c.skillSpeaking + "26", fg: c.coinDark };
      case "C1": return { bg: c.destructive + "26", fg: c.destructive };
    }
  }

  return (
    <View style={s.row}>
      {LEVELS.map((lv) => {
        const active = level === lv;
        const tint = activeTint(lv);
        return (
          <HapticTouchable
            key={lv}
            onPress={() => onLevelChange(active ? null : lv)}
            style={[
              s.pill,
              {
                backgroundColor: active ? tint.bg : c.surface,
                borderColor: active ? tint.fg : c.border,
              },
            ]}
          >
            <Text
              style={[
                s.pillText,
                { color: active ? tint.fg : c.mutedForeground },
              ]}
            >
              {lv}
            </Text>
          </HapticTouchable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.button,
    borderWidth: 2,
  },
  pillText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
