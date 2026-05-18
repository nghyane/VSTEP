// ShadowingSegmentCard — display one shadowing segment with text, IPA toggle,
// translation toggle, listen and record controls, and per-attempt feedback.
// Mirrors apps/frontend-v3/src/features/practice/components/ShadowingSegmentView.tsx
// adapted to React Native.
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";
import type {
  ShadowingAttemptResult,
  ShadowingSegment,
} from "@/features/shadowing/types";

type MicState = "idle" | "listening" | "speaking";

interface Props {
  segment: ShadowingSegment;
  mic: MicState;
  elapsed: number;
  attempt: ShadowingAttemptResult | null;
  emptyWarning: boolean;
  onListen: () => void;
  onRecord: () => void;
}

export function ShadowingSegmentCard({
  segment,
  mic,
  elapsed,
  attempt,
  emptyWarning,
  onListen,
  onRecord,
}: Props) {
  const c = useThemeColors();
  const [showIpa, setShowIpa] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const speakingColor = c.skillSpeaking;
  const accuracy = attempt
    ? segment.wordCount > 0
      ? Math.round((attempt.correctCount / segment.wordCount) * 100)
      : 0
    : null;

  return (
    <DepthCard style={s.card}>
      <View style={s.headerRow}>
        <View style={[s.eyebrow, { backgroundColor: c.skillSpeaking + "20" }]}>
          <Text style={[s.eyebrowText, { color: c.coinDark }]}>
            Câu {segment.index + 1}
          </Text>
        </View>
        <View style={s.actionsRow}>
          <ToggleChip
            active={showIpa}
            label="IPA"
            onPress={() => setShowIpa((v) => !v)}
          />
          <ToggleChip
            active={showTranslation}
            label="Dịch"
            onPress={() => setShowTranslation((v) => !v)}
          />
        </View>
      </View>

      <Text style={[s.text, { color: c.foreground }]}>{segment.text}</Text>

      {showIpa ? (
        <Text style={[s.ipa, { color: c.mutedForeground }]}>/{segment.ipa}/</Text>
      ) : null}

      {showTranslation ? (
        <Text style={[s.translation, { color: c.subtle }]}>
          {segment.translation}
        </Text>
      ) : null}

      <View style={s.controlsRow}>
        <HapticTouchable
          onPress={onListen}
          disabled={mic === "listening"}
          style={[
            s.controlBtn,
            {
              backgroundColor: mic === "speaking" ? speakingColor : c.muted,
              opacity: mic === "listening" ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons
            name={mic === "speaking" ? "stop" : "volume-medium"}
            size={20}
            color={mic === "speaking" ? c.primaryForeground : c.foreground}
          />
          <Text
            style={[
              s.controlText,
              { color: mic === "speaking" ? c.primaryForeground : c.foreground },
            ]}
          >
            {mic === "speaking" ? "Đang phát..." : "Nghe lại"}
          </Text>
        </HapticTouchable>

        <HapticTouchable
          onPress={onRecord}
          disabled={mic === "speaking"}
          style={[
            s.controlBtn,
            {
              backgroundColor:
                mic === "listening" ? c.destructive : c.primary,
              opacity: mic === "speaking" ? 0.5 : 1,
            },
          ]}
        >
          {mic === "listening" ? (
            <>
              <ActivityIndicator color={c.primaryForeground} size="small" />
              <Text style={[s.controlText, { color: c.primaryForeground }]}>
                {elapsed}s · Dừng
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="mic" size={20} color={c.primaryForeground} />
              <Text style={[s.controlText, { color: c.primaryForeground }]}>
                Nhại theo
              </Text>
            </>
          )}
        </HapticTouchable>
      </View>

      {emptyWarning ? (
        <Text style={[s.warning, { color: c.destructive }]}>
          Không nghe rõ giọng nói. Vui lòng nói lại.
        </Text>
      ) : null}

      {attempt ? (
        <AttemptFeedback
          attempt={attempt}
          accuracy={accuracy ?? 0}
        />
      ) : null}
    </DepthCard>
  );
}

function ToggleChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <HapticTouchable
      onPress={onPress}
      style={[
        s.chip,
        {
          backgroundColor: active ? c.info + "20" : c.muted,
          borderColor: active ? c.info : c.border,
        },
      ]}
    >
      <Text
        style={[
          s.chipText,
          { color: active ? c.info : c.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </HapticTouchable>
  );
}

function AttemptFeedback({
  attempt,
  accuracy,
}: {
  attempt: ShadowingAttemptResult;
  accuracy: number;
}) {
  const c = useThemeColors();
  const tone =
    accuracy >= 80 ? c.success : accuracy >= 50 ? c.warning : c.destructive;
  return (
    <View
      style={[
        s.attemptBlock,
        { borderColor: tone + "40", backgroundColor: tone + "10" },
      ]}
    >
      <View style={s.attemptHeader}>
        <Ionicons
          name={accuracy >= 80 ? "checkmark-circle" : "alert-circle"}
          size={18}
          color={tone}
        />
        <Text style={[s.attemptScore, { color: tone }]}>
          {accuracy}% · {attempt.correctCount}/{attempt.wordResults.length}
        </Text>
      </View>
      <View style={s.wordsRow}>
        {attempt.wordResults.map((w, idx) => (
          <WordChip key={`${w.word}-${idx}`} word={w.word} accuracy={w.accuracy} />
        ))}
      </View>
      <Text style={[s.transcript, { color: c.mutedForeground }]}>
        Bạn nói: <Text style={{ fontStyle: "italic" }}>{attempt.transcript}</Text>
      </Text>
    </View>
  );
}

function WordChip({
  word,
  accuracy,
}: {
  word: string;
  accuracy: "correct" | "wrong" | "close";
}) {
  const c = useThemeColors();
  const meta = (() => {
    switch (accuracy) {
      case "correct":
        return { bg: c.primaryTint, fg: c.primaryDark };
      case "close":
        return { bg: c.warningTint, fg: c.warning };
      case "wrong":
        return { bg: c.destructiveTint, fg: c.destructive };
    }
  })();
  return (
    <View style={[s.wordChip, { backgroundColor: meta.bg }]}>
      <Text style={[s.wordChipText, { color: meta.fg }]}>{word}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  eyebrowText: { fontSize: 11, fontFamily: fontFamily.bold, letterSpacing: 0.5 },
  actionsRow: { flexDirection: "row", gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontFamily: fontFamily.bold },
  text: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, lineHeight: 26 },
  ipa: { fontSize: fontSize.sm, fontStyle: "italic", lineHeight: 22 },
  translation: { fontSize: fontSize.sm, lineHeight: 20 },
  controlsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  controlBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  warning: { fontSize: fontSize.xs, textAlign: "center" },
  attemptBlock: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  attemptHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  attemptScore: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  wordsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  wordChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  wordChipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  transcript: { fontSize: fontSize.xs, lineHeight: 18 },
});
