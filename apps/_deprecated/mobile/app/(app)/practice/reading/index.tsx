import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { HapticTouchable } from "@/components/HapticTouchable";
import { Ionicons } from "@expo/vector-icons";
import { MascotEmpty } from "@/components/MascotStates";
import { useReadingExercises } from "@/features/practice/queries";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import type { ReadingExercise } from "@/features/practice/types";

export default function ReadingListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { data: exercises, isLoading } = useReadingExercises();

  const byPart: Record<number, ReadingExercise[]> = {};
  (exercises ?? []).forEach((e) => {
    if (!byPart[e.part]) byPart[e.part] = [];
    byPart[e.part].push(e);
  });

  return (
    <ScreenWrapper noPadding>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.pageTitle, { color: c.foreground }]}>Đọc</Text>
        <Text style={[s.pageSub, { color: c.subtle }]}>4 đoạn văn · đọc hiểu · MCQ</Text>

        {isLoading && <ActivityIndicator style={{ marginTop: spacing["2xl"] }} color={c.primary} />}

        {!isLoading && (exercises ?? []).length === 0 && (
          <MascotEmpty mascot="read" title="Chưa có bài đọc nào" subtitle="Nội dung đang được cập nhật" />
        )}

        {[1, 2, 3, 4].map((part) => {
          const items = byPart[part] ?? [];
          if (!items.length) return null;
          return (
            <View key={part} style={s.partSection}>
              <Text style={[s.partTitle, { color: c.foreground }]}>Part {part}</Text>
              <View style={s.cardList}>
                {items.map((ex) => (
                  <HapticTouchable
                    key={ex.id}
                    style={[s.card, { backgroundColor: c.card }]}
                    onPress={() => router.push(`/(app)/practice/reading/${ex.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cardTitle, { color: c.foreground }]}>{ex.title}</Text>
                      {ex.description && (
                        <Text style={[s.cardDesc, { color: c.subtle }]} numberOfLines={2}>{ex.description}</Text>
                      )}
                      {ex.estimatedMinutes && (
                        <View style={s.cardMeta}>
                          <Ionicons name="time-outline" size={12} color={c.placeholder} />
                          <Text style={[s.cardMetaText, { color: c.placeholder }]}>~{ex.estimatedMinutes} phút</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.placeholder} />
                  </HapticTouchable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing["3xl"] },
  pageTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  pageSub: { fontSize: fontSize.sm, marginTop: 2, marginBottom: spacing.xl },
  partSection: { marginBottom: spacing["2xl"] },
  partTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  cardList: { gap: spacing.sm },
  card: {
    ...depthNeutral,
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  cardDesc: { fontSize: fontSize.xs, marginTop: 2 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardMetaText: { fontSize: fontSize.xs },
});
