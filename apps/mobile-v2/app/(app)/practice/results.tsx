// Practice grading history — list of AI-graded writing submissions.
// Mirrors apps/frontend-v3/src/routes/_app/luyen-tap/ket-qua.tsx + GradingHistory.tsx.
// Each item navigates to the full grading detail screen.
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MascotEmpty } from "@/components/MascotStates";
import { useWritingHistory } from "@/hooks/use-practice";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function GradingResultsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: items, isLoading } = useWritingHistory();

  if (isLoading) return <LoadingScreen />;

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
        <Text style={[s.title, { color: c.foreground }]}>Kết quả AI chấm</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>
          Tổng hợp bài Viết đã được AI chấm điểm.
        </Text>
      </View>

      {!items || items.length === 0 ? (
        <MascotEmpty
          mascot="think"
          title="Chưa có bài nào được AI chấm"
          subtitle="Nộp bài Viết để xem kết quả tại đây."
        />
      ) : (
        <View style={s.list}>
          {items.map((item) => (
            <HapticTouchable
              key={item.id}
              scalePress
              onPress={() =>
                router.push(`/(app)/grading/writing/${item.id}` as never)
              }
            >
              <DepthCard style={s.card}>
                <View style={[s.badge, { backgroundColor: c.skillWriting + "1A" }]}>
                  <Text style={[s.badgeText, { color: c.skillWriting }]}>W</Text>
                </View>
                <View style={s.body}>
                  <Text
                    style={[s.cardTitle, { color: c.foreground }]}
                    numberOfLines={2}
                  >
                    {item.prompt?.title ?? "Bài viết"}
                  </Text>
                  <Text style={[s.cardMeta, { color: c.mutedForeground }]}>
                    {formatShortDate(item.submittedAt)} · {item.wordCount} từ
                    {item.prompt ? ` · Part ${item.prompt.part}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.skillWriting} />
              </DepthCard>
            </HapticTouchable>
          ))}
        </View>
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 20 },
  list: { gap: spacing.md },
  card: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  body: { flex: 1, gap: 2 },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
  cardMeta: { fontSize: fontSize.xs },
});
