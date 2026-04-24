import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { useVocabTopicDetail, type WordWithState } from "@/hooks/use-vocab";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function VocabTopicDetailScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useVocabTopicDetail(id ?? "");

  if (isLoading || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  const { topic, words } = data;
  const exercises = data.exercises;
  const newCount = words.filter((w) => w.state.kind === "new").length;
  const learnedCount = words.length - newCount;
  const progress = words.length > 0 ? learnedCount / words.length : 0;

  const mcqCount = exercises.filter((e) => e.kind === "mcq").length;
  const fillCount = exercises.filter((e) => e.kind === "fill_blank").length;
  const wordFormCount = exercises.filter((e) => e.kind === "word_form").length;

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

      {/* Topic Hero */}
      <DepthCard style={s.heroCard}>
        <View style={[s.levelBadge, { backgroundColor: c.primaryTint }]}>
          <Text style={[s.levelText, { color: c.primary }]}>{topic.level}</Text>
        </View>
        <Text style={[s.heroTitle, { color: c.foreground }]}>{topic.name}</Text>
        {topic.description ? (
          <Text style={[s.heroDesc, { color: c.mutedForeground }]}>{topic.description}</Text>
        ) : null}

        <View style={s.progressRow}>
          <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
            <View style={[s.progressFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[s.progressText, { color: c.subtle }]}>{learnedCount}/{words.length}</Text>
        </View>

        <DepthButton
          fullWidth
          onPress={() => router.push(`/(app)/vocabulary/${id}/flashcard` as any)}
        >
          {`Học Flashcard · ${words.length} từ`}
        </DepthButton>
      </DepthCard>

      {/* Bài tập bổ trợ */}
      {exercises.length > 0 ? (
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: c.foreground }]}>Bài tập bổ trợ</Text>
          <View style={s.modeGrid}>
            <ExerciseMode
              icon="check"
              title="Trắc nghiệm"
              desc={mcqCount > 0 ? `${mcqCount} câu` : "Chọn đáp án"}
              color={c.info}
              onPress={() => router.push(`/(app)/vocabulary/${id}/exercise?kind=mcq` as any)}
            />
            <ExerciseMode
              icon="pencil"
              title="Điền từ"
              desc={fillCount > 0 ? `${fillCount} câu` : "Điền chỗ trống"}
              color={c.skillWriting}
              onPress={() => router.push(`/(app)/vocabulary/${id}/exercise?kind=fill_blank` as any)}
            />
            <ExerciseMode
              icon="book"
              title="Biến đổi"
              desc={wordFormCount > 0 ? `${wordFormCount} câu` : "Chia dạng từ"}
              color={c.skillReading}
              onPress={() => router.push(`/(app)/vocabulary/${id}/exercise?kind=word_form` as any)}
            />
          </View>
        </View>
      ) : null}

      {/* Word list (collapsible) */}
      <WordListSection words={words} />

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function ExerciseMode({ icon, title, desc, color, onPress }: {
  icon: "check" | "pencil" | "book"; title: string; desc: string; color: string; onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <HapticTouchable
      style={[s.modeCard, { borderColor: c.border, borderBottomColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[s.modeIconWrap, { backgroundColor: color + "15" }]}>
        <GameIcon name={icon} size={22} />
      </View>
      <Text style={[s.modeTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[s.modeDesc, { color: c.mutedForeground }]}>{desc}</Text>
    </HapticTouchable>
  );
}

function stateBadge(state: WordWithState["state"]): { text: string; bg: string; fg: string } {
  if (state.kind === "new") return { text: "Mới", bg: "#DDF4FF", fg: "#1CB0F6" };
  if (state.kind === "learning" || state.kind === "relearning") return { text: "Đang học", bg: "#FFF0DC", fg: "#FF9B00" };
  const r = state.retrievability;
  const pct = `${Math.round(r * 100)}%`;
  if (r >= 0.9) return { text: pct, bg: "#E6F8D4", fg: "#58CC02" };
  if (r >= 0.7) return { text: pct, bg: "#FFF0DC", fg: "#FF9B00" };
  return { text: pct, bg: "#FFE6E4", fg: "#EA4335" };
}

function WordListSection({ words }: { words: WordWithState[] }) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);

  return (
    <DepthCard style={s.wordCard}>
      <HapticTouchable style={s.wordHeader} onPress={() => setOpen(!open)}>
        <View style={s.wordHeaderLeft}>
          <Text style={[s.wordHeaderTitle, { color: c.foreground }]}>Từ vựng trong chủ đề</Text>
          <Text style={[s.wordHeaderCount, { color: c.subtle }]}>{words.length} từ</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={c.subtle} />
      </HapticTouchable>

      {open ? (
        <View style={[s.wordBody, { borderTopColor: c.border }]}>
          {words.map(({ word: w, state }) => {
            const badge = stateBadge(state);
            return (
              <View key={w.id} style={[s.wordRow, { borderBottomColor: c.borderLight }]}>
                <View style={{ flex: 1 }}>
                  <View style={s.wordTopRow}>
                    <Text style={[s.wordText, { color: c.foreground }]}>{w.word}</Text>
                    {w.phonetic ? <Text style={[s.wordPhonetic, { color: c.subtle }]}>{w.phonetic}</Text> : null}
                    {w.partOfSpeech ? (
                      <View style={[s.posPill, { backgroundColor: c.muted }]}>
                        <Text style={[s.posText, { color: c.mutedForeground }]}>{w.partOfSpeech}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[s.wordDef, { color: c.mutedForeground }]}>{w.definition}</Text>
                  {w.example ? <Text style={[s.wordExample, { color: c.subtle }]}>{`"${w.example}"`}</Text> : null}
                </View>
                <View style={[s.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.badgeText, { color: badge.fg }]}>{badge.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </DepthCard>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },

  heroCard: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  levelBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  heroTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  heroDesc: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, width: "100%", maxWidth: 260 },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: radius.full },
  progressText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },

  section: { gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  modeGrid: { flexDirection: "row", gap: spacing.sm },
  modeCard: { flex: 1, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm, alignItems: "flex-start" },
  modeIconWrap: { width: 40, height: 40, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  modeTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  modeDesc: { fontSize: 11, lineHeight: 16 },

  wordCard: { padding: 0, overflow: "hidden" },
  wordHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  wordHeaderLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  wordHeaderTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  wordHeaderCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  wordBody: { borderTopWidth: 1 },
  wordRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.base, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  wordTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 2 },
  wordText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  wordPhonetic: { fontSize: fontSize.xs },
  posPill: { paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: radius.sm },
  posText: { fontSize: 10, fontFamily: fontFamily.medium },
  wordDef: { fontSize: fontSize.sm, lineHeight: 20 },
  wordExample: { fontSize: fontSize.xs, fontStyle: "italic", marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
