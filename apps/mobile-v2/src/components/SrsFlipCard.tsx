// SrsFlipCard — vocab SRS review card with 3D flip.
// Mirrors apps/frontend-v3/src/features/vocab/components/SrsFlipCard.tsx
// Front:  word + phonetic + part of speech + "Nhấn để lật thẻ"
// Back:   word + phonetic + definition + example + vstep tip
// Both faces wrap a Pressable that triggers `onFlip` and a small volume
// button (top-right) calling `expo-speech` to pronounce the word.
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { FlipCard } from "@/components/FlipCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { VocabWord } from "@/hooks/use-vocab";

interface Props {
  word: VocabWord;
  flipped: boolean;
  onFlip: () => void;
}

export function SrsFlipCard({ word, flipped, onFlip }: Props) {
  return (
    <FlipCard
      flipped={flipped}
      front={<Front word={word} onFlip={onFlip} />}
      back={<Back word={word} onFlip={onFlip} />}
    />
  );
}

function Header({ word }: { word: string }) {
  const c = useThemeColors();
  return (
    <View style={s.header}>
      <View style={[s.eyebrow, { backgroundColor: c.muted }]}>
        <Text style={[s.eyebrowText, { color: c.mutedForeground }]}>Ôn tập</Text>
      </View>
      <HapticTouchable
        onPress={() => Speech.speak(word, { language: "en-US", rate: 0.9 })}
        style={s.volumeBtn}
        hitSlop={8}
      >
        <Ionicons name="volume-medium-outline" size={20} color={c.mutedForeground} />
      </HapticTouchable>
    </View>
  );
}

function FaceShell({
  onFlip,
  children,
  style,
}: {
  onFlip: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onFlip}
      style={[
        s.face,
        { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

function Front({ word, onFlip }: { word: VocabWord; onFlip: () => void }) {
  const c = useThemeColors();
  return (
    <FaceShell onFlip={onFlip}>
      <Header word={word.word} />
      <View style={s.body}>
        <Text style={[s.wordText, { color: c.foreground }]}>{word.word}</Text>
        {word.phonetic ? (
          <Text style={[s.phoneticText, { color: c.subtle }]}>{word.phonetic}</Text>
        ) : null}
        {word.partOfSpeech ? (
          <View style={[s.posPill, { backgroundColor: c.background }]}>
            <Text style={[s.posText, { color: c.mutedForeground }]}>{word.partOfSpeech}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[s.hint, { color: c.subtle }]}>Nhấn để lật thẻ</Text>
    </FaceShell>
  );
}

function Back({ word, onFlip }: { word: VocabWord; onFlip: () => void }) {
  const c = useThemeColors();
  return (
    <FaceShell onFlip={onFlip}>
      <Header word={word.word} />
      <View style={s.body}>
        <Text style={[s.wordTextSmall, { color: c.foreground }]}>{word.word}</Text>
        {word.phonetic ? (
          <Text style={[s.phoneticSmall, { color: c.subtle }]}>{word.phonetic}</Text>
        ) : null}
        <Text style={[s.definitionText, { color: c.foreground }]}>{word.definition}</Text>
        {word.example ? (
          <Text style={[s.exampleText, { color: c.mutedForeground }]}>{`"${word.example}"`}</Text>
        ) : null}
        {word.vstepTip ? (
          <View style={[s.tipBox, { backgroundColor: c.infoTint }]}>
            <Text style={[s.tipText, { color: c.info }]}>{word.vstepTip}</Text>
          </View>
        ) : null}
      </View>
    </FaceShell>
  );
}

const s = StyleSheet.create({
  face: {
    width: "100%",
    minHeight: 360,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  eyebrowText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  volumeBtn: { padding: spacing.xs },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  wordText: { fontSize: 34, fontFamily: fontFamily.extraBold, textAlign: "center" },
  wordTextSmall: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  phoneticText: { fontSize: fontSize.lg },
  phoneticSmall: { fontSize: fontSize.sm },
  posPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  posText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  definitionText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  exampleText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  tipBox: { width: "100%", padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.xs },
  tipText: { fontSize: fontSize.xs, lineHeight: 18 },
  hint: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.md },
});
