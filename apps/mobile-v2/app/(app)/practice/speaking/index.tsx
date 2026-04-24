import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useSpeakingTasks } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";

export default function SpeakingListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: tasks, isLoading, isError } = useSpeakingTasks();

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
        <Text style={[s.title, { color: c.foreground }]}>Luyện nói</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>3 phần theo format VSTEP · Ghi âm + AI chấm</Text>
      </View>

      {isLoading && (
        <View style={s.center}><ActivityIndicator color={COLOR} size="large" /></View>
      )}

      {isError && (
        <View style={s.center}>
          <Text style={{ color: "#EA4335", fontSize: 14, textAlign: "center" }}>Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.</Text>
        </View>
      )}

      {!isLoading && tasks && tasks.length > 0 && (
        <View>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>VSTEP SPEAKING</Text>
          <View style={s.cardGrid}>
            {tasks.map((task) => (
              <HapticTouchable
                key={task.id}
                scalePress
                style={s.cardWrapper}
                onPress={() => router.push(`/(app)/practice/speaking/${task.id}` as any)}
              >
                <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                  <View style={[s.partBadge, { backgroundColor: COLOR + "25" }]}>
                    <Text style={[s.partBadgeText, { color: "#A07800" }]}>Part {task.part}</Text>
                  </View>
                  <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={3}>{task.title}</Text>
                  <View style={s.cardMeta}>
                    <Ionicons name="mic-outline" size={12} color={COLOR} />
                    <Text style={[s.cardMetaText, { color: c.mutedForeground }]}>
                      {task.speakingSeconds}s · {task.taskType}
                    </Text>
                  </View>
                </View>
              </HapticTouchable>
            ))}
          </View>
        </View>
      )}

      {!isLoading && (!tasks || tasks.length === 0) && (
        <MascotEmpty mascot="think" title="Chưa có bài nói" subtitle="Nội dung đang được cập nhật." />
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
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.md },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cardWrapper: { width: "47%" },
  card: {
    borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg,
    padding: spacing.base, gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  partBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  partBadgeText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: fontSize.xs },
});
