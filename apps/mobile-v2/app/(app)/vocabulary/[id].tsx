import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LevelFilters, type Level } from "@/components/LevelFilters";
import { canBuildFillBlank, type PracticeMode } from "@/features/vocab/use-practice-session";
import {
  toVocabLevel,
  topicGroupKey,
  useVocabTopicDetail,
  useVocabTopics,
  type FsrsState,
  type VocabTopic,
  type WordWithState,
} from "@/hooks/use-vocab";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface ModeOption {
  mode: PracticeMode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  available: boolean;
}

type Bucket = "new" | "learning" | "known";
type WordFilter = "all" | Bucket;

const WORD_FILTERS: { key: WordFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới" },
  { key: "learning", label: "Đang học" },
  { key: "known", label: "Đã thuộc" },
];

export default function VocabTopicDetailScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = id ?? "";
  const { data, isLoading } = useVocabTopicDetail(topicId);
  const { data: topics } = useVocabTopics();
  const words = data?.words ?? [];
  const hasFillBlank = canBuildFillBlank(words);
  const [selectedMode, setSelectedMode] = useState<PracticeMode>("flashcard");

  const modeOptions = useMemo<ModeOption[]>(
    () => [
      {
        mode: "flashcard",
        icon: "albums-outline",
        title: "Thẻ flashcard",
        subtitle: "Lật thẻ + nhắc lại cách quãng",
        available: words.length > 0,
      },
      {
        mode: "typing",
        icon: "create-outline",
        title: "Gõ từ",
        subtitle: "Gõ tiếng Anh từ trí nhớ",
        available: words.length > 0,
      },
      {
        mode: "listen",
        icon: "headset-outline",
        title: "Nghe",
        subtitle: "Nghe và nhớ lại từ",
        available: words.length > 0,
      },
      {
        mode: "reverse",
        icon: "swap-horizontal-outline",
        title: "Đảo ngược",
        subtitle: "Xem nghĩa, nhớ lại từ",
        available: words.length > 0,
      },
      {
        mode: "fill_blank",
        icon: "remove-outline",
        title: "Điền chỗ trống",
        subtitle: hasFillBlank ? "Điền từ vào câu" : "Cần ví dụ để tạo câu điền từ",
        available: hasFillBlank,
      },
      {
        mode: "mixed",
        icon: "shuffle-outline",
        title: "Hỗn hợp",
        subtitle: "Ngẫu nhiên, tối đa thách thức",
        available: words.length > 0,
      },
    ],
    [hasFillBlank, words.length],
  );

  if (isLoading || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  const { topic } = data;
  const currentLevel = toVocabLevel(topic.level);
  const groupKey = topicGroupKey(topic);
  const siblingTopics = (topics ?? [])
    .filter((item) => topicGroupKey(item) === groupKey)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const availableLevels = availableTopicLevels(siblingTopics, currentLevel);
  const progressSummary = topicProgressSummary(topic, words.length, siblingTopics);
  const fallbackLearned = words.filter((entry) => bucket(entry.state) === "known").length;
  const currentLearned = topic.learnedCount ?? fallbackLearned;
  const currentTotal = topic.wordCount ?? words.length;
  const progress = currentTotal > 0 ? currentLearned / currentTotal : 0;
  const selectedAvailable = modeOptions.some((option) => option.mode === selectedMode && option.available);

  const selectLevel = (nextLevel: Level | null) => {
    if (!nextLevel || nextLevel === currentLevel) return;
    const nextTopic = siblingTopics.find((item) => toVocabLevel(item.level) === nextLevel);
    if (!nextTopic) return;
    router.replace(`/(app)/vocabulary/${nextTopic.id}` as never);
  };

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[
        s.scroll,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={22} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Quay lại</Text>
      </HapticTouchable>

      <DepthCard style={s.heroCard}>
        <View style={[s.levelBadge, { backgroundColor: c.primaryTint }]}>
          <Text style={[s.levelText, { color: c.primary }]}>{topic.level}</Text>
        </View>
        <Text style={[s.heroTitle, { color: c.foreground }]}>{topic.name}</Text>
        {topic.description ? (
          <Text style={[s.heroDesc, { color: c.mutedForeground }]}>{topic.description}</Text>
        ) : null}
        {availableLevels.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.levelControls}>
            <LevelFilters
              level={currentLevel}
              availableLevels={availableLevels}
              allowClear={false}
              onLevelChange={selectLevel}
            />
          </ScrollView>
        ) : null}
        <View style={s.progressRow}>
          <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
            <View style={[s.progressFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[s.progressText, { color: c.subtle }]}>{progressSummary}</Text>
        </View>
        <DepthButton
          fullWidth
          disabled={!selectedAvailable}
          onPress={() => router.push(`/(app)/vocabulary/${topicId}/flashcard?mode=${selectedMode}` as never)}
        >
          Bắt đầu luyện tập
        </DepthButton>
      </DepthCard>

      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: c.foreground }]}>Chế độ luyện tập</Text>
        <Text style={[s.sectionSub, { color: c.mutedForeground }]}>Chọn cách bạn muốn luyện từ trong chủ đề này.</Text>
        <View style={s.modeList}>
          {modeOptions.map((option) => (
            <ExerciseMode
              key={option.mode}
              option={option}
              selected={selectedMode === option.mode}
              onPress={() => {
                if (option.available) setSelectedMode(option.mode);
              }}
            />
          ))}
        </View>
      </View>

      <WordListSection words={words} />
    </ScrollView>
  );
}

