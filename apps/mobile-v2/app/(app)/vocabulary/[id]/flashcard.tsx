import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { FocusHeader } from "@/components/FocusHeader";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotResult } from "@/components/MascotStates";
import {
  useVocabTopicDetail,
  useSrsReviewMutation,
  type WordWithState,
} from "@/hooks/use-vocab";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type SrsRating = 1 | 2 | 3 | 4;

const RATINGS: {
  label: string;
  bg: string;
  fg: string;
  shadow: string;
  rating: SrsRating;
}[] = [
  { label: "Quên", bg: "#FFE6E4", fg: "#EA4335", shadow: "#C53030", rating: 1 },
  { label: "Khó", bg: "#FFF0DC", fg: "#FF9B00", shadow: "#D68500", rating: 2 },
  { label: "Nhớ", bg: "#E6F8D4", fg: "#58CC02", shadow: "#47A002", rating: 3 },
  { label: "Dễ", bg: "#DDF4FF", fg: "#1CB0F6", shadow: "#1388CC", rating: 4 },
];

export default function FlashcardScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useVocabTopicDetail(id ?? "");
  const reviewMutation = useSrsReviewMutation(id);

  const [queue, setQueue] = useState<WordWithState[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [score, setScore] = useState(0);

  const words = useMemo(() => queue ?? data?.words ?? [], [queue, data?.words]);
  const total = words.length;
  const current = words[0] ?? null;
  const done = total === 0 && reviewed > 0;
  const progress = total > 0 ? reviewed / (reviewed + total) : 0;

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      if (!current || reviewMutation.isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        await reviewMutation.mutateAsync({ wordId: current.word.id, rating });
      } catch {
        // keep session moving even if request fails
      }

      if (rating >= 3) {
        setScore((s) => s + 1);
      }

      setQueue((prev) => {
        const active = [...(prev ?? data?.words ?? [])];
        const [head, ...rest] = active;
        if (!head) return active;
        return rating === 1 ? [...rest, head] : rest;
      });

      setReviewed((value) => value + 1);
      setRevealed(false);
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
            <DepthCard style={styles.card}>
              <View style={styles.frontSection}>
                <Text style={[styles.wordText, { color: c.foreground }]}>{current.word.word}</Text>
                {current.word.phonetic ? (
                  <Text style={[styles.phoneticText, { color: c.subtle }]}>
                    {current.word.phonetic}
                  </Text>
                ) : null}
                {current.word.partOfSpeech ? (
                  <View style={[styles.posPill, { backgroundColor: c.muted }]}>
                    <Text style={[styles.posText, { color: c.mutedForeground }]}>
                      {current.word.partOfSpeech}
                    </Text>
                  </View>
                ) : null}
              </View>

              {revealed ? (
                <View style={[styles.answerSection, { borderTopColor: c.border }]}>
                  <Text style={[styles.definitionText, { color: c.foreground }]}>
                    {current.word.definition}
                  </Text>
                  {current.word.example ? (
                    <Text style={[styles.exampleText, { color: c.mutedForeground }]}>
                      "{current.word.example}"
                    </Text>
                  ) : null}
                  {current.word.vstepTip ? (
                    <View style={[styles.tipBox, { backgroundColor: c.infoTint }]}>
                      <Text style={[styles.tipText, { color: c.info }]}>
                        {current.word.vstepTip}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.revealWrap}>
                  <DepthButton variant="secondary" onPress={() => setRevealed(true)}>
                    Xem nghĩa
                  </DepthButton>
                </View>
              )}
            </DepthCard>

            {revealed && (
              <View style={styles.ratingBar}>
                {RATINGS.map((item) => (
                  <RatingButton
                    key={item.label}
                    label={item.label}
                    bg={item.bg}
                    fg={item.fg}
                    shadow={item.shadow}
                    disabled={reviewMutation.isPending}
                    onPress={() => handleRate(item.rating)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function RatingButton({
  label,
  bg,
  fg,
  shadow,
  disabled,
  onPress,
}: {
  label: string;
  bg: string;
  fg: string;
  shadow: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ratingBtn,
        {
          backgroundColor: bg,
          borderColor: fg + "40",
          borderBottomColor: pressed ? fg : shadow,
          transform: [{ translateY: pressed ? 3 : 0 }],
          borderBottomWidth: pressed ? 1 : 4,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[styles.ratingBtnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.lg },
  frontSection: { alignItems: "center", gap: spacing.sm },
  wordText: { fontSize: 34, fontFamily: fontFamily.extraBold, textAlign: "center" },
  phoneticText: { fontSize: fontSize.lg },
  posPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  posText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  revealWrap: { alignItems: "center" },
  answerSection: { borderTopWidth: 1, paddingTop: spacing.lg, alignItems: "center", gap: spacing.sm },
  definitionText: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
  exampleText: { fontSize: fontSize.base, fontStyle: "italic", textAlign: "center" },
  tipBox: { width: "100%", padding: spacing.md, borderRadius: radius.lg },
  tipText: { fontSize: fontSize.xs, lineHeight: 18 },
  ratingBar: { flexDirection: "row", gap: spacing.xs },
  ratingBtn: { flex: 1, paddingVertical: spacing.base, borderRadius: radius.button, borderWidth: 2, borderBottomWidth: 4 },
  ratingBtnText: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, textAlign: "center" },
  doneWrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["3xl"] },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
  doneSub: { fontSize: fontSize.sm, textAlign: "center" },
});
