import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { WritingScaffoldSection, WritingScaffoldPart } from "@/types/api";

interface Props {
  sections: WritingScaffoldSection[];
  filledBlanks: Record<string, string>;
  onBlankChange: (id: string, value: string) => void;
  onAssembleText: () => string;
}

export function WritingTier1View({ sections, filledBlanks, onBlankChange }: Props) {
  const c = useThemeColors();
  const [hintLevel, setHintLevel] = useState<"b1" | "b2">("b1");

  const allBlanks = useMemo(() => {
    const blanks: WritingScaffoldPart[] = [];
    for (const s of sections) {
      for (const p of s.parts) {
        if (p.type === "blank" && p.id) blanks.push(p);
      }
    }
    return blanks;
  }, [sections]);

  const filledCount = allBlanks.filter((b) => filledBlanks[b.id!]?.trim()).length;

  return (
    <View style={styles.container}>
      {/* Progress + hint level toggle */}
      <View style={[styles.topBar, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.progressInfo}>
          <Ionicons name="create-outline" size={16} color={c.primary} />
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, fontWeight: "600" }}>
            {filledCount}/{allBlanks.length} đã điền
          </Text>
        </View>
        <View style={styles.levelToggle}>
          <HapticTouchable
            style={[styles.levelBtn, hintLevel === "b1" && { backgroundColor: c.primary + "18" }]}
            onPress={() => setHintLevel("b1")}
          >
            <Text style={{ color: hintLevel === "b1" ? c.primary : c.mutedForeground, fontSize: 11, fontWeight: "700" }}>B1</Text>
          </HapticTouchable>
          <HapticTouchable
            style={[styles.levelBtn, hintLevel === "b2" && { backgroundColor: c.primary + "18" }]}
            onPress={() => setHintLevel("b2")}
          >
            <Text style={{ color: hintLevel === "b2" ? c.primary : c.mutedForeground, fontSize: 11, fontWeight: "700" }}>B2</Text>
          </HapticTouchable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.progressFill, { width: `${allBlanks.length > 0 ? (filledCount / allBlanks.length) * 100 : 0}%` as any, backgroundColor: filledCount === allBlanks.length ? "#10b981" : c.primary }]} />
      </View>

      {/* Sections */}
      <ScrollView contentContainerStyle={styles.sections} keyboardShouldPersistTaps="handled">
        {sections.map((section, si) => (
          <SectionCard
            key={si}
            section={section}
            index={si}
            filledBlanks={filledBlanks}
            onBlankChange={onBlankChange}
            hintLevel={hintLevel}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SectionCard({
  section,
  index,
  filledBlanks,
  onBlankChange,
  hintLevel,
}: {
  section: WritingScaffoldSection;
  index: number;
  filledBlanks: Record<string, string>;
  onBlankChange: (id: string, value: string) => void;
  hintLevel: "b1" | "b2";
}) {
  const c = useThemeColors();
  const blanks = section.parts.filter((p) => p.type === "blank" && p.id);
  const filled = blanks.filter((b) => filledBlanks[b.id!]?.trim()).length;
  const allFilled = blanks.length > 0 && filled === blanks.length;

  return (
    <View style={[styles.sectionCard, { backgroundColor: allFilled ? "#10b98108" : c.card, borderColor: allFilled ? "#10b98140" : c.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionNum, { backgroundColor: allFilled ? "#10b98118" : c.primary + "18" }]}>
          {allFilled ? (
            <Ionicons name="checkmark" size={12} color="#10b981" />
          ) : (
            <Text style={{ color: c.primary, fontSize: 10, fontWeight: "800" }}>{index + 1}</Text>
          )}
        </View>
        <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, flex: 1 }}>{section.title}</Text>
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{filled}/{blanks.length}</Text>
      </View>

      {/* Render parts inline */}
      <View style={styles.partsWrap}>
        {section.parts.map((part, pi) =>
          part.type === "text" ? (
            <Text key={pi} style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 24 }}>
              {part.content}
            </Text>
          ) : part.id ? (
            <BlankInput
              key={pi}
              part={part}
              value={filledBlanks[part.id] ?? ""}
              onChange={(v) => onBlankChange(part.id!, v)}
              hintLevel={hintLevel}
            />
          ) : null,
        )}
      </View>
    </View>
  );
}

