import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { CoinButton } from "@/features/coin/CoinButton";
import { TopUpDialog } from "@/features/coin/TopUpDialog";
import { FULL_TEST_COST } from "@/features/coin/coin-store";
import { useExams, type Exam } from "@/hooks/use-exams";
import { MascotEmpty } from "@/components/MascotStates";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";

const SKILL_ORDER = ["listening", "reading", "writing", "speaking"] as const;

export default function ExamsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useExams();
  const [search, setSearch] = useState("");
  const [topUpVisible, setTopUpVisible] = useState(false);

  const exams = (data ?? []).filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: c.foreground }]}>Thư viện đề thi</Text>
          <Text style={[s.subtitle, { color: c.mutedForeground }]}>Luyện đề bám sát cấu trúc VSTEP</Text>
        </View>
        <CoinButton onPress={() => setTopUpVisible(true)} />
      </View>

      {/* Search */}
      <View style={[s.searchRow, { backgroundColor: c.card, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={16} color={c.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: c.foreground }]}
          placeholder="Nhập tên đề thi..."
          placeholderTextColor={c.mutedForeground}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: spacing["2xl"] }} />}

      {!isLoading && exams.length === 0 && (
        <MascotEmpty mascot="think" title="Không tìm thấy đề thi nào" />
      )}

      {/* Exam list */}
      <View style={s.grid}>
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onPress={() => router.push(`/(app)/exam/${exam.id}`)}
          />
        ))}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
      <TopUpDialog visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
    </ScrollView>
  );
}

function ExamCard({ exam, onPress }: { exam: Exam; onPress: () => void }) {
  const c = useThemeColors();

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.8}>
      <DepthCard>
        {/* Tags */}
        {exam.tags.length > 0 && (
          <View style={s.tagRow}>
            {exam.tags.map((tag) => (
              <View key={tag} style={[s.tag, { backgroundColor: c.muted, borderColor: c.border }]}>
                <Text style={[s.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>
          {exam.title}
        </Text>

        {/* Meta */}
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
          <Text style={[s.metaText, { color: c.mutedForeground }]}>
            {exam.totalDurationMinutes} phút
          </Text>
        </View>

        {/* Skill chips */}
        <View style={s.chipRow}>
          {SKILL_ORDER.map((sk) => (
            <SkillChip key={sk} skill={sk} />
          ))}
        </View>

        {/* Footer */}
        <View style={[s.cardFooter, { borderTopColor: c.border }]}>
          <View style={s.coinCost}>
            <GameIcon name="coin" size={16} />
            <Text style={[s.coinText, { color: c.coinDark }]}>{FULL_TEST_COST} xu</Text>
          </View>
          <View style={[s.ctaBtn, { backgroundColor: c.primary }]}>
            <Text style={s.ctaBtnText}>Xem đề</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </View>
        </View>
      </DepthCard>
    </HapticTouchable>
  );
}

function SkillChip({ skill }: { skill: string }) {
  const color = useSkillColor(skill as any);
  return (
    <View style={s.chip}>
      <SkillIcon skill={skill as any} size={13} />
      <Text style={[s.chipText, { color }]}>{SKILL_LABELS[skill as any]}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1.5, borderRadius: radius.xl, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, marginBottom: spacing.xl },
  searchInput: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  grid: { gap: spacing.base },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.xs },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  metaText: { fontSize: fontSize.sm },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4 },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.md },
  coinCost: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  coinText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  ctaBtnText: { color: "#FFF", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
