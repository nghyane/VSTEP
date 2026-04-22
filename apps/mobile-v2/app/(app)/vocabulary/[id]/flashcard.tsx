import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { useVocabTopicDetail, type WordWithState } from "@/hooks/use-vocab";
import { api } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type SrsRating = 1 | 2 | 3 | 4;

const RATINGS: { label: string; bg: string; fg: string; rating: SrsRating }[] = [
  { label: "Quên", bg: "#FFE6E4", fg: "#EA4335", rating: 1 },
  { label: "Khó", bg: "#FFF0DC", fg: "#FF9B00", rating: 2 },
  { label: "Nhớ", bg: "#E6F8D4", fg: "#58CC02", rating: 3 },
  { label: "Dễ", bg: "#DDF4FF", fg: "#1CB0F6", rating: 4 },
];

export default function FlashcardScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useVocabTopicDetail(id ?? "");

  const [queue, setQueue] = useState<WordWithState[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const words = useMemo(() => queue ?? data?.words ?? [], [queue, data?.words]);
  const current = words[0] ?? null;
  const total = words.length;
  const progress = total > 0 ? reviewed / (reviewed + total) : 1;

  const handleRate = useCallback(async (rating: SrsRating) => {
    if (!current || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    try {
      await api.post("/api/v1/vocab/srs/review", { wordId: current.word.id, rating });
    } catch {
      // keep session moving even if request fails
    }

    setQueue((prev) => {
      const active = [...(prev ?? data?.words ?? [])];
      const [head, ...rest] = active;
      if (!head) return active;
      return rating === 1 ? [...rest, head] : rest;
    });
    setReviewed((value) => value + 1);
    setRevealed(false);
    setSubmitting(false);
  }, [current, data?.words, submitting]);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.focusBar, { paddingTop: insets.top + spacing.sm }]}>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={c.foreground} />
        </HapticTouchable>
        <View style={[styles.track, { backgroundColor: c.muted }]}>
          <View style={[styles.fill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.counter, { color: c.subtle }]}>{reviewed}/{reviewed + total}</Text>
      </View>

      <View style={styles.content}>
        {!current ? (
          <View style={styles.doneWrap}>
            <Ionicons name="checkmark-circle" size={56} color={c.success} />
            <Text style={[styles.doneTitle, { color: c.foreground }]}>Bạn đã ôn xong!</Text>
            <Text style={[styles.doneSub, { color: c.mutedForeground }]}>{`Bạn đã ôn xong ${reviewed} lượt.`}</Text>
            <DepthButton onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : (
          <View style={styles.stack}>
            <DepthCard style={styles.card}>
              <View style={styles.frontSection}>
                <Text style={[styles.word, { color: c.foreground }]}>{current.word.word}</Text>
                {current.word.phonetic ? <Text style={[styles.phonetic, { color: c.subtle }]}>{current.word.phonetic}</Text> : null}
                {current.word.partOfSpeech ? (
                  <View style={[styles.posPill, { backgroundColor: c.muted }]}>
                    <Text style={[styles.posText, { color: c.mutedForeground }]}>{current.word.partOfSpeech}</Text>
                  </View>
                ) : null}
              </View>

              {revealed ? (
                <View style={[styles.answerSection, { borderTopColor: c.border }]}> 
                  <Text style={[styles.definition, { color: c.foreground }]}>{current.word.definition}</Text>
                  {current.word.example ? <Text style={[styles.example, { color: c.mutedForeground }]}>{`"${current.word.example}"`}</Text> : null}
                  {current.word.vstepTip ? (
                    <View style={[styles.tipBox, { backgroundColor: c.infoTint }]}> 
                      <Text style={[styles.tipText, { color: c.info }]}>{current.word.vstepTip}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.revealWrap}>
                  <DepthButton variant="secondary" onPress={() => setRevealed(true)}>Xem nghĩa</DepthButton>
                </View>
              )}
            </DepthCard>

            {revealed ? (
              <View style={styles.ratingGrid}>
                {RATINGS.map((item) => (
                  <HapticTouchable
                    key={item.label}
                    style={[styles.ratingButton, { backgroundColor: item.bg, opacity: submitting ? 0.5 : 1 }]}
                    onPress={() => handleRate(item.rating)}
                    disabled={submitting}
                  >
                    <Text style={[styles.ratingText, { color: item.fg }]}>{item.label}</Text>
                  </HapticTouchable>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  focusBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  track: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.full },
  counter: { minWidth: 44, textAlign: "right", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  stack: { gap: spacing.lg },
  card: { padding: spacing.xl, gap: spacing.lg },
  frontSection: { alignItems: "center", gap: spacing.sm },
  word: { fontSize: 34, fontFamily: fontFamily.extraBold, textAlign: "center" },
  phonetic: { fontSize: fontSize.lg },
  posPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  posText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  revealWrap: { alignItems: "center" },
  answerSection: { borderTopWidth: 1, paddingTop: spacing.lg, alignItems: "center", gap: spacing.sm },
  definition: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
  example: { fontSize: fontSize.base, fontStyle: "italic", textAlign: "center" },
  tipBox: { width: "100%", padding: spacing.md, borderRadius: radius.lg },
  tipText: { fontSize: fontSize.xs, lineHeight: 18 },
  ratingGrid: { flexDirection: "row", gap: spacing.sm },
  ratingButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: radius.button },
  ratingText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  doneWrap: { alignItems: "center", gap: spacing.md },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  doneSub: { fontSize: fontSize.sm, textAlign: "center" },
});
