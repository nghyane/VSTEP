// MCQ Option — Duolingo 3D depth pressable (RFC 0002)
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

type State = "idle" | "selected" | "correct" | "wrong";

interface McqOptionProps {
  label: string;
  index: number;
  state?: State;
  onPress?: () => void;
  disabled?: boolean;
}

const LETTERS = ["A", "B", "C", "D"];

export function McqOption({ label, index, state = "idle", onPress, disabled }: McqOptionProps) {
  const c = useThemeColors();
  const translateY = useRef(new Animated.Value(0)).current;

  const { bg, borderTop, borderBottom, textColor } = getStateColors(state, c);

  function handlePressIn() {
    if (disabled) return;
    Animated.timing(translateY, { toValue: 3, duration: 50, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }
  function handlePress() {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
      <Animated.View
        style={[
          styles.option,
          { backgroundColor: bg, borderColor: borderTop, borderBottomColor: borderBottom, transform: [{ translateY }] },
        ]}
      >
        <View style={[styles.letter, { backgroundColor: borderTop }]}>
          <Text style={[styles.letterText, { color: textColor }]}>{LETTERS[index]}</Text>
        </View>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function getStateColors(state: State, c: ReturnType<typeof useThemeColors>) {
  switch (state) {
    case "selected":
      return { bg: c.primary + "15", borderTop: c.primary + "40", borderBottom: c.primary + "80", textColor: c.foreground };
    case "correct":
      return { bg: c.success + "1A", borderTop: c.success + "40", borderBottom: c.success + "80", textColor: c.success };
    case "wrong":
      return { bg: c.destructive + "1A", borderTop: c.destructive + "40", borderBottom: c.destructive + "80", textColor: c.destructive };
    default:
      return { bg: c.card, borderTop: c.depthBorderLight, borderBottom: c.depthBorderDark, textColor: c.foreground };
  }
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    lineHeight: 20,
  },
});
