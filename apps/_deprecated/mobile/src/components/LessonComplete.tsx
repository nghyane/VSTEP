// Lesson Complete — Duolingo-style 3 stat cards (RFC 0004)
import { StyleSheet, Text, View } from "react-native";
import { GameIcon } from "./GameIcon";
import { DepthButton } from "./DepthButton";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface LessonCompleteProps {
  score: number;
  total: number;
  durationSeconds: number;
  onNext?: () => void;
  onReview?: () => void;
  nextLabel?: string;
}

export function LessonComplete({ score, total, durationSeconds, onNext, onReview, nextLabel = "Tiếp tục" }: LessonCompleteProps) {
  const c = useThemeColors();
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <GameIcon name="trophy" size={48} />
      <Text style={[styles.title, { color: c.foreground }]}>Hoàn thành!</Text>
      <Text style={[styles.subtitle, { color: c.subtle }]}>{getEncouragement(pct)}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Điểm" value={`${score}/${total}`} color={c.primary} />
        <StatCard label="Thời gian" value={timeStr} color={c.subtle} />
        <StatCard label="Chính xác" value={`${pct}%`} color={pct >= 70 ? c.success : c.warning} />
      </View>

      <View style={styles.actions}>
        {onReview && <DepthButton variant="secondary" onPress={onReview}>Xem lại bài</DepthButton>}
        {onNext && <DepthButton variant="primary" size="lg" onPress={onNext}>{nextLabel}</DepthButton>}
      </View>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.stat, { borderColor: color + "25", borderBottomColor: color + "66" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.subtle }]}>{label}</Text>
    </View>
  );
}

function getEncouragement(pct: number): string {
  if (pct >= 90) return "Xuất sắc! Tiếp tục phát huy nhé";
  if (pct >= 70) return "Khá ổn rồi, luyện thêm một chút nữa.";
  if (pct >= 50) return "Cần cải thiện. Xem lại lỗi để học sâu hơn.";
  return "Bài này khó, đừng nản. Hãy ôn lại kiến thức nền.";
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: spacing.xl, gap: spacing.base },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  subtitle: { fontSize: fontSize.sm, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
  stat: {
    flex: 1,
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    backgroundColor: "#FFFFFF",
  },
  statValue: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
  actions: { gap: spacing.md, width: "100%", marginTop: spacing.lg },
});
