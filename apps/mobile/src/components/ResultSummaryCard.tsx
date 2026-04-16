import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface Props {
  correct: number;
  total: number;
}

const SIZE = 80;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function ratingLabel(pct: number): { text: string; color: "success" | "warning" | "destructive" } {
  if (pct >= 80) return { text: "Xuất sắc", color: "success" };
  if (pct >= 60) return { text: "Khá", color: "success" };
  if (pct >= 40) return { text: "Trung bình", color: "warning" };
  return { text: "Cần cải thiện", color: "destructive" };
}

export function ResultSummaryCard({ correct, total }: Props) {
  const c = useThemeColors();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const rating = ratingLabel(pct);

  return (
    <View style={[styles.card, { backgroundColor: c.muted }]}>
      <View style={styles.circleWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={c.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={c[rating.color]}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <Text style={[styles.pctText, { color: c.foreground }]}>{pct}%</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.score, { color: c.foreground }]}>
          {correct}/{total} câu đúng
        </Text>
        <Text style={[styles.rating, { color: c[rating.color] }]}>{rating.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius["2xl"],
    padding: spacing.lg,
  },
  circleWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pctText: {
    position: "absolute",
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  score: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
  },
  rating: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
});