function BlankInput({
  part,
  value,
  onChange,
  hintLevel,
}: {
  part: WritingScaffoldPart;
  value: string;
  onChange: (v: string) => void;
  hintLevel: "b1" | "b2";
}) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const hints = part.hints?.[hintLevel] ?? [];
  const isTransition = part.variant === "transition";
  const borderColor = isTransition ? c.primary : c.border;
  const filled = value.trim().length > 0;

  // Always show compact hint preview, expand on tap
  return (
    <View style={styles.blankContainer}>
      <HapticTouchable onPress={() => setExpanded(!expanded)}>
        <TextInput
          style={[
            styles.blankInput,
            {
              borderColor: filled ? "#10b981" : borderColor,
              backgroundColor: filled ? "#10b98108" : c.muted,
              color: c.foreground,
              borderStyle: filled ? "solid" : "dashed",
            },
          ]}
          placeholder={part.label ?? "..."}
          placeholderTextColor={c.mutedForeground}
          value={value}
          onChangeText={onChange}
          onFocus={() => setExpanded(true)}
          multiline={false}
        />
      </HapticTouchable>

      {/* Compact hint badge — always visible when not filled */}
      {!filled && hints.length > 0 && !expanded && (
        <HapticTouchable
          style={[styles.hintPreview, { backgroundColor: isTransition ? c.primary + "10" : c.muted }]}
          onPress={() => setExpanded(true)}
        >
          <Ionicons name={isTransition ? "git-merge-outline" : "bulb-outline"} size={10} color={isTransition ? c.primary : c.mutedForeground} />
          <Text style={{ color: isTransition ? c.primary : c.mutedForeground, fontSize: 10 }}>
            {hintLevel.toUpperCase()}: {hints[0]?.slice(0, 20)}{hints[0]?.length > 20 ? "..." : ""}
          </Text>
        </HapticTouchable>
      )}

      {/* Expanded hints */}
      {expanded && hints.length > 0 && (
        <View style={[styles.hintsBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.hintsHeader}>
            <Ionicons name={isTransition ? "git-merge-outline" : "bulb-outline"} size={12} color={c.primary} />
            <Text style={{ color: c.primary, fontSize: 10, fontWeight: "600" }}>
              {isTransition ? "Từ nối" : "Gợi ý"} ({hintLevel.toUpperCase()})
            </Text>
            <HapticTouchable onPress={() => setExpanded(false)} style={{ marginLeft: "auto" }}>
              <Ionicons name="close-circle" size={16} color={c.mutedForeground} />
            </HapticTouchable>
          </View>
          <View style={styles.hintsChips}>
            {hints.map((hint, i) => (
              <HapticTouchable
                key={i}
                style={[styles.hintChip, { backgroundColor: c.primary + "12", borderColor: c.primary + "30" }]}
                onPress={() => { onChange(hint); setExpanded(false); }}
              >
                <Text style={{ color: c.primary, fontSize: fontSize.xs }}>{hint}</Text>
              </HapticTouchable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Assemble text from template ──────────────────────────────────

export function assembleTemplateText(
  sections: WritingScaffoldSection[],
  filledBlanks: Record<string, string>,
): string {
  return sections
    .map((section) => {
      const parts = section.parts.map((part) =>
        part.type === "text" ? (part.content ?? "") : (filledBlanks[part.id ?? ""] ?? ""),
      );
      return parts.reduce((acc, curr) => {
        if (!acc) return curr;
        if (!curr) return acc;
        const needsSpace = !acc.endsWith(" ") && !curr.startsWith(" ") && !/^[.,;:!?]/.test(curr);
        return acc + (needsSpace ? " " : "") + curr;
      }, "");
    })
    .join("\n\n");
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.sm },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
  progressInfo: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  levelToggle: { flexDirection: "row", gap: 2, backgroundColor: "#00000008", borderRadius: radius.sm, padding: 2 },
  levelBtn: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.sm },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2 },
  sections: { gap: spacing.md, paddingBottom: spacing["3xl"] },
  sectionCard: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  partsWrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  blankContainer: { marginVertical: 2 },
  blankInput: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 4, fontSize: fontSize.sm, minWidth: 100, maxWidth: 250 },
  hintPreview: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  hintsBox: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.sm, marginTop: spacing.xs, gap: spacing.xs },
  hintsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  hintsChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  hintChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
