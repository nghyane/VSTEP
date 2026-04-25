import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotEmpty } from "@/components/MascotStates";
import { useGrammarPointDetail } from "@/hooks/use-grammar";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function GrammarDetailScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pointId } = useLocalSearchParams<{ pointId: string }>();
  const { data: detail, isLoading } = useGrammarPointDetail(pointId ?? "");

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Ngữ pháp</Text>
      </HapticTouchable>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      )}

      {!isLoading && !detail && (
        <MascotEmpty mascot="think" title="Không tìm thấy" subtitle="Điểm ngữ pháp này không tồn tại." />
      )}

      {detail && (
        <>
          {/* Header */}
          <DepthCard style={s.headerCard}>
            <View style={s.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={[s.pointName, { color: c.foreground }]}>{detail.point.name}</Text>
                {detail.point.vietnameseName && (
                  <Text style={[s.pointVi, { color: c.mutedForeground }]}>{detail.point.vietnameseName}</Text>
                )}
                {detail.point.summary && (
                  <Text style={[s.pointSummary, { color: c.subtle }]}>{detail.point.summary}</Text>
                )}
              </View>
              {detail.mastery && (
                <View style={s.masteryBadge}>
                  <View style={[s.levelBadge, { backgroundColor: c.primaryTint }]}>
                    <Text style={[s.levelBadgeText, { color: c.primary }]}>{detail.mastery.computedLevel}</Text>
                  </View>
                  <Text style={[s.masteryMeta, { color: c.subtle }]}>
                    {detail.mastery.accuracyPercent}% · {detail.mastery.attempts} lần
                  </Text>
                </View>
              )}
            </View>
            <View style={s.pillRow}>
              {detail.point.levels.map((lv) => (
                <View key={lv} style={[s.pill, { backgroundColor: c.primaryTint }]}>
                  <Text style={[s.pillText, { color: c.primary }]}>{lv}</Text>
                </View>
              ))}
              {detail.point.functions.map((f) => (
                <View key={f} style={[s.pill, { backgroundColor: c.muted }]}>
                  <Text style={[s.pillText, { color: c.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </DepthCard>

          {/* CTA luyện tập */}
          {detail.exercises.length > 0 && (
            <DepthButton
              fullWidth
              onPress={() => router.push(`/(app)/practice/grammar/${pointId}/exercise` as any)}
            >
              {`Luyện tập · ${detail.exercises.length} câu`}
            </DepthButton>
          )}

          {/* Cấu trúc */}
          {detail.structures.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: c.foreground }]}>Cấu trúc</Text>
              {detail.structures.map((st) => (
                <DepthCard key={st.id} style={s.itemCard}>
                  <Text style={[s.monoText, { color: c.foreground }]}>{st.template}</Text>
                  {st.description && (
                    <Text style={[s.itemSub, { color: c.mutedForeground }]}>{st.description}</Text>
                  )}
                </DepthCard>
              ))}
            </View>
          )}

          {/* Ví dụ */}
          {detail.examples.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: c.foreground }]}>Ví dụ</Text>
              {detail.examples.map((ex) => (
                <DepthCard key={ex.id} style={s.itemCard}>
                  <Text style={[s.exEn, { color: c.foreground }]}>{ex.en}</Text>
                  <Text style={[s.exVi, { color: c.mutedForeground }]}>{ex.vi}</Text>
                  {ex.note && <Text style={[s.exNote, { color: c.subtle }]}>{ex.note}</Text>}
                </DepthCard>
              ))}
            </View>
          )}

          {/* Lỗi thường gặp */}
          {detail.commonMistakes.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: c.foreground }]}>Lỗi thường gặp</Text>
              {detail.commonMistakes.map((m) => (
                <DepthCard key={m.id} style={s.itemCard}>
                  <Text style={[s.mistakeWrong, { color: c.destructive }]}>{m.wrong}</Text>
                  <Text style={[s.mistakeCorrect, { color: c.primary }]}>{m.correct}</Text>
                  {m.explanation && (
                    <Text style={[s.itemSub, { color: c.mutedForeground }]}>{m.explanation}</Text>
                  )}
                </DepthCard>
              ))}
            </View>
          )}

          {/* VSTEP Tips */}
          {detail.vstepTips.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: c.foreground }]}>VSTEP Tips</Text>
              {detail.vstepTips.map((t) => (
                <DepthCard key={t.id} style={{ marginBottom: spacing.sm, backgroundColor: c.infoTint, borderColor: c.info + "40", borderBottomColor: c.info }}>
                  <Text style={[s.tipTask, { color: c.info }]}>{t.task}</Text>
                  <Text style={[s.tipText, { color: c.foreground }]}>{t.tip}</Text>
                  {t.example && (
                    <Text style={[s.tipExample, { color: c.mutedForeground }]}>{`"${t.example}"`}</Text>
                  )}
                </DepthCard>
              ))}
            </View>
          )}
        </>
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
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  // Header card
  headerCard: { gap: spacing.sm },
  headerTop: { flexDirection: "row", alignItems: "flex-start" },
  pointName: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  pointVi: { fontSize: fontSize.sm, marginTop: 2 },
  pointSummary: { fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  masteryBadge: { alignItems: "flex-end", marginLeft: spacing.md },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  levelBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  masteryMeta: { fontSize: 10, marginTop: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  pillText: { fontSize: 11, fontFamily: fontFamily.bold },
  // Sections
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  itemCard: { marginBottom: spacing.sm },
  monoText: { fontSize: fontSize.sm, fontFamily: "monospace" },
  itemSub: { fontSize: fontSize.xs, marginTop: 4, lineHeight: 18 },
  exEn: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  exVi: { fontSize: fontSize.sm, marginTop: 2 },
  exNote: { fontSize: fontSize.xs, marginTop: 4, fontStyle: "italic" },
  mistakeWrong: { fontSize: fontSize.sm, textDecorationLine: "line-through" },
  mistakeCorrect: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, marginTop: 2 },
  tipTask: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginBottom: 2 },
  tipText: { fontSize: fontSize.sm },
  tipExample: { fontSize: fontSize.xs, marginTop: 4, fontStyle: "italic" },
});
