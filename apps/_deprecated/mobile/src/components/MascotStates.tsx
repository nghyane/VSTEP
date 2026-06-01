import { StyleSheet, Text, View } from "react-native";
import { Mascot, ConfettiParticles } from "@/components/Mascot";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

interface ResultProps {
  score: number;
  total: number;
  onBack: () => void;
  backLabel?: string;
}

/**
 * Shown after MCQ submit. Celebrates with confetti + happy mascot if score ≥ 70%.
 */
export function MascotResult({ score, total, onBack, backLabel = "Quay lại" }: ResultProps) {
  const c = useThemeColors();
  const pct = total > 0 ? score / total : 0;
  const passed = pct >= 0.7;
  const mascot = passed ? "happy" : "think";
  const animation = passed ? "pop" : "bounce";

  return (
    <View style={styles.container}>
      {passed && <ConfettiParticles count={16} />}
      <Mascot name={mascot} size={130} animation={animation} />
      <Text style={[styles.score, { color: c.foreground }]}>
        {score}/{total}
      </Text>
      <Text style={[styles.label, { color: passed ? c.success : c.mutedForeground }]}>
        {passed ? "Xuất sắc! 🎉" : "Cố lên nhé!"}
      </Text>
      <Text
        style={[styles.back, { color: c.primary }]}
        onPress={onBack}
      >
        {backLabel}
      </Text>
    </View>
  );
}

interface EmptyProps {
  title: string;
  subtitle?: string;
  mascot?: "think" | "sad" | "listen" | "read" | "write" | "speak" | "vocabulary";
}

/**
 * Empty state with mascot. Static — no animation (content is already loaded).
 */
export function MascotEmpty({ title, subtitle, mascot = "think" }: EmptyProps) {
  const c = useThemeColors();
  return (
    <View style={styles.empty}>
      <Mascot name={mascot} size={100} animation="float" />
      <Text style={[styles.emptyTitle, { color: c.foreground }]}>{title}</Text>
      {subtitle && <Text style={[styles.emptySub, { color: c.mutedForeground }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing["2xl"],
  },
  score: {
    fontSize: 48,
    fontFamily: fontFamily.extraBold,
    marginTop: spacing.base,
  },
  label: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
  },
  back: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing["2xl"],
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    textAlign: "center",
  },
  emptySub: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
