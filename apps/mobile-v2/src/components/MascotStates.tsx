import { StyleSheet, Text, View } from "react-native";
import { Mascot, type MascotName } from "@/components/Mascot";
import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

// ── Result ──

interface ResultProps {
  score: number;
  total: number;
  onBack: () => void;
  backLabel?: string;
}

export function MascotResult({ score, total, onBack, backLabel = "Quay lai" }: ResultProps) {
  const c = useThemeColors();
  const pct = total > 0 ? score / total : 0;
  const passed = pct >= 0.7;
  const mascot: MascotName = passed ? "happy" : "think";

  return (
    <View style={styles.container}>
      <Mascot name={mascot} size={130} animation={passed ? "pop" : "bounce"} />
      <Text style={[styles.score, { color: c.foreground }]}>
        {score}/{total}
      </Text>
      <Text style={[styles.label, { color: passed ? c.success : c.mutedForeground }]}>
        {passed ? "Xuat sac!" : "Co len nhe!"}
      </Text>
      <DepthButton onPress={onBack} variant={passed ? "primary" : "secondary"} size="lg">
        {backLabel}
      </DepthButton>
    </View>
  );
}

// ── Empty ──

interface EmptyProps {
  title: string;
  subtitle?: string;
  mascot?: MascotName;
}

export function MascotEmpty({ title, subtitle, mascot = "think" }: EmptyProps) {
  const c = useThemeColors();
  return (
    <View style={styles.empty}>
      <Mascot name={mascot} size={100} animation="float" />
      <Text style={[styles.emptyTitle, { color: c.foreground }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.emptySub, { color: c.mutedForeground }]}>{subtitle}</Text>
      )}
    </View>
  );
}

// ── Lesson Complete ──

interface LessonCompleteProps {
  score: number;
  total: number;
  durationSeconds: number;
  onNext?: () => void;
  onReview?: () => void;
  nextLabel?: string;
}

export function LessonComplete({
  score,
  total,
  durationSeconds,
  onNext,
  onReview,
  nextLabel = "Tiep tuc",
}: LessonCompleteProps) {
  const c = useThemeColors();
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <View style={styles.completeContainer}>
      <GameIcon name="trophy" size={52} />
      <Text style={[styles.completeTitle, { color: c.foreground }]}>Hoan thanh!</Text>
      <Text style={[styles.completeSub, { color: c.mutedForeground }]}>{getEncouragement(pct)}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Diem" value={`${score}/${total}`} color={c.primary} />
        <StatCard label="Thoi gian" value={timeStr} color={c.mutedForeground} />
        <StatCard label="Chinh xac" value={`${pct}%`} color={pct >= 70 ? c.success : c.warning} />
      </View>

      <View style={styles.actions}>
        {onReview && (
          <DepthButton variant="secondary" onPress={onReview}>Xem lai bai</DepthButton>
        )}
        {onNext && (
          <DepthButton variant="primary" size="lg" onPress={onNext} fullWidth>
            {nextLabel}
          </DepthButton>
        )}
      </View>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.stat, { borderColor: color + "25", borderBottomColor: color + "66" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function getEncouragement(pct: number): string {
  if (pct >= 90) return "Xuat sac! Tiep tuc phat huy nhe";
  if (pct >= 70) return "Kha on roi, luyen them mot chut nua.";
  if (pct >= 50) return "Can cai thien. Xem lai loi de hoc sau hon.";
  return "Bai nay kho, dung nan. Hay on lai kien thuc nen.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing["2xl"],
  },
  score: { fontSize: 48, fontFamily: fontFamily.extraBold, marginTop: spacing.base },
  label: { fontSize: fontSize.lg, fontFamily: fontFamily.semiBold },
  empty: { alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, textAlign: "center" },
  emptySub: { fontSize: fontSize.sm, textAlign: "center" },
  completeContainer: { alignItems: "center", padding: spacing.xl, gap: spacing.base },
  completeTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  completeSub: { fontSize: fontSize.sm, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
  stat: {
    flex: 1,
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  statValue: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  actions: { gap: spacing.md, width: "100%", marginTop: spacing.lg },
});
