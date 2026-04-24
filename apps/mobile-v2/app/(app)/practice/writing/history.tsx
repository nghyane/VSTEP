import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { MascotEmpty } from "@/components/MascotStates";
import { useWritingHistory, type WritingHistoryItem } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function WritingHistoryScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError } = useWritingHistory();

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <HapticTouchable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]}>Lịch sử bài viết</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={s.center}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        )}

        {isError && (
          <View style={s.center}>
            <Text style={[s.errorText, { color: c.destructive }]}>
              Không thể tải lịch sử. Kiểm tra kết nối và thử lại.
            </Text>
          </View>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <MascotEmpty
            mascot="think"
            title="Chưa có bài viết nào"
            subtitle="Hãy bắt đầu luyện viết để xem lịch sử tại đây."
          />
        )}

        {data && data.length > 0 && (
          <View style={s.list}>
            {data.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HistoryCard({ item }: { item: WritingHistoryItem }) {
  const c = useThemeColors();
  const router = useRouter();

  const dateStr = item.submittedAt
    ? new Date(item.submittedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Không rõ";

  return (
    <HapticTouchable
      style={s.cardWrapper}
      onPress={() =>
        router.push(
          `/(app)/grading/writing/${item.id}` as any,
        )
      }
    >
      <DepthCard style={s.card}>
        <View style={s.cardHeader}>
          <Text style={[s.cardTitle, { color: c.foreground }]}>
            {item.prompt?.title ?? "Bài viết không rõ đề"}
          </Text>
          {item.prompt && (
            <View style={[s.partBadge, { backgroundColor: c.primaryTint }]}>
              <Text style={[s.partBadgeText, { color: c.primary }]}>
                Task {item.prompt.part}
              </Text>
            </View>
          )}
        </View>

        <View style={s.cardMeta}>
          <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
          <Text style={[s.metaText, { color: c.mutedForeground }]}>{dateStr}</Text>
        </View>

        <View style={s.cardMeta}>
          <Ionicons name="document-text-outline" size={14} color={c.mutedForeground} />
          <Text style={[s.metaText, { color: c.mutedForeground }]}>
            {item.wordCount} từ
          </Text>
        </View>
      </DepthCard>
    </HapticTouchable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: spacing.xs },
  topBarTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    marginLeft: spacing.sm,
  },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  center: { paddingVertical: spacing["3xl"], alignItems: "center" },
  errorText: { fontSize: fontSize.sm, textAlign: "center" },
  list: { gap: spacing.md },
  cardWrapper: {},
  card: { padding: spacing.lg, gap: spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, flex: 1 },
  partBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  partBadgeText: { fontSize: 10, fontFamily: fontFamily.bold },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { fontSize: fontSize.xs },
});
