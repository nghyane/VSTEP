import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { LevelFilters, type Level } from "@/components/LevelFilters";
import { MascotEmpty } from "@/components/MascotStates";
import { STATUS_OPTIONS, StatusFilters, type StatusFilter } from "@/components/StatusFilters";
import { useShadowingProgress } from "@/features/shadowing/use-shadowing-progress";
import {
  type SpeakingConversationScenario,
  type SpeakingDrill,
  useSpeakingConversationHistory,
  useSpeakingConversationScenarios,
  useSpeakingDrills,
} from "@/hooks/use-practice";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

const ALL = STATUS_OPTIONS[0];
const NOT_STARTED = STATUS_OPTIONS[1];
const IN_PROGRESS = STATUS_OPTIONS[2];

function chunkPairs<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) result.push(arr.slice(i, i + 2));
  return result;
}

export default function SpeakingListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: drills, isLoading: drillsLoading, isError: drillsError } = useSpeakingDrills();
  const { data: progress } = useShadowingProgress();
  const { data: scenarios, isLoading: scenariosLoading, isError: scenariosError } = useSpeakingConversationScenarios();
  const { data: history } = useSpeakingConversationHistory();

  const [level, setLevel] = useState<Level | null>(null);
  const [status, setStatus] = useState<StatusFilter>(ALL);

  const completedScenarios = useMemo(() => {
    const set = new Set<string>();
    for (const item of history ?? []) set.add(item.scenario.id);
    return set;
  }, [history]);

  const filteredDrills = useMemo(() => {
    return (drills ?? []).filter((drill) => {
      if (level && drill.level.toUpperCase() !== level) return false;
      if (status === ALL) return true;

      const doneCount = new Set((progress?.[drill.id] ?? []).map((item) => item.segmentIndex)).size;
      const pct = drill.segmentCount > 0 ? Math.round((doneCount / drill.segmentCount) * 100) : 0;
      if (status === NOT_STARTED) return doneCount === 0;
      if (status === IN_PROGRESS) return doneCount > 0 && pct < 100;
      return pct >= 100;
    });
  }, [drills, level, progress, status]);

  const filteredScenarios = useMemo(() => {
    return (scenarios ?? []).filter((scenario) => {
      if (level && scenario.level.toUpperCase() !== level) return false;
      if (status === ALL) return true;
      const done = completedScenarios.has(scenario.id);
      if (status === NOT_STARTED) return !done;
      if (status === IN_PROGRESS) return false;
      return done;
    });
  }, [completedScenarios, level, scenarios, status]);

  const loading = drillsLoading || scenariosLoading;
  const hasData = filteredDrills.length > 0 || filteredScenarios.length > 0;

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={22} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Nói</Text>
      </HapticTouchable>

      <View style={s.header}>
        <Text style={[s.subtitle, { color: c.mutedForeground }]}>3 phần · ghi âm + AI đánh giá phát âm</Text>
      </View>

      <View style={s.filters}>
        <LevelFilters level={level} onLevelChange={setLevel} />
        <StatusFilters status={status} onStatusChange={setStatus} />
      </View>

      <SpeakingSection
        title="Shadowing"
        description="Nghe và nhại theo từng câu. AI đánh giá độ chính xác từng từ."
        loading={drillsLoading}
        error={drillsError}
      >
        <CardGrid
          items={filteredDrills}
          render={(drill) => {
            const doneCount = new Set((progress?.[drill.id] ?? []).map((item) => item.segmentIndex)).size;
            const total = drill.segmentCount;
            const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
            const progressLabel = doneCount > 0 ? `${doneCount}/${total}` : null;
            return (
              <DrillCard
                key={drill.id}
                drill={drill}
                progressLabel={progressLabel}
                completed={pct >= 100}
                onPress={() => router.push(`/(app)/practice/speaking/shadowing/${drill.id}` as never)}
              />
            );
          }}
        />
      </SpeakingSection>

      <SpeakingSection
        title="Hội thoại AI"
        description="Roleplay với nhân vật AI. AI phản hồi tự nhiên và chấm từng lượt nói."
        loading={scenariosLoading}
        error={scenariosError}
      >
        <CardGrid
          items={filteredScenarios}
          render={(scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              completed={completedScenarios.has(scenario.id)}
              onPress={() => router.push(`/(app)/practice/speaking/conversation/${scenario.id}` as never)}
            />
          )}
        />
      </SpeakingSection>

      {!loading && !hasData ? (
        <MascotEmpty mascot="think" title="Chưa có bài nói" subtitle="Nội dung đang được cập nhật." />
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function SpeakingSection({
  title,
  description,
  loading,
  error,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  error: boolean;
  children: ReactNode;
}) {
  const c = useThemeColors();

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[s.sectionDesc, { color: c.mutedForeground }]}>{description}</Text>
      {loading ? <ActivityIndicator color={c.skillSpeaking} style={s.loader} /> : null}
      {error ? (
        <View style={[s.emptyStrip, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[s.emptyText, { color: c.destructive }]}>Không thể tải dữ liệu. Vui lòng thử lại.</Text>
        </View>
      ) : null}
      {!loading && !error ? children : null}
    </View>
  );
}

function CardGrid<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  const c = useThemeColors();
  if (items.length === 0) {
    return (
      <View style={[s.emptyStrip, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.emptyText, { color: c.mutedForeground }]}>Không có bài nào phù hợp với bộ lọc.</Text>
      </View>
    );
  }

  return (
    <View style={s.cardGrid}>
      {chunkPairs(items).map((pair, idx) => (
        <View key={idx} style={s.cardRow}>
          {pair.map((item) => render(item))}
          {pair.length === 1 ? <View style={s.cardWrapper} /> : null}
        </View>
      ))}
    </View>
  );
}

