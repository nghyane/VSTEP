// WritingReviewSheet — inline AI grading review using BottomSheet.
// Mirrors apps/frontend-v3/src/features/practice/components/WritingReviewPopup.tsx
// - Polls `useWritingGradingResult` every 5s (handled by the hook itself).
// - Pending state: 3 bouncing dots + "AI đang chấm bài..." subtitle.
// - Result state: overall band (large) + rubric bars + strengths + improvements
//   + rewrites + nút "Xem chi tiết đầy đủ" để navigate sang grading screen.
import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/components/BottomSheet";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useWritingGradingResult } from "@/hooks/use-practice";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

const RUBRIC_LABELS: Record<string, string> = {
  taskAchievement: "Task Achievement",
  coherence: "Coherence & Cohesion",
  lexical: "Lexical Resource",
  grammar: "Grammar Range & Accuracy",
};

interface Props {
  visible: boolean;
  submissionId: string;
  onClose: () => void;
}

export function WritingReviewSheet({ visible, submissionId, onClose }: Props) {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useWritingGradingResult(submissionId);
  const ready = data?.overallBand != null;
  const accent = c.skillWriting;

  function handleViewDetail() {
    onClose();
    router.push(`/(app)/grading/writing/${submissionId}` as never);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[s.header, { borderBottomColor: c.borderLight }]}>
        <Text style={[s.title, { color: c.foreground }]}>Kết quả chấm bài</Text>
        <HapticTouchable onPress={onClose} style={s.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {!ready && !isError ? <PendingDots accent={accent} /> : null}

        {isError ? (
          <View style={s.errorWrap}>
            <Text style={[s.errorText, { color: c.destructive }]}>Không thể tải kết quả.</Text>
            <DepthButton variant="secondary" onPress={() => refetch()} disabled={isFetching}>
              {isFetching ? "Đang thử lại..." : "Thử lại"}
            </DepthButton>
          </View>
        ) : null}

        {ready && data ? (
          <>
            <View style={s.scoreWrap}>
              <Text style={[s.scoreValue, { color: accent }]}>
                {(data.overallBand ?? 0).toFixed(1)}
              </Text>
              <Text style={[s.scoreMax, { color: c.mutedForeground }]}>/ 10</Text>
            </View>

            {data.rubricScores ? (
              <View style={s.rubricList}>
                {Object.entries(data.rubricScores).map(([key, score]) => (
                  <RubricBar
                    key={key}
                    label={RUBRIC_LABELS[key] ?? key}
                    score={score}
                    max={4}
                    color={accent}
                  />
                ))}
              </View>
            ) : null}

            {data.strengths.length > 0 ? (
              <Section label="Điểm mạnh">
                {data.strengths.map((item) => (
                  <View key={item} style={s.feedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={accent} />
                    <Text style={[s.feedText, { color: c.foreground }]}>{item}</Text>
                  </View>
                ))}
              </Section>
            ) : null}

            {data.improvements.length > 0 ? (
              <Section label="Cần cải thiện">
                {data.improvements.map((item) => (
                  <View key={`${item.message}-${item.explanation}`} style={s.impBlock}>
                    <Text style={[s.impMsg, { color: c.foreground }]}>{item.message}</Text>
                    {item.explanation ? (
                      <Text style={[s.impExp, { color: c.mutedForeground }]}>{item.explanation}</Text>
                    ) : null}
                  </View>
                ))}
              </Section>
            ) : null}

            <DepthButton variant="secondary" fullWidth onPress={handleViewDetail}>
              Xem chi tiết đầy đủ
            </DepthButton>
          </>
        ) : null}

        {/* Always show a fallback "Xem chi tiết" while pending so user can opt-out into full screen */}
        {!ready && !isError && !isLoading ? (
          <DepthButton variant="secondary" fullWidth onPress={handleViewDetail}>
            Xem chi tiết đầy đủ
          </DepthButton>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

function PendingDots({ accent }: { accent: string }) {
  const c = useThemeColors();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(value, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    for (const animation of animations) animation.start();
    return () => {
      for (const animation of animations) animation.stop();
    };
    // dots are stable refs; effect runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={s.pendingWrap}>
      <View style={s.dotsRow}>
        {dots.map((value, index) => (
          <Animated.View
            key={`dot-${index}`}
            style={[
              s.dot,
              {
                backgroundColor: accent,
                transform: [
                  {
                    translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      <Text style={[s.pendingTitle, { color: c.mutedForeground }]}>AI đang chấm bài...</Text>
      <Text style={[s.pendingSub, { color: c.subtle }]}>Thường mất 10–30 giây</Text>
    </View>
  );
}

function RubricBar({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  const c = useThemeColors();
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <View style={s.rubricRow}>
      <View style={s.rubricLabelRow}>
        <Text style={[s.rubricLabel, { color: c.foreground }]}>{label}</Text>
        <Text style={[s.rubricScore, { color }]}>{score}/{max}</Text>
      </View>
      <View style={[s.rubricTrack, { backgroundColor: c.muted }]}>
        <View style={[s.rubricFill, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View style={s.section}>
      <Text style={[s.sectionLabel, { color: c.subtle }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  closeBtn: { padding: spacing.xs },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  pendingWrap: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing["2xl"] },
  dotsRow: { flexDirection: "row", gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pendingTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  pendingSub: { fontSize: fontSize.xs },
  errorWrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  errorText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  scoreWrap: { alignItems: "center", paddingVertical: spacing.sm },
  scoreValue: { fontSize: 48, fontFamily: fontFamily.extraBold, lineHeight: 56 },
  scoreMax: { fontSize: fontSize.xs },
  rubricList: { gap: spacing.sm },
  rubricRow: { gap: spacing.xs },
  rubricLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rubricLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  rubricScore: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  rubricTrack: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  rubricFill: { height: "100%", borderRadius: radius.full },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  feedRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  feedText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  impBlock: { gap: spacing.xs },
  impMsg: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  impExp: { fontSize: fontSize.xs, lineHeight: 18 },
});
