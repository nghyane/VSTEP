import { StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { useVocabularyTopics, useTopicProgress } from "@/hooks/use-vocabulary";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { VocabularyTopic } from "@/types/api";

export default function VocabularyScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useVocabularyTopics();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const topics = data?.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="Học từ vựng" />
      <BouncyScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {topics.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="Chưa có chủ đề nào"
            subtitle="Các chủ đề từ vựng sẽ sớm được cập nhật"
          />
        ) : (
          <View style={styles.list}>
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onPress={() => router.push(`/(app)/vocabulary/${topic.id}`)}
              />
            ))}
          </View>
        )}
      </BouncyScrollView>
    </View>
  );
}

function TopicCard({ topic, onPress }: { topic: VocabularyTopic; onPress: () => void }) {
  const c = useThemeColors();
  const { data: progress } = useTopicProgress(topic.id);
  const learned = progress?.knownCount ?? 0;
  const total = topic.wordCount;
  const ratio = total > 0 ? learned / total : 0;
  const done = learned > 0 && learned === total;

  return (
    <HapticTouchable
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: done ? c.success + "18" : c.primary + "18" }]}>
        <Ionicons name={done ? "checkmark-circle" : "book-outline"} size={20} color={done ? c.success : c.primary} />
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: c.foreground }]}>{topic.name}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={[styles.cardMeta, { color: c.mutedForeground }]}>{total} từ</Text>
          {learned > 0 ? (
            <Text style={[styles.cardMeta, { color: done ? c.success : c.primary }]}>
              · {learned}/{total} đã biết
            </Text>
          ) : null}
        </View>
        {total > 0 ? (
          <View style={[styles.miniProgressBg, { backgroundColor: c.muted }]}>
            <View style={[styles.miniProgressFill, { backgroundColor: done ? c.success : c.primary, width: `${ratio * 100}%` }]} />
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  list: { gap: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  cardName: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMeta: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  miniProgressBg: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 2 },
  miniProgressFill: { height: 4, borderRadius: 2 },
});
