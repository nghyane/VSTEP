import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useListeningExercises, useMcqProgress } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const PARTS = [
  { part: 1, label: "Part 1 — Hội thoại ngắn",    desc: "Nghe đoạn hội thoại ngắn, trả lời câu hỏi" },
  { part: 2, label: "Part 2 — Hội thoại dài",      desc: "Nghe hội thoại dài, trả lời câu hỏi chi tiết" },
  { part: 3, label: "Part 3 — Bài giảng",          desc: "Nghe bài giảng / thuyết trình, trả lời câu hỏi" },
];

const SKILL_COLOR = "#1CB0F6";

export default function ListeningListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exercises, isLoading, isError } = useListeningExercises();
  const { data: progress } = useMcqProgress("listening");

  const grouped = new Map<number, typeof exercises>();
  if (exercises) {
    for (const ex of exercises) {
      const list = grouped.get(ex.part) ?? [];
      list.push(ex);
      grouped.set(ex.part, list);
    }
  }

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Luyện tập</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Luyện nghe</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>3 phần · MCQ · chấm ngay</Text>
      </View>

      {isLoading && (
        <View style={s.center}><ActivityIndicator color={SKILL_COLOR} size="large" /></View>
      )}

      {isError && (
        <View style={s.center}>
          <Text style={[{ color: "#EA4335", fontSize: 14, textAlign: "center" }]}>Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.</Text>
        </View>
      )}

      {!isLoading && PARTS.map(({ part, label, desc }) => {
        const list = grouped.get(part) ?? [];
        return (
          <View key={part}>
            <Text style={[s.partLabel, { color: c.foreground }]}>{label}</Text>
            <Text style={[s.partDesc, { color: c.subtle }]}>{desc}</Text>
            {list.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <Text style={[s.emptyText, { color: c.subtle }]}>Sắp ra mắt</Text>
              </View>
            ) : (
              <View style={s.cardGrid}>
                {list.map((ex) => {
                  const p = progress?.[ex.id];
                  const pct = p && p.total > 0 ? Math.round((p.score / p.total) * 100) : null;
                  return (
                    <HapticTouchable
                      key={ex.id}
                      scalePress
                      style={s.cardWrapper}
                      onPress={() => router.push(`/(app)/practice/listening/${ex.id}` as any)}
                    >
                      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                        <View style={s.cardTop}>
                          <View style={[s.partBadge, { backgroundColor: SKILL_COLOR + "18" }]}>
                            <Text style={[s.partBadgeText, { color: SKILL_COLOR }]}>P{ex.part}</Text>
                          </View>
                          {pct !== null && (
                            <View style={[s.scoreBadge, { backgroundColor: pct >= 80 ? "#E6F8D4" : c.muted }]}>
                              <Text style={[s.scoreText, { color: pct >= 80 ? "#478700" : c.mutedForeground }]}>{pct}%</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>{ex.title}</Text>
                        {ex.description && (
                          <Text style={[s.cardDesc, { color: c.subtle }]} numberOfLines={2}>{ex.description}</Text>
                        )}
                        <View style={s.cardMeta}>
                          <Ionicons name="headset-outline" size={12} color={SKILL_COLOR} />
                          <Text style={[s.cardMetaText, { color: c.mutedForeground }]}>
                            {ex.estimatedMinutes ? `${ex.estimatedMinutes} phút` : "MCQ"}
                          </Text>
                        </View>
                      </View>
                    </HapticTouchable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {!isLoading && exercises?.length === 0 && (
        <MascotEmpty mascot="think" title="Chưa có bài nghe" subtitle="Nội dung đang được cập nhật." />
      )}

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
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  partLabel: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, marginBottom: 2 },
  partDesc: { fontSize: fontSize.xs, marginBottom: spacing.md },
  emptyCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  emptyText: { fontSize: fontSize.sm },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cardWrapper: { width: "47%" },
  card: {
    borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg,
    padding: spacing.base, gap: spacing.xs,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  partBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  partBadgeText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  scoreText: { fontSize: 10, fontFamily: fontFamily.bold },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
  cardDesc: { fontSize: fontSize.xs, lineHeight: 16 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardMetaText: { fontSize: fontSize.xs },
});
