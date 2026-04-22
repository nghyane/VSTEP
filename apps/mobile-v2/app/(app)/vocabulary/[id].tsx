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
  const newCount = words.filter((w) => w.state.kind === "new").length;
  const learnedCount = words.length - newCount;
  const progress = words.length > 0 ? learnedCount / words.length : 0;

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

        {/* Progress bar */}
        <View style={s.progressRow}>
          <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
            <View style={[s.progressFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[s.progressText, { color: c.subtle }]}>{learnedCount}/{words.length}</Text>
        </View>

        <DepthButton fullWidth onPress={() => {}}>
          {`Học Flashcard · ${words.length} từ`}
        </DepthButton>
      </DepthCard>

      {/* Bài tập bổ trợ */}
      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: c.subtle }]}>Bài tập bổ trợ</Text>
        <View style={s.modeGrid}>
          <ExerciseMode
            icon="check"
            title="Trắc nghiệm"
            desc="Chọn đáp án đúng"
            color={c.info}
          />
          <ExerciseMode
            icon="pencil"
            title="Điền từ"
            desc="Điền vào chỗ trống"
            color={c.skillWriting}
          />
          <ExerciseMode
            icon="book"
            title="Biến đổi từ"
            desc="Chia dạng từ đúng"
            color={c.skillReading}
          />
        </View>
      </View>

      {/* Word list */}
      <WordListSection words={words} />

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function ExerciseMode({ icon, title, desc, color }: { icon: "check" | "pencil" | "book"; title: string; desc: string; color: string }) {
  const c = useThemeColors();
  return (
    <HapticTouchable style={[s.modeCard, { borderColor: c.border, borderBottomColor: c.border }]} activeOpacity={0.8}>
      <GameIcon name={icon} size={22} />
      <Text style={[s.modeTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[s.modeDesc, { color: c.subtle }]}>{desc}</Text>
    </HapticTouchable>
  );
}

function stateBadge(state: WordWithState["state"]): { text: string; bgColor: string; textColor: string } {
  if (state.kind === "new") return { text: "Mới", bgColor: "#DDF4FF", textColor: "#1CB0F6" };
  if (state.kind === "learning" || state.kind === "relearning") return { text: "Đang học", bgColor: "#FFF0DC", textColor: "#FF9B00" };
  const r = state.retrievability;
  const pct = `${Math.round(r * 100)}%`;
  if (r >= 0.9) return { text: pct, bgColor: "#E6F8D4", textColor: "#58CC02" };
  if (r >= 0.7) return { text: pct, bgColor: "#FFF0DC", textColor: "#FF9B00" };
  return { text: pct, bgColor: "#FFE6E4", textColor: "#EA4335" };
}

function WordListSection({ words }: { words: WordWithState[] }) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <DepthCard style={s.wordListCard}>
      <HapticTouchable style={s.wordListHeader} onPress={() => setExpanded(!expanded)}>
        <View style={s.wordListHeaderLeft}>
          <Text style={[s.wordListTitle, { color: c.foreground }]}>Từ vựng trong chủ đề</Text>
          <Text style={[s.wordListCount, { color: c.subtle }]}>{words.length} từ</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={c.subtle} />
      </HapticTouchable>

      {expanded ? (
        <View style={[s.wordListBody, { borderTopColor: c.border }]}>
          {words.map(({ word: w, state }) => {
            const badge = stateBadge({ ...state });
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
                  {w.example ? <Text style={[s.wordExample, { color: c.subtle }]}>"{w.example}"</Text> : null}
                </View>
                <View style={[s.stateBadge, { backgroundColor: badge.bgColor }]}>
                  <Text style={[s.stateBadgeText, { color: badge.textColor }]}>{badge.text}</Text>
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
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  // Hero
  heroCard: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  levelBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  heroTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  heroDesc: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, width: "100%", maxWidth: 260 },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: radius.full },
  progressText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },

  // Exercise modes
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  modeGrid: { flexDirection: "row", gap: spacing.sm },
  modeCard: { flex: 1, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.base, gap: 4 },
  modeTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  modeDesc: { fontSize: 10 },

  // Word list
  wordListCard: { padding: 0, overflow: "hidden" },
  wordListHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  wordListHeaderLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  wordListTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  wordListCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  wordListBody: { borderTopWidth: 1 },
  wordRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.base, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  wordTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 2 },
  wordText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  wordPhonetic: { fontSize: fontSize.xs },
  posPill: { paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: radius.sm },
  posText: { fontSize: 10, fontFamily: fontFamily.medium },
  wordDef: { fontSize: fontSize.sm, lineHeight: 20 },
  wordExample: { fontSize: fontSize.xs, fontStyle: "italic", marginTop: 2 },
  stateBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  stateBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
