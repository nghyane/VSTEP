import { useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { GradingAnnotations } from "@/types/api";

// ─── Parse feedback into blocks ──────────────────────────────────────────────

type Block =
  | { type: "section"; title: string; kind: "strength" | "improve" | "rewrite" }
  | { type: "correction"; original: string; fix: string }
  | { type: "paragraph"; text: string }; // may contain "quoted" text

function parseFeedback(text: string): Block[] {
  const blocks: Block[] = [];

  // Step 1: Extract all multi-line corrections first (they span across newlines)
  // Pattern: "...text..." → "...text..." (quotes can contain newlines)
  const correctionPlaceholders: { original: string; fix: string }[] = [];
  let processed = text.replace(/"([^"]+)"\s*[→\->\u2192]+\s*"([^"]+)"/gs, (match, orig, fix) => {
    const idx = correctionPlaceholders.length;
    correctionPlaceholders.push({ original: orig.replace(/\n/g, " ").trim(), fix: fix.replace(/\n/g, " ").trim() });
    return `\n__CORR_${idx}__\n`;
  });

  // Step 2: Split into paragraphs by double newline or section headers
  const paragraphs = processed.split(/\n{2,}|\n(?=Điểm mạnh|Điểm cần|Gợi ý viết|__CORR_)/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check for correction placeholder
    const corrIdx = trimmed.match(/^__CORR_(\d+)__$/);
    if (corrIdx) {
      const corr = correctionPlaceholders[parseInt(corrIdx[1], 10)];
      if (corr) blocks.push({ type: "correction", ...corr });
      continue;
    }

    // Check for section headers
    if (/^Điểm mạnh/i.test(trimmed)) {
      blocks.push({ type: "section", title: trimmed.replace(/:$/, ""), kind: "strength" });
      continue;
    }
    if (/^Điểm cần cải thiện/i.test(trimmed)) {
      blocks.push({ type: "section", title: trimmed.replace(/:$/, ""), kind: "improve" });
      continue;
    }
    if (/^Gợi ý viết lại/i.test(trimmed)) {
      blocks.push({ type: "section", title: trimmed.replace(/:$/, ""), kind: "rewrite" });
      continue;
    }

    // Process remaining lines — may contain inline correction placeholders
    const lines = trimmed.split("\n");
    let textBuf = "";

    for (const line of lines) {
      const lineCorr = line.trim().match(/^__CORR_(\d+)__$/);
      if (lineCorr) {
        if (textBuf.trim()) {
          blocks.push({ type: "paragraph", text: textBuf.trim() });
          textBuf = "";
        }
        const corr = correctionPlaceholders[parseInt(lineCorr[1], 10)];
        if (corr) blocks.push({ type: "correction", ...corr });
      } else {
        textBuf += (textBuf ? "\n" : "") + line.trim();
      }
    }
    if (textBuf.trim()) {
      blocks.push({ type: "paragraph", text: textBuf.trim() });
    }
  }

  return blocks;
}

// ─── Render quoted text inline with highlights ───────────────────────────────

function RichParagraph({ text }: { text: string }) {
  const c = useThemeColors();

  // Split by "quoted" parts
  const parts = text.split(/("(?:[^"]+)")/g);

  return (
    <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>
      {parts.map((part, i) => {
        const quoteMatch = part.match(/^"([^"]+)"$/);
        if (quoteMatch) {
          return (
            <Text key={i} style={{ backgroundColor: "#10b98118", color: "#10b981", fontWeight: "600", borderRadius: 2 }}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  feedback: string;
  annotations?: GradingAnnotations;
  scrollToAnswer?: () => void;
}

export function RichFeedback({ feedback, scrollToAnswer }: Props) {
  const c = useThemeColors();
  const blocks = useMemo(() => parseFeedback(feedback), [feedback]);

  const sectionConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
    strength: { icon: "checkmark-circle", color: "#10b981", bg: "#10b98110" },
    improve: { icon: "create-outline", color: "#ef4444", bg: "#ef444410" },
    rewrite: { icon: "bulb-outline", color: "#f59e0b", bg: "#f59e0b10" },
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        if (block.type === "section") {
          const cfg = sectionConfig[block.kind];
          return (
            <View key={i} style={[styles.sectionHeader, { backgroundColor: cfg.bg, borderLeftColor: cfg.color }]}>
              <Ionicons name={cfg.icon} size={16} color={cfg.color} />
              <Text style={{ color: cfg.color, fontWeight: "700", fontSize: fontSize.sm }}>{block.title}</Text>
            </View>
          );
        }

        if (block.type === "correction") {
          return (
            <HapticTouchable key={i} style={[styles.correctionCard, { backgroundColor: c.background }]} onPress={scrollToAnswer} activeOpacity={0.7}>
              <Text style={styles.strikeText}>{block.original}</Text>
              <View style={styles.arrowRow}>
                <Ionicons name="arrow-forward" size={14} color={c.subtle} />
                <Text style={styles.fixText}>{block.fix}</Text>
              </View>
            </HapticTouchable>
          );
        }

        // Paragraph with inline quote highlights
        return <RichParagraph key={i} text={block.text} />;
      })}
    </View>
  );
}

// ─── Annotated submitted text ────────────────────────────────────────────────

export function AnnotatedAnswer({
  text,
  corrections,
}: {
  text: string;
  corrections: { original: string; correction: string; type: string; explanation: string }[];
}) {
  const c = useThemeColors();

  const segments = useMemo(() => {
    if (!corrections.length) return [{ type: "normal" as const, content: text }];

    const result: { type: "normal" | "error"; content: string; correction?: string }[] = [];
    let remaining = text;

    const sorted = [...corrections].sort((a, b) => {
      const posA = text.indexOf(a.original);
      const posB = text.indexOf(b.original);
      return posA - posB;
    });

    for (const corr of sorted) {
      const idx = remaining.indexOf(corr.original);
      if (idx === -1) continue;

      if (idx > 0) {
        result.push({ type: "normal", content: remaining.slice(0, idx) });
      }
      result.push({ type: "error", content: corr.original, correction: corr.correction });
      remaining = remaining.slice(idx + corr.original.length);
    }

    if (remaining) {
      result.push({ type: "normal", content: remaining });
    }

    return result;
  }, [text, corrections]);

  return (
    <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 24 }}>
      {segments.map((seg, i) =>
        seg.type === "normal" ? (
          <Text key={i}>{seg.content}</Text>
        ) : (
          <Text
            key={i}
            style={{
              backgroundColor: "#ef444425",
              textDecorationLine: "underline",
              textDecorationColor: "#ef4444",
              textDecorationStyle: "solid",
              color: "#ef4444",
            }}
          >
            {seg.content}
          </Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  correctionCard: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  strikeText: {
    textDecorationLine: "line-through",
    color: "#ef4444",
    fontSize: fontSize.sm,
  },
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fixText: {
    color: "#10b981",
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
});
