import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useGrammarPoints, type GrammarPoint } from "@/hooks/use-grammar";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface GrammarTier {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  levels: string[];
}

interface GrammarTierGroup {
  tier: GrammarTier;
  points: GrammarPoint[];
}

const GRAMMAR_TIERS: GrammarTier[] = [
  {
    key: "beginner",
    title: "Mất gốc",
    subtitle: "Bắt đầu lại từ đầu",
    description: "Nắm lại nền móng: động từ be, have, thì hiện tại, câu hỏi, giới từ.",
    levels: ["A1"],
  },
  {
    key: "intermediate",
    title: "Nền tảng",
    subtitle: "Đủ dùng cho giao tiếp và bài thi cơ bản",
    description: "Hệ thống hóa: các thì, so sánh, modal, bị động, điều kiện, mệnh đề quan hệ, tường thuật.",
    levels: ["A2", "B1"],
  },
  {
    key: "advanced",
    title: "Nâng cao",
    subtitle: "Tăng điểm Writing & Speaking",
    description: "Cấu trúc phức tạp: đảo ngữ, câu chẻ, danh từ hóa, mệnh đề rút gọn, liên kết học thuật.",
    levels: ["B2", "C1"],
  },
];

const LEVEL_ORDER: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export default function GrammarScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: points, isLoading } = useGrammarPoints();
  const groups = useMemo(() => groupByTier(points ?? []), [points]);
  const starter = points?.[0] ?? null;
  const hasStarted = (points ?? []).some((point) => (point.distinctCorrect ?? 0) > 0);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Ngữ pháp</Text>
      </HapticTouchable>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      {!isLoading && (!points || points.length === 0) ? (
        <MascotEmpty
          mascot="think"
          title="Chưa có điểm ngữ pháp"
          subtitle="Hệ thống ngữ pháp đang được cập nhật. Vui lòng quay lại sau!"
        />
      ) : null}

      {points && points.length > 0 ? (
        <View style={s.catalog}>
          {!hasStarted ? <GettingStarted starter={starter} /> : null}
          {groups.map((group) => (
            <TierSection key={group.tier.key} group={group} />
          ))}
        </View>
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function GettingStarted({ starter }: { starter: GrammarPoint | null }) {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <DepthCard variant="primary" style={[s.heroCard, { borderColor: c.primary, borderBottomColor: c.primaryDark }]}>
      <Text style={[s.heroTitle, { color: c.foreground }]}>Ngữ pháp cho VSTEP</Text>
      <Text style={[s.heroSub, { color: c.mutedForeground }]}>Ngữ pháp vững thì đọc hiểu, viết, nói đều tốt hơn. Chọn nhóm phù hợp trình độ hiện tại của bạn.</Text>
      {starter ? (
        <View style={s.heroButtonWrap}>
          <DepthButton onPress={() => router.push(`/(app)/practice/grammar/${starter.id}` as never)}>
            Bắt đầu từ bài đầu tiên
          </DepthButton>
        </View>
      ) : null}
    </DepthCard>
  );
}

function TierSection({ group }: { group: GrammarTierGroup }) {
  const c = useThemeColors();
  const router = useRouter();
  const { tier, points } = group;

  return (
    <View style={s.tierSection}>
      <View>
        <Text style={[s.tierSubtitle, { color: c.primary }]}>{tier.subtitle}</Text>
        <Text style={[s.tierTitle, { color: c.foreground }]}>{tier.title}</Text>
        <Text style={[s.tierDesc, { color: c.mutedForeground }]}>{tier.description}</Text>
        <Text style={[s.tierCount, { color: c.subtle }]}>{points.length} chủ điểm</Text>
      </View>
      <View style={s.grid}>
        {points.map((point) => (
          <View key={point.id} style={s.cardWrapper}>
            <GrammarCard point={point} onPress={() => router.push(`/(app)/practice/grammar/${point.id}` as never)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function GrammarCard({ point, onPress }: { point: GrammarPoint; onPress: () => void }) {
  const c = useThemeColors();
  const title = point.vietnameseName || point.name;
  const meta = point.vietnameseName ? point.name : "";
  const levelLabel = grammarLevelLabel(point.levels);
  const correct = Math.min(point.distinctCorrect ?? 0, point.exerciseCount ?? 0);
  const showProgress = correct > 0 && (point.exerciseCount ?? 0) > 0;

  return (
    <HapticTouchable scalePress activeOpacity={0.92} onPress={onPress}>
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
        {levelLabel ? <LevelBadge label={levelLabel} /> : null}
        <Text style={[s.cardName, { color: c.foreground }]} numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text style={[s.cardMeta, { color: c.mutedForeground }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {point.summary ? (
          <Text style={[s.cardSummary, { color: c.subtle }]} numberOfLines={2}>
            {point.summary}
          </Text>
        ) : null}
        {showProgress ? (
          <Text style={[s.cardProgress, { color: c.primary }]}>Đang học · {correct}/{point.exerciseCount}</Text>
        ) : null}
      </View>
    </HapticTouchable>
  );
}

function LevelBadge({ label }: { label: string }) {
  const c = useThemeColors();
  const firstLevel = label.split("/")[0] ?? "A1";
  const tint = levelTint(firstLevel, c);

  return (
    <View style={[s.levelBadge, { backgroundColor: tint.bg, borderColor: tint.border }]}>
      <Text style={[s.levelText, { color: tint.fg }]}>{label}</Text>
    </View>
  );
}

function groupByTier(points: GrammarPoint[]): GrammarTierGroup[] {
  return GRAMMAR_TIERS.map((tier) => ({
    tier,
    points: points.filter((point) => point.levels.some((level) => tier.levels.includes(level.toUpperCase()))),
  })).filter((group) => group.points.length > 0);
}

function grammarLevelLabel(levels: string[]): string | undefined {
  const uniqueLevels = Array.from(new Set(levels.map((level) => level.toUpperCase()))).sort(
    (a, b) => (LEVEL_ORDER[a] ?? 99) - (LEVEL_ORDER[b] ?? 99),
  );
  return uniqueLevels.length > 0 ? uniqueLevels.join("/") : undefined;
}

function levelTint(level: string, c: ReturnType<typeof useThemeColors>): { bg: string; fg: string; border: string } {
  switch (level) {
    case "A2":
      return { bg: c.infoTint, fg: c.info, border: c.info + "66" };
    case "B1":
    case "B2":
      return { bg: c.warningTint, fg: c.warning, border: c.warning + "66" };
    case "C1":
    case "C2":
      return { bg: c.destructiveTint, fg: c.destructive, border: c.destructive + "66" };
    default:
      return { bg: c.primaryTint, fg: c.primary, border: c.primary + "66" };
  }
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },
  catalog: { gap: spacing["2xl"] },
  heroCard: { gap: spacing.sm, padding: spacing.lg },
  heroTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  heroSub: { fontSize: fontSize.sm, lineHeight: 20 },
  heroButtonWrap: { marginTop: spacing.sm, alignSelf: "flex-start" },
  tierSection: { gap: spacing.md },
  tierSubtitle: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 0.8, textTransform: "uppercase" },
  tierTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, marginTop: 2 },
  tierDesc: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 2 },
  tierCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
  cardWrapper: { width: "48%" },
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.base,
    paddingRight: spacing.lg,
    gap: spacing.xs,
    minHeight: 132,
    position: "relative",
  },
  cardName: { paddingRight: spacing.xl, fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20, marginBottom: 2 },
  cardMeta: { fontSize: fontSize.xs, lineHeight: 16 },
  cardSummary: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 2 },
  cardProgress: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: "auto" },
  levelBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    zIndex: 1,
  },
  levelText: { fontSize: 10, fontFamily: fontFamily.bold },
});
