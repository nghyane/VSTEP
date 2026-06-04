import { useCallback, useState } from "react";
import {
  ActivityIndicator, Modal, Pressable, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { translateText } from "@/lib/translate";
import { spacing, fontSize, fontFamily, radius } from "@/theme";
import type { ThemeColors } from "@/theme";

interface Token {
  text: string;
  isWord: boolean;
}

interface Props {
  passage: string;
  wordTapMode: boolean;
  accentColor: string;
  c: ThemeColors;
}

/**
 * Renders passage text with each word as a tappable Pressable when
 * wordTapMode is ON. Tapping a word shows a translation modal.
 * When wordTapMode is OFF, renders as plain text.
 */
export function PassageWordView({ passage, wordTapMode, accentColor, c }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const paragraphs = passage.split(/\n\n+/);

  const handleWordTap = useCallback(async (word: string) => {
    if (!wordTapMode) return;
    setSelectedWord(word);
    setMeaning(null);
    setLoading(true);
    try {
      const result = await translateText(word, "en", "vi");
      setMeaning(result && result !== word ? result : "(Không tìm thấy)");
    } catch {
      setMeaning("(Lỗi dịch)");
    } finally {
      setLoading(false);
    }
  }, [wordTapMode]);

  const handleSpeak = useCallback(() => {
    if (selectedWord) {
      Speech.speak(selectedWord, { language: "en" });
    }
  }, [selectedWord]);

  const handleClose = useCallback(() => {
    setSelectedWord(null);
    setMeaning(null);
    setLoading(false);
  }, []);

  function tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    const regex = /([a-zA-Z'-]+)|([^a-zA-Z'-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        tokens.push({ text: match[1], isWord: true });
      } else if (match[2]) {
        tokens.push({ text: match[2], isWord: false });
      }
    }
    return tokens;
  }

  return (
    <View style={s.container}>
      {paragraphs.map((para, pi) => {
        const tokens = tokenize(para);
        return (
          <View key={pi}>
            <Text style={[s.paragraph, { color: c.foreground }]}>
              {tokens.map((token, ti) => {
                if (token.isWord && wordTapMode) {
                  return (
                    <Text
                      key={ti}
                      onPress={() => handleWordTap(token.text)}
                      style={[s.wordHighlight, {
                        color: c.foreground,
                        backgroundColor: accentColor + "0D",
                      }]}
                    >
                      {token.text}
                    </Text>
                  );
                }
                return (
                  <Text key={ti} style={[s.nonWord, { color: c.foreground }]}>
                    {token.text}
                  </Text>
                );
              })}
            </Text>
          </View>
        );
      })}

      {/* Translation modal */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={s.overlay} onPress={handleClose}>
          <Pressable
            style={[s.tooltipCard, { backgroundColor: c.card, borderColor: accentColor }]}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={s.tooltipHeader}>
              <Text style={[s.tooltipWord, { color: c.foreground }]}>
                {selectedWord}
              </Text>
              <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                <Ionicons name="close" size={18} color={c.subtle} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            {loading ? (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={[s.loadingText, { color: c.mutedForeground }]}>
                  Đang tra từ...
                </Text>
              </View>
            ) : meaning ? (
              <Text style={[s.meaningText, { color: c.foreground }]}>
                {meaning}
              </Text>
            ) : null}

            {/* Speak button */}
            <TouchableOpacity
              onPress={handleSpeak}
              disabled={loading}
              style={[s.speakBtn, { backgroundColor: accentColor + "18" }]}
            >
              <Ionicons name="volume-high" size={16} color={accentColor} />
              <Text style={[s.speakLabel, { color: accentColor }]}>Phát âm</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: spacing.sm },
  paragraph: { fontSize: fontSize.sm, lineHeight: 22 },
  wordHighlight: {
    fontFamily: fontFamily.bold,
    borderBottomWidth: 1,
    borderBottomColor: "#C4B5E4",
    borderStyle: "dotted",
    borderRadius: 2,
    paddingHorizontal: 1,
  },
  nonWord: {
    fontFamily: fontFamily.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  tooltipCard: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tooltipWord: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.extraBold,
  },
  closeBtn: { padding: spacing.xs },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    fontStyle: "italic",
  },
  meaningText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.medium,
    lineHeight: 22,
  },
  speakBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  speakLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
});
