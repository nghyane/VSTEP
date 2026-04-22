import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { Mascot } from "@/components/Mascot";
import { MascotEmpty } from "@/components/MascotStates";
import { useVocabTopics, useVocabSrsQueue } from "@/hooks/use-vocab";
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

      {/* SRS summary */}
      {srsQueue && dueCount > 0 ? (
        <DepthCard variant="primary" style={s.srsCard}>
          <View style={s.srsRow}>
            <GameIcon name="lightning" size={24} />
            <View style={{ flex: 1 }}>
              <Text style={[s.srsTitle, { color: c.primaryDark }]}>
                {dueCount} từ cần ôn hôm nay
              </Text>
              <Text style={[s.srsSub, { color: c.primaryDark + "99" }]}>
                {srsQueue.newCount} mới · {srsQueue.learningCount} đang học · {srsQueue.reviewCount} ôn lại
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.primaryDark} />
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

      {/* Topic list */}
      {topics && topics.length > 0 ? (
        <View style={s.topicList}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>CHỦ ĐỀ</Text>
          {topics.map((topic) => (
            <HapticTouchable
              key={topic.id}
              style={[s.topicRow, { borderBottomColor: c.borderLight }]}
              activeOpacity={0.7}
            >
              <View style={[s.topicIcon, { backgroundColor: c.primaryTint }]}>
                <GameIcon name="book" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.topicName, { color: c.foreground }]}>{topic.name}</Text>
                {topic.description ? (
                  <Text style={[s.topicDesc, { color: c.mutedForeground }]} numberOfLines={1}>
                    {topic.description}
                  </Text>
                ) : null}
              </View>
              <View style={s.topicMeta}>
                {topic.wordCount != null ? (
                  <Text style={[s.topicCount, { color: c.subtle }]}>{topic.wordCount} từ</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={14} color={c.subtle} />
              </View>
            </HapticTouchable>
          ))}
        </View>
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, lineHeight: 20 },
  srsCard: { padding: spacing.lg },
  srsRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  srsTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  srsSub: { fontSize: fontSize.xs, marginTop: 2 },
  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },
  topicList: { gap: 0 },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.sm },
  topicRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.base, borderBottomWidth: 1 },
  topicIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  topicName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  topicDesc: { fontSize: fontSize.xs, marginTop: 2 },
  topicMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  topicCount: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
});
