import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { MascotEmpty } from "@/components/MascotStates";
import { useWritingPrompts } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const PARTS = [
  { part: 1, label: "Task 1 — Viết thư",  desc: "Viết thư theo tình huống. Hệ thống chấm cấu trúc, ngữ pháp, từ vựng." },
  { part: 2, label: "Task 2 — Viết luận", desc: "Viết luận nghị luận. Hệ thống chấm lập luận, mạch lạc, ngôn ngữ." },
];

const COLOR = "#58CC02";

function chunkPairs<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }
  return result;
}

export default function WritingListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: prompts, isLoading, isError } = useWritingPrompts();

  const grouped = new Map<number, typeof prompts>();
  if (prompts) {
    for (const p of prompts) {
      const list = grouped.get(p.part) ?? [];
      list.push(p);
      grouped.set(p.part, list);
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
        <Text style={[s.title, { color: c.foreground }]}>Luyện viết</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>Thư + luận · hệ thống chấm theo rubric Bộ GD</Text>
      </View>

      <HapticTouchable scalePress activeOpacity={0.9} onPress={() => router.push("/(app)/practice/writing/history" as never)}>
        <View
          style={[
            s.resultsCard,
            { backgroundColor: c.card, borderColor: COLOR + "40", borderBottomColor: COLOR },
          ]}
        >
          <View style={[s.resultsIcon, { backgroundColor: COLOR + "18" }]}>
            <GameIcon name="writing" size={30} />
          </View>
          <View style={s.resultsBody}>
            <Text style={[s.resultsTitle, { color: c.foreground }]}>Kết quả chấm bài viết</Text>
            <Text style={[s.resultsSub, { color: c.mutedForeground }]}>Xem lại các bài viết đã được chấm điểm chi tiết.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLOR} />
        </View>
      </HapticTouchable>

      {isLoading && (
        <View style={s.center}><ActivityIndicator color={COLOR} size="large" /></View>
      )}

      {isError && (
        <View style={s.center}>
          <Text style={{ color: "#EA4335", fontSize: 14, textAlign: "center" }}>Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.</Text>
        </View>
      )}

      {!isLoading && !isError && PARTS.map(({ part, label, desc }) => {
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
                {chunkPairs(list).map((pair, rowIdx) => (
                  <View key={rowIdx} style={s.cardRow}>
                    {pair.map((p) => (
                      <View key={p.id} style={s.cardWrapper}>
                        <HapticTouchable
                          scalePress
                          onPress={() => router.push(`/(app)/practice/writing/${p.id}` as never)}
                          style={s.cardTouchable}
                        >
                          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                            <View style={[s.taskBadge, { backgroundColor: COLOR + "18" }]}>
                              <Text style={[s.taskBadgeText, { color: COLOR }]}>Task {p.part}</Text>
                            </View>
                            <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={3}>{p.title}</Text>
                            <View style={s.cardMeta}>
                              <GameIcon name="writing" size={14} />
                              <Text style={[s.cardMetaText, { color: c.mutedForeground }]}>
                                {p.minWords}–{p.maxWords} từ{p.estimatedMinutes ? ` · ${p.estimatedMinutes} phút` : ""}
                              </Text>
                            </View>
                          </View>
                        </HapticTouchable>
                      </View>
                    ))}
                    {pair.length === 1 && <View style={s.cardWrapper} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {!isLoading && !isError && prompts?.length === 0 && (
        <MascotEmpty mascot="think" title="Chưa có đề viết" subtitle="Nội dung đang được cập nhật." />
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
  resultsCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  resultsIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsBody: { flex: 1, minWidth: 0 },
  resultsTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  resultsSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 18 },
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  partLabel: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, marginBottom: 2 },
  partDesc: { fontSize: fontSize.xs, marginBottom: spacing.md },
  emptyCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  emptyText: { fontSize: fontSize.sm },
  cardGrid: { gap: spacing.md },
  cardRow: { flexDirection: "row", gap: spacing.md },
  cardWrapper: { flex: 1, height: 220 },
  cardTouchable: { flex: 1, height: 220 },
  card: {
    height: 220,
    borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg,
    padding: spacing.base, gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  taskBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  taskBadgeText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20, height: 84 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: "auto" },
  cardMetaText: { fontSize: fontSize.xs },
});
