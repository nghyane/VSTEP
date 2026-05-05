import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { FocusHeader } from "@/components/FocusHeader";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotResult } from "@/components/MascotStates";
import { useVocabSrsQueue, useSrsReviewMutation, type WordWithState } from "@/hooks/use-vocab";
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
  const reviewMutation = useSrsReviewMutation();

  const [queue, setQueue] = useState<WordWithState[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [score, setScore] = useState(0);

  const items = useMemo(() => queue ?? data?.items ?? [], [queue, data?.items]);
  const total = items.length;
  const current = items[0] ?? null;
  const done = total === 0 && reviewed > 0;
  const progress = total > 0 ? reviewed / (reviewed + total) : 0;

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      if (!current || reviewMutation.isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        await reviewMutation.mutateAsync({ wordId: current.word.id, rating });
      } catch {
        // keep session moving even if request fails
      }

      if (rating >= 3) {
        setScore((s) => s + 1);
      }

      setQueue((prev) => {
        const active = [...(prev ?? data?.items ?? [])];
        const [head, ...rest] = active;
        if (!head) return active;
        return rating === 1 ? [...rest, head] : rest;
      });

      setReviewed((r) => r + 1);
      setRevealed(false);
    },
    [current, data?.items, reviewMutation],
  );

  if (done) {
    return <MascotResult score={score} total={reviewed} onBack={() => router.back()} />;
  }

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <FocusHeader
        current={reviewed}
        total={reviewed + total}
        accentColor={c.primary}
        onClose={() => router.back()}
        c={c}
      />

      <View style={[s.content, { paddingTop: insets.top + spacing.base }]}>
        {total === 0 ? (
          <View style={s.doneWrap}>
            <Text style={[s.doneTitle, { color: c.foreground }]}>Không có từ cần ôn</Text>
            <DepthButton variant="secondary" onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : current ? (
          <>
            <DepthCard style={s.card}>
              <View style={s.cardCenter}>
                <Text style={[s.wordText, { color: c.foreground }]}>{current.word.word}</Text>
                {current.word.phonetic ? (
                  <Text style={[s.phoneticText, { color: c.subtle }]}>{current.word.phonetic}</Text>
                ) : null}
                {current.word.partOfSpeech ? (
                  <View style={[s.posPill, { backgroundColor: c.muted }]}>
                    <Text style={[s.posText, { color: c.mutedForeground }]}>{current.word.partOfSpeech}</Text>
                  </View>
                ) : null}
              </View>

              {revealed ? (
                <View style={[s.revealSection, { borderTopColor: c.border }]}>
                  <Text style={[s.definitionText, { color: c.foreground }]}>{current.word.definition}</Text>
                  {current.word.example ? (
                    <Text style={[s.exampleText, { color: c.mutedForeground }]}>{current.word.example}</Text>
                  ) : null}
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

            {revealed && (
              <View style={s.ratingRow}>
                {RATINGS.map((r) => (
                  <View key={r.label} style={{ flex: 1 }}>
                    <DepthButton
                      variant="secondary"
                      style={{ backgroundColor: r.bg, borderColor: r.fg + "40", borderBottomColor: r.fg }}
                      onPress={() => handleRate(r.rating)}
                      disabled={reviewMutation.isPending}
                      fullWidth
                    >
                      <Text style={[s.ratingBtnText, { color: r.fg }]}>{r.label}</Text>
                    </DepthButton>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius["2xl"], padding: spacing["2xl"], alignItems: "center" },
  cardCenter: { alignItems: "center", gap: spacing.sm },
  wordText: { fontSize: 32, fontFamily: fontFamily.bold },
  phoneticText: { fontSize: fontSize.base },
  posPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  posText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  revealSection: { borderTopWidth: 1, marginTop: spacing.lg, paddingTop: spacing.lg, alignItems: "center", gap: spacing.sm, width: "100%" },
  definitionText: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, textAlign: "center" },
  exampleText: { fontSize: fontSize.sm, fontStyle: "italic", textAlign: "center" },
  tipBox: { padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.sm, width: "100%" },
  tipText: { fontSize: fontSize.xs, lineHeight: 18 },
  ratingRow: { flexDirection: "row", gap: spacing.sm },
  ratingBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center" },
  doneWrap: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing["3xl"] },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
});
