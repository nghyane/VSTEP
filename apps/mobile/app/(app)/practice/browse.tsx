import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { BouncyFlatList } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { EmptyState } from "@/components/EmptyState";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { usePracticeQuestions, useStartPractice } from "@/hooks/use-practice";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { Skill, Question } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const LEVELS = ["A2", "B1", "B2", "C1"] as const;

// Group questions by part for display
interface QuestionGroup {
  part: number;
  level: string;
  questions: Question[];
  itemCount: number;
  sample: Question;
}

function groupByPart(questions: Question[]): QuestionGroup[] {
  const map = new Map<string, Question[]>();
  for (const q of questions) {
    const key = `${q.part}-${q.level}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  return Array.from(map.entries())
    .map(([key, qs]) => {
      const [part, level] = key.split("-");
      // Count total MCQ items (not just question groups)
      const itemCount = qs.reduce((sum, q) => {
        const content = q.content as Record<string, unknown>;
        const items = content?.items as unknown[] | undefined;
        return sum + (items?.length ?? 1);
      }, 0);
      return { part: Number(part), level: level!, questions: qs, itemCount, sample: qs[0] };
    })
    .sort((a, b) => a.part - b.part || a.level.localeCompare(b.level));
}

export default function BrowseQuestionsScreen() {
  const c = useThemeColors();
  const router = useRouter();

  const [skill, setSkill] = useState<Skill>("listening");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const { data, isLoading } = usePracticeQuestions({
    skill,
    level: levelFilter ?? undefined,
    page: 1,
  });

  const startMutation = useStartPractice();

  const groups = useMemo(() => {
    const questions = data?.data ?? [];
    return groupByPart(questions);
  }, [data]);

  const handleStartWithQuestion = useCallback(
    (group: QuestionGroup) => {
      startMutation.mutate(
        { skill, mode: "free", level: group.level, part: group.part },
        {
          onSuccess: (res) => {
            router.push(`/(app)/practice/${skill}`);
          },
        },
      );
    },
    [skill, startMutation, router],
  );

  return (
    <ScreenWrapper noPadding>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Chọn câu hỏi</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn dạng bài muốn luyện</Text>
      </View>

      {/* Skill tabs */}
      <View style={[styles.tabsWrapper, { borderBottomColor: c.border }]}>
        <View style={styles.tabsRow}>
          {SKILLS.map((sk) => {
            const active = sk === skill;
            const color = useSkillColor(sk);
            return (
              <HapticTouchable
                key={sk}
                style={[styles.tabChip, {
                  backgroundColor: active ? color + "18" : c.muted,
                  borderColor: active ? color : "transparent",
                }]}
                onPress={() => { setSkill(sk); setLevelFilter(null); }}
              >
                <SkillIcon skill={sk} size={14} />
                <Text style={{ color: active ? color : c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>
                  {SKILL_LABELS[sk]}
                </Text>
              </HapticTouchable>
            );
          })}
        </View>
      </View>

      {/* Level filter chips */}
      <View style={styles.filterRow}>
        <HapticTouchable
          style={[styles.filterChip, { backgroundColor: !levelFilter ? c.primary + "18" : c.muted, borderColor: !levelFilter ? c.primary : "transparent" }]}
          onPress={() => setLevelFilter(null)}
        >
          <Text style={{ color: !levelFilter ? c.primary : c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>Tất cả</Text>
        </HapticTouchable>
        {LEVELS.map((lv) => (
          <HapticTouchable
            key={lv}
            style={[styles.filterChip, { backgroundColor: levelFilter === lv ? c.primary + "18" : c.muted, borderColor: levelFilter === lv ? c.primary : "transparent" }]}
            onPress={() => setLevelFilter(levelFilter === lv ? null : lv)}
          >
            <Text style={{ color: levelFilter === lv ? c.primary : c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>{lv}</Text>
          </HapticTouchable>
        ))}
      </View>

      {/* Question list */}
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={c.primary} />
      ) : (
        <BouncyFlatList
          data={groups}
          keyExtractor={(item: QuestionGroup) => `${item.part}-${item.level}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="search-outline" title="Không tìm thấy câu hỏi" subtitle="Thử đổi bộ lọc" />}
          renderItem={({ item }: { item: QuestionGroup }) => (
            <QuestionGroupCard
              group={item}
              skill={skill}
              onStart={() => handleStartWithQuestion(item)}
              isStarting={startMutation.isPending}
            />
          )}
        />
      )}
    </ScreenWrapper>
  );
}

function QuestionGroupCard({
  group,
  skill,
  onStart,
  isStarting,
}: {
  group: QuestionGroup;
  skill: Skill;
  onStart: () => void;
  isStarting: boolean;
}) {
  const c = useThemeColors();
  const skillColor = useSkillColor(skill);

  const partLabels: Record<string, Record<number, string>> = {
    listening: { 1: "Nghe ngắn", 2: "Nghe hội thoại", 3: "Nghe bài giảng" },
    reading: { 1: "Đọc hiểu đoạn ngắn", 2: "True/Not Given", 3: "Gap Fill", 4: "Matching" },
    writing: { 1: "Email / Thư", 2: "Bài luận" },
    speaking: { 1: "Phỏng vấn", 2: "Thảo luận tình huống", 3: "Phát triển ý" },
  };

  const partLabel = partLabels[skill]?.[group.part] ?? `Part ${group.part}`;

  // Extract description from first question content
  const content = group.sample.content as Record<string, unknown>;
  const description = (content?.title as string) ??
    (content?.passage as string)?.slice(0, 80) ??
    (content?.prompt as string)?.slice(0, 80) ??
    null;

  return (
    <HapticTouchable
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onStart}
      disabled={isStarting}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: c.foreground, fontWeight: "700", fontSize: fontSize.sm }}>{partLabel}</Text>
          {description && (
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }} numberOfLines={2}>{description}</Text>
          )}
        </View>
        <Ionicons name="play-circle" size={28} color={skillColor} />
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.badge, { backgroundColor: skillColor + "15" }]}>
          <Text style={{ color: skillColor, fontSize: 10, fontWeight: "700" }}>{group.level}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.muted }]}>
          <Ionicons name="list-outline" size={10} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontSize: 10, fontWeight: "600" }}>{group.itemCount} câu</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.muted }]}>
          <Ionicons name="documents-outline" size={10} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontSize: 10, fontWeight: "600" }}>{group.questions.length} bài</Text>
        </View>
      </View>
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1 },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  tabsWrapper: { borderBottomWidth: 1 },
  tabsRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5 },
  filterRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  filterChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5 },
  list: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"], flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardBottom: { flexDirection: "row", gap: spacing.sm },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
});
