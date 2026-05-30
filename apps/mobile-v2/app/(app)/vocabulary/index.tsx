import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { LevelFilters, type Level } from "@/components/LevelFilters";
import { MascotEmpty } from "@/components/MascotStates";
import { useVocabTopics, useVocabSrsQueue, type VocabTopic } from "@/hooks/use-vocab";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function VocabularyScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: topics, isLoading: topicsLoading } = useVocabTopics();
  const { data: srsQueue, isLoading: srsLoading } = useVocabSrsQueue();
  const [level, setLevel] = useState<Level | null>(null);

  const dueCount = srsQueue ? srsQueue.newCount + srsQueue.learningCount + srsQueue.reviewCount : 0;
  const isLoading = topicsLoading || srsLoading;
  const filteredTopics = useMemo(() => {
    const allTopics = topics ?? [];
    if (!level) return allTopics;
    return allTopics.filter((topic) => topic.level.toUpperCase() === level);
  }, [level, topics]);

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
        <DepthCard variant="primary" style={s.srsCard}>
          <GameIcon name="lightning" size={32} />
          <Text style={[s.srsTitle, { color: c.primaryDark }]}>Ôn tập hôm nay</Text>
          <View style={s.srsStats}>
            {srsQueue.newCount > 0 ? (
              <View style={[s.srsPill, { backgroundColor: c.infoTint }]}>
                <Text style={[s.srsPillText, { color: c.info }]}>{srsQueue.newCount} mới</Text>
              </View>
            ) : null}
            {srsQueue.learningCount > 0 ? (
              <View style={[s.srsPill, { backgroundColor: c.warningTint }]}>
                <Text style={[s.srsPillText, { color: c.warning }]}>{srsQueue.learningCount} đang học</Text>
              </View>
            ) : null}
            {srsQueue.reviewCount > 0 ? (
              <View style={[s.srsPill, { backgroundColor: c.primaryTint }]}>
                <Text style={[s.srsPillText, { color: c.primary }]}>{srsQueue.reviewCount} ôn tập</Text>
              </View>
            ) : null}
          </View>
          <DepthButton fullWidth onPress={() => router.push("/(app)/vocabulary/srs-review" as any)}>
            {`Bắt đầu · ${dueCount} từ`}
          </DepthButton>
        </DepthCard>
      ) : srsQueue && dueCount === 0 ? (
        <DepthCard style={s.srsCard}>
          <GameIcon name="check" size={32} />
          <Text style={[s.srsTitle, { color: c.foreground }]}>Hôm nay đã ôn xong!</Text>
          <Text style={[s.srsSub, { color: c.mutedForeground }]}>
            Quay lại vào ngày mai hoặc chọn chủ đề mới bên dưới.
          </Text>
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
          <Text style={[s.sectionSub, { color: c.subtle }]}>Chọn chủ đề để học từ mới</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterWrap}>
            <LevelFilters level={level} onLevelChange={setLevel} />
          </ScrollView>

          {filteredTopics.length === 0 ? (
            <DepthCard style={s.emptyFilterCard}>
              <Text style={[s.emptyFilterTitle, { color: c.foreground }]}>Không có chủ đề phù hợp</Text>
              <Text style={[s.emptyFilterSub, { color: c.mutedForeground }]}>Thử đổi level để xem thêm chủ đề khác.</Text>
            </DepthCard>
          ) : (
            <View style={s.topicGrid}>
              {filteredTopics.map((topic) => (
                <View key={topic.id} style={s.topicGridItem}>
                  <TopicCard
                    topic={topic}
                    onPress={() => router.push(`/(app)/vocabulary/${topic.id}` as any)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function TopicCard({ topic, onPress }: { topic: VocabTopic; onPress: () => void }) {
  const c = useThemeColors();
  const learned = topic.learnedCount ?? 0;
  const total = topic.wordCount ?? 0;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
  const meta = topic.tasks.join(" · ") || "Từ vựng";

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.85}>
      <DepthCard style={s.topicCard}>
        <View style={s.topicHeader}>
          <Text style={[s.topicName, { color: c.foreground }]} numberOfLines={1}>
            {topic.name}
          </Text>
          <View style={[s.levelBadge, { backgroundColor: c.primaryTint }]}>
            <Text style={[s.levelText, { color: c.primary }]}>{topic.level}</Text>
          </View>
        </View>

        {topic.description ? (
          <Text style={[s.topicDesc, { color: c.subtle }]} numberOfLines={2}>
            {topic.description}
          </Text>
        ) : null}

        <Text style={[s.topicMeta, { color: c.mutedForeground }]} numberOfLines={1}>
          {meta}
        </Text>

        {/* Progress bar — matching FE v3 */}
        {total > 0 ? (
          <View style={s.progressSection}>
            <View style={s.progressLabelRow}>
              <Text style={[s.progressLabel, { color: c.subtle }]}>
                {learned}/{total} từ
              </Text>
              <Text style={[s.progressPct, { color: c.mutedForeground }]}>{pct}%</Text>
            </View>
            <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
              <View
                style={[s.progressFill, { backgroundColor: c.primary, width: `${pct}%` }]}
              />
            </View>
          </View>
        ) : null}
      </DepthCard>
    </HapticTouchable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, lineHeight: 20 },

  // SRS Hero
  srsCard: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  srsTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  srsSub: { fontSize: fontSize.sm, textAlign: "center" },
  srsStats: { flexDirection: "row", gap: spacing.md },
  srsPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  srsPillText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },

  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },

  // Topic grid
  topicSection: { gap: spacing.xs },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  sectionSub: { fontSize: fontSize.sm, marginBottom: spacing.md },
  filterWrap: { paddingBottom: spacing.sm },
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
  topicCard: { gap: spacing.xs, minHeight: 138 },
  topicHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicName: { fontSize: fontSize.base, fontFamily: fontFamily.bold, flex: 1 },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, marginLeft: spacing.sm },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  topicDesc: { fontSize: fontSize.sm, lineHeight: 18, minHeight: 36 },
  topicMeta: { fontSize: fontSize.xs, lineHeight: 16, minHeight: 16 },

  // Progress bar (FE v3 style)
  progressSection: { marginTop: "auto", paddingTop: spacing.sm },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  progressPct: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  progressTrack: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: radius.full },
});
