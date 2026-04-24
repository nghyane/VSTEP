import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useGrammarPoints } from "@/hooks/use-grammar";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function GrammarScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: points, isLoading } = useGrammarPoints();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Quay lại</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Ngữ pháp</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>
          Cấu trúc câu theo level · Luyện tập + VSTEP tips
        </Text>
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      {!isLoading && (!points || points.length === 0) ? (
        <MascotEmpty
          mascot="think"
          title="Chưa có điểm ngữ pháp"
          subtitle="Hệ thống ngữ pháp đang được cập nhật. Vui lòng quay lại sau!"
        />
      ) : null}

      {points && points.length > 0 ? (
        <View>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>
            {`${points.length} ĐIỂM NGỮ PHÁP`}
          </Text>
          <View style={s.grid}>
            {points.map((point) => (
              <HapticTouchable
                key={point.id}
                scalePress
                activeOpacity={0.9}
                onPress={() => router.push(`/(app)/practice/grammar/${point.id}` as any)}
                style={s.cardWrapper}
              >
                <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                  <Text style={[s.cardName, { color: c.foreground }]} numberOfLines={2}>
                    {point.name}
                  </Text>
                  {point.vietnameseName ? (
                    <Text style={[s.cardVi, { color: c.mutedForeground }]} numberOfLines={1}>
                      {point.vietnameseName}
                    </Text>
                  ) : null}
                  {point.summary ? (
                    <Text style={[s.cardSummary, { color: c.subtle }]} numberOfLines={2}>
                      {point.summary}
                    </Text>
                  ) : null}
                  {(point.levels.length > 0 || point.tasks.length > 0) ? (
                    <View style={s.pillRow}>
                      {point.levels.map((lvl) => (
                        <View key={lvl} style={[s.pill, { backgroundColor: c.primaryTint }]}>
                          <Text style={[s.pillText, { color: c.primary }]}>{lvl}</Text>
                        </View>
                      ))}
                      {point.tasks.map((t) => (
                        <View key={t} style={[s.pill, { backgroundColor: c.muted }]}>
                          <Text style={[s.pillText, { color: c.mutedForeground }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </HapticTouchable>
            ))}
          </View>
        </View>
      ) : null}

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
  sub: { fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.xs },
  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cardWrapper: { width: "47%" },
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xs,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20, marginBottom: 2 },
  cardVi: { fontSize: fontSize.xs, lineHeight: 16 },
  cardSummary: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 2 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  pillText: { fontSize: 10, fontFamily: fontFamily.bold },
});
