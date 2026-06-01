import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { GradingAnnotations } from "@/types/api";

const HIGHLIGHT_TYPES: Record<string, { label: string; color: string }> = {
  structure: { label: "Cấu trúc hay", color: "#10b981" },
  collocation: { label: "Collocation", color: "#06b6d4" },
  transition: { label: "Từ nối", color: "#8b5cf6" },
};

const ERROR_TYPES: Record<string, { label: string; color: string }> = {
  grammar: { label: "Ngữ pháp", color: "#ef4444" },
  vocabulary: { label: "Từ vựng", color: "#f59e0b" },
  spelling: { label: "Chính tả", color: "#3b82f6" },
};

export function WritingAnnotationsView({ annotations }: { annotations: GradingAnnotations }) {
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Strength quotes */}
      {annotations.strengthQuotes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={16} color="#10b981" />
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Điểm sáng trong bài</Text>
            <View style={[styles.countBadge, { backgroundColor: "#10b98118" }]}>
              <Text style={{ color: "#10b981", fontSize: 10, fontWeight: "700" }}>{annotations.strengthQuotes.length}</Text>
            </View>
          </View>
          {annotations.strengthQuotes.map((h, i) => {
            const config = HIGHLIGHT_TYPES[h.type] ?? HIGHLIGHT_TYPES.structure;
            return (
              <View key={i} style={[styles.highlightCard, { borderColor: config.color + "40", backgroundColor: config.color + "08" }]}>
                <View style={styles.highlightTop}>
                  <Ionicons name="checkmark-circle" size={14} color={config.color} />
                  <Text style={{ color: config.color, fontWeight: "600", fontSize: fontSize.sm, flex: 1 }}>
                    "{h.phrase}"
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: config.color + "18" }]}>
                    <Text style={{ color: config.color, fontSize: 9, fontWeight: "700" }}>{config.label}</Text>
                  </View>
                </View>
                {h.note ? <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>{h.note}</Text> : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Corrections */}
      {annotations.corrections.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={16} color="#ef4444" />
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lỗi cần sửa</Text>
            <View style={[styles.countBadge, { backgroundColor: "#ef444418" }]}>
              <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "700" }}>{annotations.corrections.length} lỗi</Text>
            </View>
          </View>
          {annotations.corrections.map((err, i) => {
            const config = ERROR_TYPES[err.type] ?? ERROR_TYPES.grammar;
            return (
              <View key={i} style={[styles.errorCard, { borderColor: config.color + "40", backgroundColor: config.color + "08" }]}>
                <View style={[styles.typeBadge, { backgroundColor: config.color + "18", alignSelf: "flex-start" }]}>
                  <Text style={{ color: config.color, fontSize: 9, fontWeight: "700" }}>{config.label}</Text>
                </View>
                <View style={styles.correctionRow}>
                  <Text style={[styles.originalText, { color: "#ef4444" }]}>{err.original}</Text>
                  <Ionicons name="arrow-forward" size={12} color={c.subtle} />
                  <Text style={{ color: "#10b981", fontWeight: "700", fontSize: fontSize.sm }}>{err.correction}</Text>
                </View>
                {err.explanation ? (
                  <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>{err.explanation}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Rewrite suggestion */}
      {annotations.rewriteSuggestion && (
        <View style={[styles.rewriteCard, { borderColor: "#f59e0b40", backgroundColor: "#f59e0b08" }]}>
          <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: fontSize.sm }}>Gợi ý viết lại</Text>
          <View style={[styles.rewriteBox, { backgroundColor: "#ef444410" }]}>
            <Text style={[styles.originalText, { color: "#ef4444" }]}>{annotations.rewriteSuggestion.original}</Text>
          </View>
          <View style={[styles.rewriteBox, { backgroundColor: "#10b98110" }]}>
            <Text style={{ color: "#10b981", fontWeight: "600", fontSize: fontSize.sm }}>{annotations.rewriteSuggestion.correction}</Text>
          </View>
          {annotations.rewriteSuggestion.note ? (
            <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>{annotations.rewriteSuggestion.note}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.base },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.sm, flex: 1 },
  countBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  highlightCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  highlightTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typeBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  errorCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  correctionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  originalText: { textDecorationLine: "line-through", fontSize: fontSize.sm },
  rewriteCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  rewriteBox: { borderRadius: radius.md, padding: spacing.sm },
});