function DrillCard({
  drill,
  progressLabel,
  completed,
  onPress,
}: {
  drill: SpeakingDrill;
  progressLabel: string | null;
  completed: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <View style={s.cardWrapper}>
      <HapticTouchable scalePress onPress={onPress} style={s.cardTouchable}>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.cardTop}>
            <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>{drill.title}</Text>
            <LevelBadge level={drill.level} />
          </View>
          <Text style={[s.cardMeta, { color: c.mutedForeground }]} numberOfLines={1}>
            {drill.segmentCount} đoạn · {drill.estimatedMinutes ?? "?"} phút
          </Text>
          {progressLabel ? (
            <Text style={[s.progressText, { color: completed ? c.success : c.info }]}>{progressLabel}</Text>
          ) : null}
        </View>
      </HapticTouchable>
    </View>
  );
}

function ScenarioCard({
  scenario,
  completed,
  onPress,
}: {
  scenario: SpeakingConversationScenario;
  completed: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <View style={s.cardWrapper}>
      <HapticTouchable scalePress onPress={onPress} style={s.cardTouchable}>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.cardTop}>
            <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>{scenario.title}</Text>
            <LevelBadge level={scenario.level} />
          </View>
          <Text style={[s.cardMeta, { color: c.mutedForeground }]} numberOfLines={1}>
            {scenario.characterName} · {scenario.estimatedMinutes ?? "?"} phút
          </Text>
          <Text style={[s.cardDesc, { color: c.subtle }]} numberOfLines={3}>
            {scenario.description ?? "Luyện phản xạ hội thoại với AI."}
          </Text>
          {completed ? (
            <View style={[s.doneBadge, { backgroundColor: c.primaryTint }]}>
              <Text style={[s.doneBadgeText, { color: c.primaryDark }]}>Đã luyện</Text>
            </View>
          ) : null}
        </View>
      </HapticTouchable>
    </View>
  );
}

function LevelBadge({ level }: { level: string }) {
  const c = useThemeColors();
  const upper = level.toUpperCase();
  const color = upper === "A2" ? c.info : upper === "B1" || upper === "B2" ? c.warning : c.success;
  return (
    <View style={[s.levelBadge, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[s.levelText, { color }]}>{upper}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  header: { gap: spacing.xs },
  subtitle: { fontSize: fontSize.sm, lineHeight: 20 },
  filters: { gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  sectionDesc: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.xs },
  loader: { alignSelf: "flex-start", marginVertical: spacing.md },
  cardGrid: { gap: spacing.md },
  cardRow: { flexDirection: "row", gap: spacing.md },
  cardWrapper: { flex: 1, minWidth: 0 },
  cardTouchable: { flex: 1 },
  card: {
    minHeight: 116,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, lineHeight: 20 },
  cardMeta: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  cardDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  progressText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  levelText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  doneBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  doneBadgeText: { fontSize: 10, fontFamily: fontFamily.bold },
  emptyStrip: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.base },
  emptyText: { fontSize: fontSize.sm, textAlign: "center" },
});
