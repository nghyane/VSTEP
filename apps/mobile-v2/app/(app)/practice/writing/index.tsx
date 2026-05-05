import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useWritingPrompts } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const PARTS = [
  { part: 1, label: "Task 1 — Viết thư",  desc: "Viết thư theo tình huống. AI chấm cấu trúc, ngữ pháp, từ vựng." },
  { part: 2, label: "Task 2 — Viết luận", desc: "Viết luận nghị luận. AI chấm lập luận, mạch lạc, ngôn ngữ." },
];

const COLOR = "#58CC02";

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

      <View style={s.headerRow}>
        <View>
          <Text style={[s.title, { color: c.foreground }]}>Luyện viết</Text>
          <Text style={[s.sub, { color: c.mutedForeground }]}>Thư + luận · AI chấm theo rubric Bộ GD</Text>
        </View>
        <HapticTouchable
          scalePress
          style={[s.historyBtn, { borderColor: c.border }]}
          onPress={() => router.push("/(app)/practice/writing/history" as any)}
        >
          <Ionicons name="time-outline" size={18} color={c.primary} />
        </HapticTouchable>
      </View>

      {isLoading && (
        <View style={s.center}><ActivityIndicator color={COLOR} size="large" /></View>
      )}

      {isError && (
        <View style={s.center}>
          <Text style={{ color: "#EA4335", fontSize: 14, textAlign: "center" }}>Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.</Text>
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
                {list.map((p) => (
                  <HapticTouchable
                    key={p.id}
                    scalePress
                    style={s.cardWrapper}
                    onPress={() => router.push(`/(app)/practice/writing/${p.id}` as any)}
                  >
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                      <View style={[s.taskBadge, { backgroundColor: COLOR + "18" }]}>
                        <Text style={[s.taskBadgeText, { color: COLOR }]}>Task {p.part}</Text>
                      </View>
                      <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={3}>{p.title}</Text>
                      <View style={s.cardMeta}>
                        <Ionicons name="create-outline" size={12} color={COLOR} />
                        <Text style={[s.cardMetaText, { color: c.mutedForeground }]}>
                          {p.minWords}–{p.maxWords} từ{p.estimatedMinutes ? ` · ${p.estimatedMinutes} phút` : ""}
                        </Text>
                      </View>
                    </View>
                  </HapticTouchable>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {!isLoading && prompts?.length === 0 && (
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  historyBtn: { borderWidth: 2, borderRadius: radius.full, padding: spacing.sm, marginTop: spacing.sm },
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  partLabel: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, marginBottom: 2 },
  partDesc: { fontSize: fontSize.xs, marginBottom: spacing.md },
  emptyCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  emptyText: { fontSize: fontSize.sm },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cardWrapper: { width: "47%" },
  card: {
    borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg,
    padding: spacing.base, gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  taskBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  taskBadgeText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: fontSize.xs },
});