function ExerciseMode({
  option,
  selected,
  onPress,
}: {
  option: ModeOption;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const disabled = !option.available;

  return (
    <HapticTouchable
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
      scalePress
      style={[
        s.modeCard,
        {
          borderColor: selected ? c.primary : c.border,
          backgroundColor: selected ? c.primaryTint : c.surface,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: selected ? 1.01 : 1 }],
        },
      ]}
    >
      <View
        style={[
          s.modeIconWrap,
          {
            backgroundColor: selected ? c.surface : c.background,
            borderColor: selected ? c.primary : c.border,
          },
        ]}
      >
        <Ionicons name={option.icon} size={20} color={selected ? c.primary : c.mutedForeground} />
      </View>
      <View style={s.modeCopy}>
        <Text style={[s.modeTitle, { color: selected ? c.primary : c.foreground }]}>{option.title}</Text>
        <Text style={[s.modeDesc, { color: c.mutedForeground }]} numberOfLines={1}>
          {option.subtitle}
        </Text>
      </View>
      <View
        style={[
          s.radioOuter,
          {
            borderColor: selected ? c.primary : c.border,
            backgroundColor: selected ? c.primary : c.surface,
          },
        ]}
      >
        {selected ? <View style={[s.radioInner, { backgroundColor: c.surface }]} /> : null}
      </View>
    </HapticTouchable>
  );
}

