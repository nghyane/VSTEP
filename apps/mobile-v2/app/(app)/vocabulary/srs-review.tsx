import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { useVocabSrsQueue, type WordWithState } from "@/hooks/use-vocab";
import { api } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type SrsRating = 1 | 2 | 3 | 4;

const RATINGS: { label: string; bg: string; fg: string; rating: SrsRating }[] = [
  { label: "Quên", bg: "#FFE6E4", fg: "#EA4335", rating: 1 },
  { label: "Khó", bg: "#FFF0DC", fg: "#FF9B00", rating: 2 },
  { label: "Nhớ", bg: "#E6F8D4", fg: "#58CC02", rating: 3 },
  { label: "Dễ", bg: "#DDF4FF", fg: "#1CB0F6", rating: 4 },
];

export default function SrsReviewScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useVocabSrsQueue();

  const [queue, setQueue] = useState<WordWithState[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const items = useMemo(() => queue ?? data?.items ?? [], [queue, data?.items]);
  const total = items.length;
  const current = items[0] ?? null;
  const done = total === 0 && reviewed > 0;
  const progress = total > 0 ? reviewed / (reviewed + total) : 1;

  const handleRate = useCallback(async (rating: SrsRating) => {
    if (!current || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    try {
      await api.post("/api/v1/vocab/srs/review", { wordId: current.word.id, rating });
    } catch {
      // ignore and continue
    }
    setQueue((prev) => {
      const active = [...(prev ?? data?.items ?? [])];
      const [head, ...rest] = active;
      if (!head) return active;
      return rating === 1 ? [...rest, head] : rest;
    });
    setSubmitting(false);
    setRevealed(false);
    setReviewed((r) => r + 1);
  }, [current, submitting, data?.items]);

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.focusBar, { paddingTop: insets.top + spacing.sm }]}>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={c.foreground} />
        </HapticTouchable>
        <View style={[s.barTrack, { backgroundColor: c.muted }]}>
          <View style={[s.barFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[s.barCount, { color: c.subtle }]}>{reviewed}/{reviewed + total}</Text>
      </View>

      <View style={s.content}>
        {total === 0 ? (
          <View style={s.doneWrap}>
            <Ionicons name="checkmark-circle" size={56} color={c.success} />
            <Text style={[s.doneTitle, { color: c.foreground }]}>Hôm nay đã ôn xong!</Text>
            <DepthButton variant="secondary" onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : done ? (
          <View style={s.doneWrap}>
            <Ionicons name="checkmark-circle" size={56} color={c.success} />
            <Text style={[s.doneTitle, { color: c.foreground }]}>{`Bạn đã ôn xong ${reviewed} lượt hôm nay.`}</Text>
            <DepthButton onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : current ? (
          <View style={s.cardWrap}>
            <HapticTouchable onPress={() => !revealed && setRevealed(true)} activeOpacity={0.9}>
            <DepthCard style={s.flashcard}>
              <View style={s.cardCenter}>
                <Text style={[s.wordBig, { color: c.foreground }]}>{current.word.word}</Text>
                {current.word.phonetic ? <Text style={[s.phonetic, { color: c.subtle }]}>{current.word.phonetic}</Text> : null}
                {current.word.partOfSpeech ? (
                  <View style={[s.posPill, { backgroundColor: c.muted }]}>
                    <Text style={[s.posText, { color: c.mutedForeground }]}>{current.word.partOfSpeech}</Text>
                  </View>
                ) : null}
              </View>

              {revealed ? (
                <View style={[s.revealSection, { borderTopColor: c.border }]}>
                  <Text style={[s.definition, { color: c.foreground }]}>{current.word.definition}</Text>
                  {current.word.example ? <Text style={[s.example, { color: c.mutedForeground }]}>{`"${current.word.example}"`}</Text> : null}
                  {current.word.vstepTip ? (
                    <View style={[s.tipBox, { backgroundColor: c.infoTint }]}>
                      <Text style={[s.tipText, { color: c.info }]}>{current.word.vstepTip}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <DepthButton variant="secondary" onPress={() => setRevealed(true)} style={{ marginTop: spacing.lg }}>
                  Xem nghĩa
                </DepthButton>
              )}
            </DepthCard>
            </HapticTouchable>

            {revealed ? (
              <View style={s.ratingRow}>
                {RATINGS.map((r) => (
                  <HapticTouchable
                    key={r.label}
                    style={[s.ratingBtn, { backgroundColor: r.bg, opacity: submitting ? 0.5 : 1 }]}
                    onPress={() => handleRate(r.rating)}
                    disabled={submitting}
                  >
                    <Text style={[s.ratingLabel, { color: r.fg }]}>{r.label}</Text>
                  </HapticTouchable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  focusBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  barTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  barFill: { height: 8, borderRadius: radius.full },
  barCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 36, textAlign: "right" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  cardWrap: { gap: spacing.lg },
  flashcard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius["2xl"], padding: spacing["2xl"], alignItems: "center" },
  cardCenter: { alignItems: "center", gap: spacing.sm },
  wordBig: { fontSize: 32, fontFamily: fontFamily.bold },
  phonetic: { fontSize: fontSize.base },
  posPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  posText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  revealSection: { borderTopWidth: 1, marginTop: spacing.lg, paddingTop: spacing.lg, alignItems: "center", gap: spacing.sm, width: "100%" },
  definition: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, textAlign: "center" },
  example: { fontSize: fontSize.sm, fontStyle: "italic", textAlign: "center" },
  tipBox: { padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.sm, width: "100%" },
  tipText: { fontSize: fontSize.xs, lineHeight: 18 },
  ratingRow: { flexDirection: "row", gap: spacing.sm },
  ratingBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.base, borderRadius: radius.lg, borderWidth: 2, borderBottomWidth: 4, borderColor: "transparent" },
  ratingLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  doneWrap: { alignItems: "center", gap: spacing.lg },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
});
