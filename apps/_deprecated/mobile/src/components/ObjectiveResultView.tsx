import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { ObjectiveItemResult } from "@/types/api";

interface Props {
  items: ObjectiveItemResult[];
  userAnswers?: Record<string, string | null>;
  correctAnswers?: Record<string, string | null>;
}

export function ObjectiveResultView({ items, userAnswers, correctAnswers }: Props) {
  const c = useThemeColors();
  const correctCount = items.filter((i) => i.isCorrect).length;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: correctCount === items.length ? "#10b98115" : "#f59e0b15" }]}>
        <Text style={{ color: correctCount === items.length ? "#10b981" : "#f59e0b", fontWeight: "700", fontSize: fontSize.sm }}>
          {correctCount}/{items.length} đúng
        </Text>
      </View>

      {/* Per-item list */}
      {items.map((item) => (
        <View key={item.questionNumber} style={[styles.itemRow, { borderColor: c.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: item.isCorrect ? "#10b98118" : "#ef444418" }]}>
            <Ionicons
              name={item.isCorrect ? "checkmark" : "close"}
              size={14}
              color={item.isCorrect ? "#10b981" : "#ef4444"}
            />
          </View>
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, flex: 1 }}>
            Câu {item.questionNumber}
          </Text>
          <View style={styles.answerCol}>
            {item.userAnswer ? (
              <View style={[styles.answerBadge, { backgroundColor: item.isCorrect ? "#10b98115" : "#ef444415" }]}>
                <Text style={{ color: item.isCorrect ? "#10b981" : "#ef4444", fontWeight: "700", fontSize: fontSize.xs }}>
                  {item.userAnswer}
                </Text>
              </View>
            ) : (
              <Text style={{ color: c.subtle, fontSize: fontSize.xs, fontStyle: "italic" }}>—</Text>
            )}
            {!item.isCorrect && item.correctAnswer && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Ionicons name="arrow-forward" size={10} color={c.subtle} />
                <View style={[styles.answerBadge, { backgroundColor: "#10b98115" }]}>
                  <Text style={{ color: "#10b981", fontWeight: "700", fontSize: fontSize.xs }}>
                    {item.correctAnswer}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  summary: { borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignSelf: "flex-start" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 0.5 },
  statusIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  answerCol: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  answerBadge: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
});
