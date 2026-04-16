import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useExams } from "@/hooks/use-exams";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Exam, Skill } from "@/types/api";

type FilterType = "all" | "free" | "pro";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function ExamsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useExams({ type: "mock" });
  const [filter, setFilter] = useState<FilterType>("all");

  if (isLoading) return <LoadingScreen />;
  const exams = data?.data ?? [];
  const filtered = exams.filter((e) => {
    if (filter === "pro") return Number(e.id.replace(/\D/g, "")) % 2 === 0;
    if (filter === "free") return Number(e.id.replace(/\D/g, "")) % 2 !== 0;
    return true;
  });

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={[s.title, { color: c.foreground }]}>Thư viện đề thi VSTEP</Text>
      <Text style={[s.subtitle, { color: c.mutedForeground }]}>Luyện tập với hàng trăm đề thi bám sát cấu trúc thật.</Text>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {(["all", "free", "pro"] as FilterType[]).map((f) => (
          <HapticTouchable key={f} style={[s.filterChip, { borderColor: filter === f ? c.primary : c.border, backgroundColor: filter === f ? c.primary + "0D" : "transparent" }]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, { color: filter === f ? c.primary : c.mutedForeground }]}>
              {f === "all" ? "Tất cả" : f === "free" ? "Miễn phí" : "Pro"}
            </Text>
          </HapticTouchable>
        ))}
      </View>

      {/* Exam cards */}
      <View style={s.grid}>
        {filtered.map((exam) => (
          <ExamCard key={exam.id} exam={exam} onPress={() => router.push(`/(app)/exam/${exam.id}`)} />
        ))}
      </View>

      {filtered.length === 0 && (
        <View style={[s.empty, { borderColor: c.border }]}>
          <Text style={[s.emptyText, { color: c.mutedForeground }]}>Không tìm thấy đề thi phù hợp</Text>
        </View>
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function ExamCard({ exam, onPress }: { exam: Exam; onPress: () => void }) {
  const c = useThemeColors();
  const isPro = Number(exam.id.replace(/\D/g, "")) % 2 === 0;

  return (
    <HapticTouchable style={[s.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      {/* Badge */}
      {isPro ? (
        <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>
      ) : (
        <View style={[s.freeBadge, { borderColor: c.border }]}><Text style={[s.freeBadgeText, { color: c.mutedForeground }]}>FREE</Text></View>
      )}

      <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>{exam.title}</Text>

      {/* Meta */}
      <View style={s.metaRow}>
        <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
        <Text style={[s.metaText, { color: c.mutedForeground }]}>172 phút</Text>
        <Ionicons name="people-outline" size={14} color={c.mutedForeground} style={{ marginLeft: spacing.md }} />
        <Text style={[s.metaText, { color: c.mutedForeground }]}>1.2k lượt thi</Text>
      </View>

      {/* Skill chips */}
      <View style={s.chipRow}>
        {SKILL_ORDER.map((sk) => {
          const color = useSkillColor(sk);
          return (
            <View key={sk} style={[s.skillChip, { backgroundColor: color + "15" }]}>
              <Text style={[s.skillChipText, { color }]}>{SKILL_LABELS[sk]}</Text>
            </View>
          );
        })}
      </View>

      {/* Tags */}
      <View style={s.tagRow}>
        <View style={[s.tag, { backgroundColor: c.muted }]}><Text style={[s.tagText, { color: c.mutedForeground }]}>#FullTest</Text></View>
        <View style={[s.tag, { backgroundColor: c.muted }]}><Text style={[s.tagText, { color: c.mutedForeground }]}>#HNUE</Text></View>
      </View>

      {/* Footer */}
      <View style={[s.cardFooter, { borderTopColor: c.border }]}>
        <Text style={[s.statusText, { color: c.mutedForeground }]}>Trạng thái: <Text style={{ fontFamily: fontFamily.semiBold }}>Chưa làm</Text></Text>
        <View style={[s.viewBtn, { backgroundColor: c.primary }]}>
          <Text style={s.viewBtnText}>Xem đề</Text>
        </View>
      </View>
    </HapticTouchable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  // Filter
  filterRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.base },
  filterChip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  filterText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  // Grid
  grid: { gap: spacing.base },
  // Card
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  proBadge: { alignSelf: "flex-start", backgroundColor: "#F59E0B", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  proBadgeText: { color: "#fff", fontSize: 10, fontFamily: fontFamily.bold, textTransform: "uppercase", letterSpacing: 1 },
  freeBadge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  freeBadgeText: { fontSize: 10, fontFamily: fontFamily.semiBold, textTransform: "uppercase", letterSpacing: 1 },
  cardTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.semiBold, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.sm },
  chipRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  skillChip: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  skillChipText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  tagRow: { flexDirection: "row", gap: spacing.sm },
  tag: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.xs },
  statusText: { fontSize: fontSize.xs },
  viewBtn: { borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  viewBtnText: { color: "#fff", fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  // Empty
  empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: radius.xl, paddingVertical: spacing["3xl"], alignItems: "center" },
  emptyText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
});
