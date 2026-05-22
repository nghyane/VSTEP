import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const HIGHLIGHT_COLORS = [
  { key: "yellow", label: "Vàng", bg: "rgba(255, 200, 0, 0.35)" },
  { key: "green", label: "Xanh lá", bg: "rgba(88, 204, 2, 0.25)" },
  { key: "blue", label: "Xanh dương", bg: "rgba(28, 176, 246, 0.25)" },
  { key: "pink", label: "Hồng", bg: "rgba(255, 90, 120, 0.25)" },
  { key: "purple", label: "Tím", bg: "rgba(120, 80, 200, 0.25)" },
] as const;

interface Highlight {
  start: number;
  end: number;
  colorIdx: number;
}

interface Props {
  text: string;
  passageId: string;
  style?: object;
}

export function HighlightablePassage({ text, passageId, style }: Props) {
  const c = useThemeColors();
  const [highlights, setHighlights] = useState<Map<string, Highlight[]>>(new Map());
  const [palette, setPalette] = useState<{ sentenceIdx: number } | null>(null);
  const sentences = text.split(/(?<=[.!?])\s+/);

  const current = highlights.get(passageId) ?? [];

  function applyColor(colorIdx: number) {
    if (!palette) return;
    const start = sentences.slice(0, palette.sentenceIdx).reduce((a, s) => a + s.length + 1, 0);
    const end = start + sentences[palette.sentenceIdx].length;
    setHighlights((prev) => {
      const next = new Map(prev);
      const cur = next.get(passageId) ?? [];
      const kept = cur.filter((h) => h.end <= start || h.start >= end);
      next.set(passageId, [...kept, { start, end, colorIdx }].sort((a, b) => a.start - b.start));
      return next;
    });
    setPalette(null);
  }

  function removeHighlight(idx: number) {
    setHighlights((prev) => {
      const next = new Map(prev);
      const cur = next.get(passageId) ?? [];
      next.set(passageId, cur.filter((_, i) => i !== idx));
      return next;
    });
  }

  const segments: React.ReactNode[] = [];
  let cursor = 0;
  const sorted = [...current].sort((a, b) => a.start - b.start);
  for (const hl of sorted) {
    if (hl.start > cursor) {
      segments.push(
        <Text key={`text-${cursor}`} style={[s.passageText, style, { color: c.foreground }]}>
          {text.slice(cursor, hl.start)}
        </Text>,
      );
    }
    const color = HIGHLIGHT_COLORS[hl.colorIdx];
    const idx = current.indexOf(hl);
    segments.push(
      <TouchableOpacity
        key={`hl-${hl.start}`}
        activeOpacity={0.8}
        onPress={() => removeHighlight(idx)}
        style={[{ backgroundColor: color.bg, borderRadius: 4, paddingHorizontal: 2 }]}
      >
        <Text style={[s.passageText, style, { color: c.foreground }]}>
          {text.slice(hl.start, hl.end)}
        </Text>
      </TouchableOpacity>,
    );
    cursor = hl.end;
  }
  if (cursor < text.length) {
    segments.push(
      <Text key={`text-end`} style={[s.passageText, style, { color: c.foreground }]}>
        {text.slice(cursor)}
      </Text>,
    );
  }

  return (
    <View style={s.container}>
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={() => {
          if (!palette) setPalette({ sentenceIdx: Math.floor(Math.random() * sentences.length) });
        }}
        delayLongPress={500}
      >
        {segments}
      </TouchableOpacity>

      {palette && (
        <View style={[s.palette, { backgroundColor: c.card, borderColor: c.border }]}>
          {HIGHLIGHT_COLORS.map((color, idx) => (
            <TouchableOpacity
              key={color.key}
              style={[s.colorDot, { backgroundColor: color.bg }]}
              onPress={() => applyColor(idx)}
              activeOpacity={0.7}
            />
          ))}
          <TouchableOpacity style={s.closePalette} onPress={() => setPalette(null)} activeOpacity={0.7}>
            <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[s.hint, { color: c.subtle }]}>Giữ ngón tay lên đoạn văn để tô màu</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: spacing.sm },
  passageText: { fontSize: fontSize.base, fontFamily: fontFamily.regular, lineHeight: 24 },
  palette: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 2,
    alignSelf: "center",
  },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#ccc" },
  closePalette: { padding: spacing.xs },
  hint: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.xs },
});
