import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { Mascot } from "@/components/Mascot";
import { MascotEmpty } from "@/components/MascotStates";
import {
  groupVocabTopics,
  recommendedProgress,
  topicFocusLabel,
  useVocabTopics,
  useVocabSrsQueue,
  type TopicGroup,
} from "@/hooks/use-vocab";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function VocabularyScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: topics, isLoading: topicsLoading } = useVocabTopics();
  const { data: srsQueue, isLoading: srsLoading } = useVocabSrsQueue();

  const dueCount = srsQueue ? srsQueue.newCount + srsQueue.learningCount + srsQueue.reviewCount : 0;
  const isLoading = topicsLoading || srsLoading;
  const topicGroups = useMemo(() => groupVocabTopics(topics ?? []), [topics]);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Quay lại</Text>
      </HapticTouchable>

      <Text style={[s.title, { color: c.foreground }]}>Từ vựng</Text>
      <Text style={[s.sub, { color: c.mutedForeground }]}>
        Học từ vựng theo chủ đề với hệ thống lặp lại có giãn cách (SRS).
      </Text>

      {/* SRS Hero */}
      {srsQueue && dueCount > 0 ? (
        <DepthCard style={s.srsCard}>
          <Mascot name="vocabulary" size={92} animation="none" />
          <View style={s.srsCopy}>
            <Text style={[s.srsTitle, { color: c.foreground }]}>Ôn tập từ vựng</Text>
            <Text style={[s.srsSub, { color: c.mutedForeground }]}>Bạn có {dueCount} từ cần ôn lại hôm nay để không bị quên</Text>
            <View style={s.srsButtonWrap}>
              <DepthButton onPress={() => router.push("/(app)/vocabulary/srs-review" as never)}>
                Bắt đầu ôn tập
              </DepthButton>
            </View>
          </View>
        </DepthCard>
      ) : srsQueue && dueCount === 0 ? (
        <DepthCard style={s.srsCard}>
          <Mascot name="vocabulary" size={92} animation="none" />
          <View style={s.srsCopy}>
            <Text style={[s.srsTitle, { color: c.foreground }]}>Tuyệt vời!</Text>
            <Text style={[s.srsSub, { color: c.mutedForeground }]}>Bạn đã ôn xong tất cả từ vựng hôm nay. Hẹn gặp lại vào ngày mai!</Text>
          </View>
        </DepthCard>
      ) : null}

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      {!isLoading && (!topics || topics.length === 0) ? (
        <MascotEmpty
          mascot="think"
          title="Chưa có chủ đề từ vựng"
          subtitle="Hệ thống từ vựng đang được cập nhật. Vui lòng quay lại sau!"
        />
      ) : null}

      {topics && topics.length > 0 ? (
        <View style={s.topicSection}>
          <Text style={[s.sectionTitle, { color: c.foreground }]}>Chủ đề</Text>
          <Text style={[s.sectionSub, { color: c.subtle }]}>Chọn một chủ đề, sau đó lọc cấp độ trong trang chi tiết</Text>

          {topicGroups.length === 0 ? (
            <DepthCard style={s.emptyFilterCard}>
              <Text style={[s.emptyFilterTitle, { color: c.foreground }]}>Chưa có chủ đề nào</Text>
            </DepthCard>
          ) : (
            <View style={s.topicGrid}>
              {topicGroups.map((topic) => {
                const focus = recommendedProgress(topic);
                return (
                  <View key={topic.key} style={s.topicGridItem}>
                    <TopicCard
                      topic={topic}
                      onPress={() => router.push(`/(app)/vocabulary/${focus.topic.id}` as never)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function TopicCard({ topic, onPress }: { topic: TopicGroup; onPress: () => void }) {
  const c = useThemeColors();
  const focus = recommendedProgress(topic);
  const pct = topic.wordCount > 0 ? Math.round((topic.learnedCount / topic.wordCount) * 100) : 0;
  const topicComplete = topic.wordCount > 0 && topic.learnedCount >= topic.wordCount;
  const focusLabel = topicFocusLabel(focus, topicComplete);
  const meta =
    topic.wordCount > 0 ? `${topic.wordCount} từ · ${topic.levels.length} cấp độ` : `${topic.levels.length} cấp độ`;

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.92} scalePress>
      <DepthCard style={s.topicCard}>
        <View style={s.topicHeader}>
          <Text style={[s.topicName, { color: c.foreground }]} numberOfLines={1}>
            {topic.name}
          </Text>
          <View style={[s.levelBadge, { backgroundColor: c.muted }]}>
            <Text style={[s.levelText, { color: c.mutedForeground }]}>{pct}%</Text>
          </View>
        </View>

        <Text style={[s.topicMeta, { color: c.mutedForeground }]} numberOfLines={1}>
          {meta}
        </Text>

        <View style={s.focusBlock}>
          <Text style={[s.focusLabel, { color: c.subtle }]}>{focusLabel}</Text>
          <Text style={[s.focusText, { color: c.foreground }]} numberOfLines={1}>
            {topicComplete
              ? "Ôn lại khi cần"
              : `${focus.level} · ${focusProgressText(focus.learnedCount, focus.wordCount)}`}
          </Text>
        </View>

        <View style={s.progressSection}>
          <View style={s.progressLabelRow}>
            <Text style={[s.progressLabel, { color: c.subtle }]}>Tổng chủ đề</Text>
            <Text style={[s.progressPct, { color: c.mutedForeground }]}>
              {topic.learnedCount}/{topic.wordCount} từ
            </Text>
          </View>
          <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
            <View style={[s.progressFill, { backgroundColor: c.primary, width: `${pct}%` }]} />
          </View>
        </View>
      </DepthCard>
    </HapticTouchable>
  );
}

function focusProgressText(learned: number, total: number): string {
  if (total <= 0) return "Chưa có từ";
  if (learned <= 0) return "Chưa học";
  return `${learned}/${total} từ`;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, lineHeight: 20 },

  // SRS Hero
  srsCard: { flexDirection: "row", alignItems: "center", gap: spacing.lg, padding: spacing.lg },
  srsCopy: { flex: 1, gap: spacing.xs, alignItems: "flex-start" },
  srsTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  srsSub: { fontSize: fontSize.sm, lineHeight: 20 },
  srsButtonWrap: { marginTop: spacing.sm, alignSelf: "flex-start" },

  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },

  // Topic grid
  topicSection: { gap: spacing.xs },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  sectionSub: { fontSize: fontSize.sm, marginBottom: spacing.md },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  topicGridItem: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  emptyFilterCard: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xl },
  emptyFilterTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, textAlign: "center" },
  emptyFilterSub: { fontSize: fontSize.sm, textAlign: "center" },
  topicCard: { gap: spacing.xs, minHeight: 168 },
  topicHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicName: { fontSize: fontSize.base, fontFamily: fontFamily.bold, flex: 1 },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, marginLeft: spacing.sm },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  topicMeta: { fontSize: fontSize.xs, lineHeight: 16, minHeight: 16 },
  focusBlock: { marginTop: spacing.sm, gap: 2 },
  focusLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  focusText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },

  // Progress bar (FE v3 style)
  progressSection: { marginTop: "auto", paddingTop: spacing.sm },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  progressPct: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  progressTrack: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: radius.full },
});
