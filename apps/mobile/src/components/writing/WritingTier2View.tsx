import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { WritingGuidedPayload, WritingContent } from "@/types/api";

interface Props {
  content: WritingContent;
  hints: WritingGuidedPayload;
  text: string;
  onChangeText: (t: string) => void;
}

export function WritingTier2View({ content, hints, text, onChangeText }: Props) {
  const c = useThemeColors();
  const [hintsExpanded, setHintsExpanded] = useState(true);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Prompt */}
      <View style={[styles.promptBox, { backgroundColor: c.muted }]}>
        <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, lineHeight: 22 }}>
          {content.prompt}
        </Text>
        {content.requiredPoints && content.requiredPoints.length > 0 && (
          <View style={{ marginTop: spacing.sm, gap: 2 }}>
            <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "600" }}>Yêu cầu:</Text>
            {content.requiredPoints.map((pt, i) => (
              <Text key={i} style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>• {pt}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Collapsible hints panel */}
      <HapticTouchable
        style={[styles.hintsToggle, { backgroundColor: c.primary + "08", borderColor: c.primary + "30" }]}
        onPress={() => setHintsExpanded(!hintsExpanded)}
      >
        <Ionicons name="bulb-outline" size={16} color={c.primary} />
        <Text style={{ color: c.primary, fontWeight: "600", fontSize: fontSize.sm, flex: 1 }}>Gợi ý dàn bài</Text>
        <Ionicons name={hintsExpanded ? "chevron-up" : "chevron-down"} size={16} color={c.primary} />
      </HapticTouchable>

      {hintsExpanded && (
        <View style={[styles.hintsPanel, { backgroundColor: c.card, borderColor: c.border }]}>
          {/* Outline */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.xs }}>Dàn bài:</Text>
            {hints.outline.map((item, i) => (
              <View key={i} style={styles.outlineRow}>
                <View style={[styles.outlineNum, { backgroundColor: c.primary + "18" }]}>
                  <Text style={{ color: c.primary, fontSize: 9, fontWeight: "800" }}>{i + 1}</Text>
                </View>
                <Text style={{ color: c.foreground, fontSize: fontSize.xs, flex: 1, lineHeight: 18 }}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Starters */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.xs }}>Mẫu câu gợi ý:</Text>
            <View style={styles.startersWrap}>
              {hints.starters.map((s, i) => (
                <HapticTouchable
                  key={i}
                  style={[styles.starterChip, { backgroundColor: c.muted }]}
                  onPress={() => {
                    const separator = text.length > 0 && !text.endsWith(" ") && !text.endsWith("\n") ? " " : "";
                    onChangeText(text + separator + s);
                  }}
                >
                  <Text style={{ color: c.foreground, fontSize: 11 }}>{s}</Text>
                </HapticTouchable>
              ))}
            </View>
          </View>

          {/* Word count target */}
          <View style={styles.wordTarget}>
            <Ionicons name="document-text-outline" size={12} color={c.mutedForeground} />
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>Số từ yêu cầu: {hints.wordCount}</Text>
          </View>
        </View>
      )}

      {/* Textarea */}
      <TextInput
        style={[styles.textArea, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
        placeholder="Bắt đầu viết bài..."
        placeholderTextColor={c.mutedForeground}
        multiline
        textAlignVertical="top"
        value={text}
        onChangeText={onChangeText}
      />

      {/* Word count */}
      <Text style={{ color: wordCount >= (content.minWords ?? 0) ? "#10b981" : c.mutedForeground, fontSize: fontSize.xs, textAlign: "right" }}>
        {wordCount} từ{content.minWords ? ` / ${content.minWords} tối thiểu` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  promptBox: { borderRadius: radius.lg, padding: spacing.md },
  hintsToggle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  hintsPanel: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.base },
  outlineRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  outlineNum: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 1 },
  startersWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  starterChip: { borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  wordTarget: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  textArea: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 200, fontSize: fontSize.sm, lineHeight: 22 },
});