function WordListSection({ words }: { words: WordWithState[] }) {
  const c = useThemeColors();
  const [filter, setFilter] = useState<WordFilter>("all");
  const counts = useMemo(() => countByBucket(words), [words]);
  const filtered = filter === "all" ? words : words.filter((entry) => bucket(entry.state) === filter);

  return (
    <DepthCard padding={0} style={s.wordCard}>
      <View style={s.wordHeader}>
        <Text style={[s.wordHeaderTitle, { color: c.foreground }]}>
          Từ vựng <Text style={{ color: c.subtle }}>· {words.length}</Text>
        </Text>
      </View>
      <View style={s.wordFilterRow}>
        {WORD_FILTERS.map((item) => {
          const active = filter === item.key;
          const count = item.key === "all" ? words.length : counts[item.key];
          return (
            <HapticTouchable
              key={item.key}
              onPress={() => setFilter(item.key)}
              activeOpacity={1}
              style={[
                s.wordFilter,
                {
                  borderColor: active ? c.primary : c.border,
                  backgroundColor: active ? c.primaryTint : c.background,
                },
              ]}
            >
              <Text style={[s.wordFilterText, { color: active ? c.primary : c.mutedForeground }]}>
                {item.label} {count}
              </Text>
            </HapticTouchable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <Text style={[s.emptyWords, { color: c.mutedForeground }]}>Không có từ phù hợp.</Text>
      ) : (
        <View style={[s.wordBody, { borderTopColor: c.border }]}>
          {filtered.map(({ word, state }) => {
            const badge = stateBadge(state);
            return (
              <View key={word.id} style={[s.wordRow, { borderBottomColor: c.borderLight }]}>
                <View style={s.wordCopy}>
                  <View style={s.wordTopRow}>
                    <Text style={[s.wordText, { color: c.foreground }]} numberOfLines={1}>
                      {word.word}
                    </Text>
                    {word.partOfSpeech ? (
                      <View style={[s.posPill, { backgroundColor: c.muted }]}>
                        <Text style={[s.posText, { color: c.mutedForeground }]}>{word.partOfSpeech}</Text>
                      </View>
                    ) : null}
                  </View>
                  {word.phonetic ? <Text style={[s.wordPhonetic, { color: c.subtle }]}>{word.phonetic}</Text> : null}
                  <Text style={[s.wordDef, { color: c.mutedForeground }]} numberOfLines={2}>
                    {word.definition}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.badgeText, { color: badge.fg }]}>{badge.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </DepthCard>
  );
}

function countByBucket(words: WordWithState[]): Record<Bucket, number> {
  const counts: Record<Bucket, number> = { new: 0, learning: 0, known: 0 };
  for (const entry of words) counts[bucket(entry.state)] += 1;
  return counts;
}

function bucket(state: FsrsState): Bucket {
  if (state.kind === "new") return "new";
  if (state.kind === "learning" || state.kind === "relearning") return "learning";
  return state.retrievability >= 0.85 ? "known" : "learning";
}

function stateBadge(state: FsrsState): { text: string; bg: string; fg: string } {
  const value = bucket(state);
  if (value === "new") return { text: "Mới", bg: "#DDF4FF", fg: "#1CB0F6" };
  if (value === "known") return { text: "Đã thuộc", bg: "#E6F8D4", fg: "#58CC02" };
  return { text: "Đang học", bg: "#FFF0DC", fg: "#FF9B00" };
}

function availableTopicLevels(topics: VocabTopic[], fallbackLevel: Level | null): Level[] {
  const levels = topics.map((item) => toVocabLevel(item.level)).filter((level) => level !== null);
  if (levels.length === 0 && fallbackLevel) return [fallbackLevel];
  return Array.from(new Set(levels));
}

function topicProgressSummary(currentTopic: VocabTopic, currentTotal: number, topics: VocabTopic[]): string {
  const currentLevel = currentTopic.level;
  const current = topics.find((item) => item.level === currentLevel);
  const currentLearned = current?.learnedCount ?? currentTopic.learnedCount ?? 0;
  const currentWords = current?.wordCount ?? currentTopic.wordCount ?? currentTotal;
  const summaryTopics = topics.length > 0 ? topics : [currentTopic];
  const overallLearned = summaryTopics.reduce((sum, item) => sum + (item.learnedCount ?? 0), 0);
  const overallWords = summaryTopics.reduce((sum, item) => sum + (item.wordCount ?? 0), 0);

  if (overallWords <= 0) return `${currentLevel}: ${currentLearned}/${currentWords} từ`;
  return `${currentLevel}: ${currentLearned}/${currentWords} từ · Tổng: ${overallLearned}/${overallWords} từ`;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  heroCard: { alignItems: "center", gap: spacing.md, padding: spacing.lg },
  levelBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  heroTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  heroDesc: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  levelControls: { paddingVertical: spacing.xs },
  progressRow: { gap: spacing.xs, width: "100%" },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: radius.full },
  progressText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textAlign: "center" },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  sectionSub: { fontSize: fontSize.sm, lineHeight: 20 },
  modeList: { gap: spacing.sm },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: radius.button,
    padding: 10,
    gap: spacing.md,
  },
  modeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  modeCopy: { flex: 1, gap: 2 },
  modeTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  modeDesc: { fontSize: 11, lineHeight: 16 },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 6, height: 6, borderRadius: 3 },
  wordCard: { overflow: "hidden" },
  wordHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  wordHeaderTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  wordFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.lg },
  wordFilter: {
    borderWidth: 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  wordFilterText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  emptyWords: { textAlign: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, fontSize: fontSize.sm },
  wordBody: { borderTopWidth: 1 },
  wordRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  wordCopy: { flex: 1, minWidth: 0 },
  wordTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 2 },
  wordText: { flexShrink: 1, fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  wordPhonetic: { fontSize: fontSize.xs, marginBottom: 2 },
  wordDef: { fontSize: fontSize.sm, lineHeight: 20 },
  posPill: { paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: radius.sm },
  posText: { fontSize: 10, fontFamily: fontFamily.medium },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
