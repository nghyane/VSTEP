import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { useVocabTopics, useVocabSrsQueue } from "@/hooks/use-vocab";
import { useGrammarPoints } from "@/hooks/use-grammar";
import { useLearningPath } from "@/features/practice/use-learning-path";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function FoundationIndexScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: topics, isLoading: topicsLoading } = useVocabTopics();
  const { data: srsQueue, isLoading: srsLoading } = useVocabSrsQueue();
  const { data: grammarPoints, isLoading: grammarLoading } = useGrammarPoints();
  const { data: learningPath } = useLearningPath();

  const topicCount = topics?.length ?? 0;
  const dueCount = srsQueue ? srsQueue.newCount + srsQueue.learningCount + srsQueue.reviewCount : 0;
  const grammarCount = grammarPoints?.length ?? 0;
  const vocabularyPath = learningPath?.skills.find((skill) => skill.skill === "vocabulary");
  const grammarPath = learningPath?.skills.find((skill) => skill.skill === "grammar");
  const vocabularyCompleted = vocabularyPath?.completedItems ?? 0;
  const vocabularyTotal = vocabularyPath?.totalItems ?? topicCount;
  const grammarCompleted = grammarPath?.completedItems ?? 0;
  const grammarTotal = grammarPath?.totalItems ?? grammarCount;
  const targetLevel = learningPath?.targetLevel ?? "B1";
  const isLoading = topicsLoading || srsLoading || grammarLoading;

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

      <Text style={[s.title, { color: c.foreground }]}>Nền tảng</Text>
      <Text style={[s.sub, { color: c.mutedForeground }]}>
        Học từ vựng và ngữ pháp có cấu trúc trước khi vào luyện đề.
      </Text>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      <DepthCard style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: c.primaryTint }]}>
            <GameIcon name="vocabulary" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: c.foreground }]}>Từ vựng</Text>
            <Text style={[s.cardDesc, { color: c.mutedForeground }]}>
              Học từ vựng theo chủ đề với hệ thống SRS (lặp lại có giãn cách).
            </Text>
          </View>
        </View>

        <View style={s.statRow}>
          <View style={[s.statPill, { backgroundColor: c.muted }]}>
            <Text style={[s.statValue, { color: c.foreground }]}>{vocabularyCompleted}/{vocabularyTotal}</Text>
            <Text style={[s.statLabel, { color: c.mutedForeground }]}>từ {vocabularyPath?.level ?? targetLevel}</Text>
          </View>
          <View style={[s.statPill, { backgroundColor: dueCount > 0 ? c.primaryTint : c.muted }]}>
            <Text style={[s.statValue, { color: dueCount > 0 ? c.primary : c.foreground }]}>{dueCount}</Text>
            <Text style={[s.statLabel, { color: c.mutedForeground }]}>cần ôn</Text>
          </View>
        </View>

        <DepthButton
          fullWidth
          onPress={() => router.push("/(app)/vocabulary" as never)}
          style={{ marginTop: spacing.xs }}
        >
          {dueCount > 0 ? `Ôn ${dueCount} từ hôm nay` : "Xem chủ đề từ vựng"}
        </DepthButton>
      </DepthCard>

      <DepthCard style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: "#F3EAFF" }]}>
            <GameIcon name="grammar" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: c.foreground }]}>Ngữ pháp</Text>
            <Text style={[s.cardDesc, { color: c.mutedForeground }]}>
              {grammarCount > 0
                ? `${grammarCount} điểm ngữ pháp có cấu trúc, từ cơ bản đến nâng cao.`
                : "Điểm ngữ pháp có cấu trúc, từ cơ bản đến nâng cao."}
            </Text>
          </View>
        </View>

        <View style={s.statRow}>
          <View style={[s.statPill, { backgroundColor: c.muted }]}>
            <Text style={[s.statValue, { color: c.foreground }]}>{grammarCompleted}/{grammarTotal}</Text>
            <Text style={[s.statLabel, { color: c.mutedForeground }]}>chủ điểm</Text>
          </View>
          <View style={[s.statPill, { backgroundColor: c.muted }]}>
            <Text style={[s.statValue, { color: c.foreground }]}>{targetLevel}</Text>
            <Text style={[s.statLabel, { color: c.mutedForeground }]}>mục tiêu</Text>
          </View>
        </View>

        <DepthButton
          fullWidth
          onPress={() => router.push("/(app)/practice/grammar" as never)}
          style={{ marginTop: spacing.xs }}
        >
          {`Xem ${grammarCount} điểm ngữ pháp`}
        </DepthButton>
      </DepthCard>

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
  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },
  card: { gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconWrap: { width: 52, height: 52, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  cardDesc: { fontSize: fontSize.xs, lineHeight: 18, marginTop: 2 },
  statRow: { flexDirection: "row", gap: spacing.sm },
  statPill: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg, gap: 4 },
  statValue: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  statLabel: { fontSize: 10 },
});
