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
  const speakers = useMemo(() => {
    const seen: string[] = [];
    for (const item of turns) {
      if (item.speaker && !seen.includes(item.speaker)) seen.push(item.speaker);
    }
    return seen;
  }, [turns]);
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

  const isDialogue = speakers.length > 1;
  const speakerIndex = turn.speaker ? speakers.indexOf(turn.speaker) : -1;
  const isRight = isDialogue && speakerIndex === 1;
  const speakerColor = speakerIndex === 1 ? c.foreground : accentColor;

  return (
    <View style={[ts.panel, { backgroundColor: c.surface, borderColor: accentColor }]}>
      {isDialogue && turn.speaker ? (
        <View style={[ts.dialogueRow, isRight && ts.dialogueRowRight]}>
          <View
            style={[
              ts.avatar,
              {
                backgroundColor: speakerColor,
                borderColor: speakerColor,
              },
            ]}
          >
            <Text style={[ts.avatarText, { color: c.primaryForeground }]}>
              {turn.speaker.charAt(0)}
            </Text>
          </View>
          <View style={[ts.bubbleWrap, isRight && ts.bubbleWrapRight]}>
            <Text style={[ts.speakerName, { color: c.mutedForeground }, isRight && ts.speakerNameRight]}>
              {turn.speaker}
            </Text>
            <View style={[ts.bubble, { borderColor: c.border, backgroundColor: c.surface }]}>
              <SubtitleWords
                words={words}
                turnStart={turn.globalWordStart}
                activeWordIndex={activeWordIndex}
                c={c}
                centered={false}
              />
            </View>
          </View>
        </View>
      ) : (
        <SubtitleWords
          words={words}
          turnStart={turn.globalWordStart}
          activeWordIndex={activeWordIndex}
          c={c}
          centered
        />
      )}
    </View>
  );
}

function SubtitleWords({
  words,
  turnStart,
  activeWordIndex,
  c,
  centered,
}: {
  words: string[];
  turnStart: number;
  activeWordIndex: number;
  c: ThemeColors;
  centered: boolean;
}) {
  return (
    <Text style={[ts.line, centered && ts.lineCentered]}>
      {words.map((word, wi) => {
        const globalIdx = turnStart + wi;
        const spoken = activeWordIndex >= 0 && globalIdx <= activeWordIndex;
        return (
          <Text key={`${word}-${wi}`}>
            <Text style={[ts.word, spoken ? { color: c.foreground } : { color: c.subtle, opacity: 0.35 }]}>
              {word}
            </Text>
            {wi < words.length - 1 ? " " : ""}
          </Text>
        );
      })}
    </Text>
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
  },
  lineCentered: {
    textAlign: "center",
  },
  word: {
    fontFamily: fontFamily.bold,
  },
  dialogueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  dialogueRowRight: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: fontFamily.extraBold,
  },
  bubbleWrap: {
    flex: 1,
    minWidth: 0,
  },
  bubbleWrapRight: {
    alignItems: "flex-end",
  },
  speakerName: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    marginBottom: 4,
  },
  speakerNameRight: {
    textAlign: "right",
  },
  bubble: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: "88%",
  },
});
