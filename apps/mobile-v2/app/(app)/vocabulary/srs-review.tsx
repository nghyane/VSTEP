// SRS review session — global queue of due words across all topics.
// Mirrors apps/frontend-v3/src/routes/_focused/vocab/srs-review.tsx
// Uses SrsFlipCard (3D flip) + SrsRatingButtons (4-way quality rating).
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { FocusHeader } from "@/components/FocusHeader";
import { DepthButton } from "@/components/DepthButton";
import { MascotResult } from "@/components/MascotStates";
import { SrsFlipCard } from "@/components/SrsFlipCard";
import { SrsRatingButtons, type SrsRating } from "@/components/SrsRatingButtons";
import { useVocabSrsQueue, useSrsReviewMutation, type WordWithState } from "@/hooks/use-vocab";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

export default function SrsReviewScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useVocabSrsQueue();
  const reviewMutation = useSrsReviewMutation();

  const [queue, setQueue] = useState<WordWithState[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [score, setScore] = useState(0);

  const items = useMemo(() => queue ?? data?.items ?? [], [queue, data?.items]);
  const total = items.length;
  const current = items[0] ?? null;
  const done = total === 0 && reviewed > 0;

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      if (!current || reviewMutation.isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        await reviewMutation.mutateAsync({ wordId: current.word.id, rating });
      } catch {
        // keep session moving even if request fails
      }

      if (rating >= 3) setScore((value) => value + 1);

      setQueue((prev) => {
        const active = [...(prev ?? data?.items ?? [])];
        const [head, ...rest] = active;
        if (!head) return active;
        return rating === 1 ? [...rest, head] : rest;
      });

      setReviewed((value) => value + 1);
      setFlipped(false);
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
          <View style={s.emptyWrap}>
            <Text style={[s.emptyTitle, { color: c.foreground }]}>Không có từ cần ôn</Text>
            <DepthButton variant="secondary" onPress={() => router.back()}>
              Quay lại
            </DepthButton>
          </View>
        ) : current ? (
          <>
            <SrsFlipCard
              word={current.word}
              flipped={flipped}
              onFlip={() => setFlipped((v) => !v)}
            />

            {flipped ? (
              <SrsRatingButtons disabled={reviewMutation.isPending} onRate={handleRate} />
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  emptyWrap: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing["3xl"] },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
});
