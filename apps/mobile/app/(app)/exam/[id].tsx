import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useExamDetail } from "@/hooks/use-exams";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Skill } from "@/types/api";
import { GameIcon } from "@/components/GameIcon";
import { computeSessionCost, spendCoins, useCoins } from "@/features/coin/coin-store";
import { TopUpDialog } from "@/features/coin/TopUpDialog";

// ─── Mock exam sections (aligned with frontend-v2 thi-thu) ───────

interface ExamSection {
  id: string;
  skill: Skill;
  part: number;
  title: string;
  description: string;
  questionCount: number;
  unit: string;
  durationMinutes: number;
}

const VSTEP_SECTIONS: ExamSection[] = [
  { id: "listening-1", skill: "listening", part: 1, title: "Phần 1", description: "Thông báo ngắn", questionCount: 8, unit: "câu", durationMinutes: 7 },
  { id: "listening-2", skill: "listening", part: 2, title: "Phần 2", description: "Hội thoại", questionCount: 12, unit: "câu", durationMinutes: 13 },
  { id: "listening-3", skill: "listening", part: 3, title: "Phần 3", description: "Bài giảng", questionCount: 15, unit: "câu", durationMinutes: 20 },
  { id: "reading-1", skill: "reading", part: 1, title: "Phần 1", description: "Bài đọc 1", questionCount: 10, unit: "câu", durationMinutes: 15 },
  { id: "reading-2", skill: "reading", part: 2, title: "Phần 2", description: "Bài đọc 2", questionCount: 10, unit: "câu", durationMinutes: 15 },
  { id: "reading-3", skill: "reading", part: 3, title: "Phần 3", description: "Bài đọc 3", questionCount: 10, unit: "câu", durationMinutes: 15 },
  { id: "reading-4", skill: "reading", part: 4, title: "Phần 4", description: "Bài đọc 4", questionCount: 10, unit: "câu", durationMinutes: 15 },
  { id: "writing-1", skill: "writing", part: 1, title: "Phần 1", description: "Viết thư (~120 từ)", questionCount: 1, unit: "bài", durationMinutes: 20 },
  { id: "writing-2", skill: "writing", part: 2, title: "Phần 2", description: "Viết luận (~250 từ)", questionCount: 1, unit: "bài", durationMinutes: 40 },
  { id: "speaking-1", skill: "speaking", part: 1, title: "Phần 1", description: "Tương tác xã hội", questionCount: 1, unit: "phần", durationMinutes: 4 },
  { id: "speaking-2", skill: "speaking", part: 2, title: "Phần 2", description: "Thảo luận giải pháp", questionCount: 1, unit: "phần", durationMinutes: 4 },
  { id: "speaking-3", skill: "speaking", part: 3, title: "Phần 3", description: "Phát triển chủ đề", questionCount: 1, unit: "phần", durationMinutes: 4 },
];

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_VN: Record<Skill, string> = { listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói" };

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exam, isLoading } = useExamDetail(id!);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (isLoading || !exam) return <LoadingScreen />;

  const totalMinutes = VSTEP_SECTIONS.reduce((s, sec) => s + sec.durationMinutes, 0);

  function toggleSection(sectionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  function toggleSkill(skill: Skill) {
    const ids = VSTEP_SECTIONS.filter((s) => s.skill === skill).map((s) => s.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      for (const sid of ids) allSelected ? next.delete(sid) : next.add(sid);
      return next;
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.base }]}>
        {/* Back */}
        <HapticTouchable onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>Thư viện đề thi</Text>
        </HapticTouchable>

        {/* Header */}
        <Text style={[styles.title, { color: c.foreground }]}>{exam.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={c.mutedForeground} />
          <Text style={[styles.metaText, { color: c.mutedForeground }]}>{totalMinutes} phút</Text>
        </View>

        {/* Skill chips */}
        <View style={styles.chipRow}>
          {SKILL_ORDER.map((skill) => (
            <SkillChip key={skill} skill={skill} />
          ))}
        </View>

        {/* Skill stats grid */}
        <View style={[styles.statsGrid, { borderColor: c.border, backgroundColor: c.muted + "50" }]}>
          {SKILL_ORDER.map((skill) => {
            const secs = VSTEP_SECTIONS.filter((s) => s.skill === skill);
            const mins = secs.reduce((s, sec) => s + sec.durationMinutes, 0);
            const count = secs.reduce((s, sec) => s + sec.questionCount, 0);
            const unit = secs[0]?.unit ?? "câu";
            return (
              <View key={skill} style={styles.statCell}>
                <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{SKILL_VN[skill]}</Text>
                <Text style={[styles.statValue, { color: c.foreground }]}>{mins} phút</Text>
                <Text style={[styles.statSub, { color: c.mutedForeground }]}>{count} {unit}</Text>
              </View>
            );
          })}
        </View>

        {/* Section selector */}
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Chọn phần luyện tập</Text>
        <Text style={[styles.sectionHint, { color: c.mutedForeground }]}>
          {selected.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selected.size} phần đã chọn`}
        </Text>

        {SKILL_ORDER.map((skill) => {
          const secs = VSTEP_SECTIONS.filter((s) => s.skill === skill);
          const ids = secs.map((s) => s.id);
          const allSelected = ids.every((id) => selected.has(id));
          return (
            <SkillGroup
              key={skill}
              skill={skill}
              sections={secs}
              selected={selected}
              allSelected={allSelected}
              onToggleSection={toggleSection}
              onToggleSkill={() => toggleSkill(skill)}
            />
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar with coin cost */}
      <ExamBottomBar selected={selected} insets={insets} onStart={() => router.push(`/(app)/session/mock-session-${id}`)} />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function SkillChip({ skill }: { skill: Skill }) {
  const color = useSkillColor(skill);
  return (
    <View style={[styles.chip, { backgroundColor: color + "18" }]}>
      <Text style={[styles.chipText, { color }]}>{SKILL_LABELS[skill]}</Text>
    </View>
  );
}

function SkillGroup({ skill, sections, selected, allSelected, onToggleSection, onToggleSkill }: {
  skill: Skill; sections: ExamSection[]; selected: Set<string>; allSelected: boolean;
  onToggleSection: (id: string) => void; onToggleSkill: () => void;
}) {
  const c = useThemeColors();
  const color = useSkillColor(skill);
  const totalMins = sections.reduce((s, sec) => s + sec.durationMinutes, 0);
  const totalCount = sections.reduce((s, sec) => s + sec.questionCount, 0);
  const unit = sections[0]?.unit ?? "câu";

  return (
    <View style={[styles.groupCard, { borderColor: c.border, backgroundColor: c.card }]}>
      {/* Group header */}
      <View style={styles.groupHeader}>
        <View style={styles.groupHeaderLeft}>
          <View style={[styles.skillBar, { backgroundColor: color }]} />
          <Text style={[styles.groupSkillLabel, { color }]}>{SKILL_VN[skill]}</Text>
          <Text style={[styles.groupMeta, { color: c.mutedForeground }]}>{totalMins} phút · {totalCount} {unit}</Text>
        </View>
        <HapticTouchable
          style={[styles.selectAllBtn, allSelected ? { backgroundColor: color } : { backgroundColor: c.muted }]}
          onPress={onToggleSkill}
        >
          <Text style={[styles.selectAllText, { color: allSelected ? "#fff" : c.mutedForeground }]}>
            {allSelected ? "Bỏ chọn" : "Chọn tất cả"}
          </Text>
        </HapticTouchable>
      </View>

      {/* Section rows */}
      {sections.map((sec, idx) => {
        const isSelected = selected.has(sec.id);
        return (
          <HapticTouchable
            key={sec.id}
            style={[
              styles.sectionRow,
              idx < sections.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border + "66" },
              isSelected && { backgroundColor: color + "0D" },
            ]}
            onPress={() => onToggleSection(sec.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isSelected ? { backgroundColor: color, borderColor: color } : { borderColor: c.border }]}>
              {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionName, { color: c.foreground }]}>{sec.title} — {sec.description}</Text>
            </View>
            <Text style={[styles.sectionMeta, { color: c.mutedForeground }]}>{sec.questionCount} {sec.unit} · {sec.durationMinutes}p</Text>
          </HapticTouchable>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────


function ExamBottomBar({ selected, insets, onStart }: { selected: Set<string>; insets: any; onStart: () => void }) {
  const c = useThemeColors();
  const coins = useCoins();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const skillCount = new Set(VSTEP_SECTIONS.filter(s => selected.has(s.id)).map(s => s.skill)).size;
  const cost = computeSessionCost(skillCount);

  function handleStart() {
    if (!spendCoins(cost)) {
      Alert.alert("Không đủ xu", "Bạn cần nạp thêm xu để làm bài.", [
        { text: "Nạp xu", onPress: () => setTopUpVisible(true) },
        { text: "Hủy", style: "cancel" },
      ]);
      return;
    }
    onStart();
  }

  return (
    <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + spacing.base }]}>
      <View style={styles.costRow}>
        <GameIcon name="coin" size={18} />
        <Text style={[styles.costText, { color: c.coinDark }]}>{cost} xu</Text>
        <Text style={[styles.balanceText, { color: c.mutedForeground }]}>({coins} xu còn lại)</Text>
      </View>
      <HapticTouchable
        style={[styles.startBtn, { backgroundColor: c.primary }]}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Ionicons name="play" size={18} color={c.primaryForeground} />
        <Text style={[styles.startBtnText, { color: c.primaryForeground }]}>
          {selected.size === 0 ? "Bắt đầu Full Test" : `Bắt đầu (${selected.size} phần)`}
        </Text>
      </HapticTouchable>
      <TopUpDialog visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.base },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  metaText: { fontSize: fontSize.sm },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.base },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  statsGrid: { flexDirection: "row", borderWidth: 1, borderRadius: radius.md, marginTop: spacing.base, overflow: "hidden" },
  statCell: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  statLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  statValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, marginTop: 2 },
  statSub: { fontSize: 11, marginTop: 1 },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.semiBold, marginTop: spacing.xl },
  sectionHint: { fontSize: fontSize.xs, marginTop: 4, marginBottom: spacing.base },
  groupCard: { borderWidth: 1, borderRadius: radius.xl, marginBottom: spacing.base, overflow: "hidden" },
  groupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  groupHeaderLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skillBar: { width: 4, height: 20, borderRadius: 2 },
  groupSkillLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  groupMeta: { fontSize: fontSize.xs },
  selectAllBtn: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  selectAllText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  sectionName: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  sectionMeta: { fontSize: fontSize.xs },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  costRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  costText: { fontSize: 14, fontFamily: "Nunito-Bold" },
  balanceText: { fontSize: 12 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg },
  startBtnText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
});
