// Topic flashcard session — SRS review within a specific vocab topic.
// Mirrors srs-review screen but scoped to topic words. Shares SrsFlipCard
// and SrsRatingButtons primitives.
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { DepthButton } from "@/components/DepthButton";
import { FocusHeader } from "@/components/FocusHeader";
import { MascotResult } from "@/components/MascotStates";
import { SrsFlipCard } from "@/components/SrsFlipCard";
import { SrsRatingButtons, type SrsRating } from "@/components/SrsRatingButtons";
import { useVocabTopicDetail, useSrsReviewMutation, type WordWithState } from "@/hooks/use-vocab";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

export default function FlashcardScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useVocabTopicDetail(id ?? "");
  const reviewMutation = useSrsReviewMutation(id);

  const [queue, setQueue] = useState<WordWithState[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [score, setScore] = useState(0);

  const words = useMemo(() => queue ?? data?.words ?? [], [queue, data?.words]);
  const total = words.length;
  const current = words[0] ?? null;
  const done = total === 0 && reviewed > 0;

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      if (!current || reviewMutation.isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        await reviewMutation.mutateAsync({ wordId: current.word.id, rating });
      } catch {
        // keep session moving even if request fails
      }

      if (rating >= 3) setScore((value) => value + 1);

      setQueue((prev) => {
        const active = [...(prev ?? data?.words ?? [])];
        const [head, ...rest] = active;
        if (!head) return active;
        return rating === 1 ? [...rest, head] : rest;
      });

      setReviewed((value) => value + 1);
      setFlipped(false);
    },
    [current, data?.words, reviewMutation],
  );

  if (done) {
    return (
      <MascotResult
        score={score}
        total={reviewed}
        onBack={() => router.back()}
        backLabel="Quay lai"
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <FocusHeader
        current={reviewed}
        total={reviewed + total}
        accentColor={c.primary}
        onClose={() => router.back()}
        c={c}
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
        {!current ? (
          <View style={styles.doneWrap}>
            <Text style={[styles.doneTitle, { color: c.foreground }]}>Không có từ nào</Text>
            <Text style={[styles.doneSub, { color: c.mutedForeground }]}>
              {reviewed > 0 ? `Bạn đã ôn xong ${reviewed} lượt.` : "Chủ đề này chưa có từ vựng."}
            </Text>
            <DepthButton onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : (
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  doneWrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["3xl"] },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
  doneSub: { fontSize: fontSize.sm, textAlign: "center" },
});
