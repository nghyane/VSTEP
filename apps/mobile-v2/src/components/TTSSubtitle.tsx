import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, fontSize, fontFamily } from "@/theme";
import type { ThemeColors } from "@/theme";
import type { Turn } from "@/hooks/use-tts-player";

interface Props {
  turns: Turn[];
  activeWordIndex: number;
  activeTurnIndex: number;
  playing: boolean;
  c: ThemeColors;
  accentColor: string;
}

/**
 * Hiển thị câu đang đọc với từ đã nói → đậm, từ chưa nói → mờ.
 */
export function TTSSubtitlePanel({
  turns, activeWordIndex, activeTurnIndex, playing, c, accentColor,
}: Props) {
  const turn = activeTurnIndex >= 0 ? turns[activeTurnIndex] : null;

  const words = useMemo(() => (turn ? turn.text.match(/\S+/g) ?? [] : []), [turn]);

  if (!turn) {
    return (
      <View style={[ts.panel, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
        <Text style={[ts.placeholder, { color: c.mutedForeground }]}>
          {playing ? "Đang tải phụ đề..." : "Nhấn phát để bắt đầu nghe"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[ts.panel, { backgroundColor: c.surface, borderColor: accentColor }]}>
      <Text style={ts.line}>
        {words.map((word, wi) => {
          const globalIdx = turn.globalWordStart + wi;
          const spoken = activeWordIndex >= 0 && globalIdx <= activeWordIndex;
          return (
            <Text key={wi}>
              <Text style={[ts.word, spoken ? { color: c.foreground } : { color: c.subtle, opacity: 0.35 }]}>
                {word}
              </Text>
              {wi < words.length - 1 ? " " : ""}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}

const ts = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderRadius: 14,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  placeholder: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    textAlign: "center",
    fontStyle: "italic",
  },
  line: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fontFamily.medium,
    textAlign: "center",
  },
  word: {
    fontFamily: fontFamily.bold,
  },
});
