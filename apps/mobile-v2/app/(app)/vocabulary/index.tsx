import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { MascotEmpty } from "@/components/MascotStates";
import { useVocabTopics, useVocabSrsQueue, type VocabTopic } from "@/hooks/use-vocab";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function VocabularyScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: topics, isLoading: topicsLoading } = useVocabTopics();
  const { data: srsQueue, isLoading: srsLoading } = useVocabSrsQueue();

  const dueCount = srsQueue ? srsQueue.newCount + srsQueue.learningCount + srsQueue.reviewCount : 0;
  const isLoading = topicsLoading || srsLoading;

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

      {/* SRS Hero — ôn tập hôm nay */}
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
          <DepthButton fullWidth onPress={() => {}}>
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

      {/* Topic Grid */}
      {topics && topics.length > 0 ? (
        <View style={s.topicSection}>
          <Text style={[s.sectionTitle, { color: c.foreground }]}>Chủ đề</Text>
          <Text style={[s.sectionSub, { color: c.subtle }]}>Chọn chủ đề để học từ mới</Text>
          <View style={s.topicGrid}>
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onPress={() => router.push(`/(app)/vocabulary/${topic.id}` as any)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function TopicCard({ topic, onPress }: { topic: VocabTopic; onPress: () => void }) {
  const c = useThemeColors();

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.85}>
      <DepthCard style={s.topicCard}>
        <View style={s.topicHeader}>
          <Text style={[s.topicName, { color: c.foreground }]} numberOfLines={1}>{topic.name}</Text>
          <View style={[s.levelBadge, { backgroundColor: c.primaryTint }]}>
            <Text style={[s.levelText, { color: c.primary }]}>{topic.level}</Text>
          </View>
        </View>

        {topic.description ? (
          <Text style={[s.topicDesc, { color: c.subtle }]} numberOfLines={2}>{topic.description}</Text>
        ) : null}

        {topic.tasks.length > 0 ? (
          <View style={s.taskRow}>
            {topic.tasks.map((task) => (
              <View key={task} style={[s.taskPill, { backgroundColor: c.muted }]}>
                <Text style={[s.taskText, { color: c.mutedForeground }]}>{task}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {topic.wordCount != null ? (
          <Text style={[s.wordCount, { color: c.subtle }]}>{topic.wordCount} từ</Text>
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
  topicGrid: { gap: spacing.sm },
  topicCard: { gap: spacing.sm },
  topicHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicName: { fontSize: fontSize.base, fontFamily: fontFamily.bold, flex: 1 },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, marginLeft: spacing.sm },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  topicDesc: { fontSize: fontSize.sm, lineHeight: 20 },
  taskRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  taskPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  taskText: { fontSize: 10, fontFamily: fontFamily.medium },
  wordCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
