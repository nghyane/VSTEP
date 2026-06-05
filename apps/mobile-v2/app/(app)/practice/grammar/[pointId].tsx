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
import { useGrammarPointDetail, type GrammarPoint, type GrammarPointDetail } from "@/hooks/use-grammar";
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
          <PointHeader detail={detail} />
          <LearningDesign point={detail.point} />

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
                <DepthCard
                  key={t.id}
                  style={{ marginBottom: spacing.sm, backgroundColor: c.infoTint, borderColor: c.info + "40", borderBottomColor: c.info }}
                >
                  <Text style={[s.tipTask, { color: c.info }]}>{t.task}</Text>
                  <Text style={[s.tipText, { color: c.foreground }]}>{t.tip}</Text>
                  {t.example && (
                    <Text style={[s.tipExample, { color: c.mutedForeground }]}>{`"${t.example}"`}</Text>
                  )}
                </DepthCard>
              ))}
            </View>
          )}

          {detail.exercises.length > 0 && (
            <View style={s.ctaWrap}>
              <DepthButton onPress={() => router.push(`/(app)/practice/grammar/${pointId}/exercise` as never)}>
                {`Luyện tập · ${detail.exercises.length} câu`}
              </DepthButton>
            </View>
          )}
        </>
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function PointHeader({ detail }: { detail: GrammarPointDetail }) {
  const c = useThemeColors();
  const { point } = detail;

  return (
    <DepthCard style={s.headerCard}>
      <View style={s.headerTitleRow}>
        <Text style={[s.pointName, { color: c.foreground }]}>{point.name}</Text>
        {point.isCheckpoint ? (
          <View style={[s.checkpointBadge, { backgroundColor: c.warningTint }]}>
            <Text style={[s.checkpointText, { color: c.warning }]}>Checkpoint</Text>
          </View>
        ) : null}
      </View>
      {point.vietnameseName ? <Text style={[s.pointVi, { color: c.mutedForeground }]}>{point.vietnameseName}</Text> : null}
      {point.summary ? <Text style={[s.pointSummary, { color: c.subtle }]}>{point.summary}</Text> : null}
    </DepthCard>
  );
}

function LearningDesign({ point }: { point: GrammarPoint }) {
  const c = useThemeColors();
  const hasContent =
    point.learningObjective ||
    point.successCriteria ||
    point.cefrDescriptor ||
    point.vstepUseCase ||
    (point.prerequisiteSlugs?.length ?? 0) > 0;

  if (!hasContent) return null;

  return (
    <DepthCard style={s.learningCard}>
      <Text style={[s.learningTitle, { color: c.foreground }]}>Bạn sẽ học gì?</Text>
      {point.learningObjective ? (
        <InfoBlock label="Mục tiêu" text={point.learningObjective} />
      ) : null}
      {point.successCriteria ? (
        <InfoBlock label="Khi nào được xem là đạt?" text={point.successCriteria} />
      ) : null}
      {(point.prerequisiteSlugs?.length ?? 0) > 0 ? (
        <View>
          <Text style={[s.infoLabel, { color: c.subtle }]}>Nên học trước</Text>
          <View style={s.prereqRow}>
            {point.prerequisiteSlugs?.map((slug) => (
              <View key={slug} style={[s.prereqPill, { backgroundColor: c.background }]}>
                <Text style={[s.prereqText, { color: c.mutedForeground }]}>{slug}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {(point.cefrDescriptor || point.vstepUseCase) ? (
        <View style={s.infoGrid}>
          {point.cefrDescriptor ? <InfoTile label="Liên hệ CEFR" text={point.cefrDescriptor} /> : null}
          {point.vstepUseCase ? <InfoTile label="Ứng dụng VSTEP" text={point.vstepUseCase} /> : null}
        </View>
      ) : null}
    </DepthCard>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={[s.infoLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[s.infoText, { color: c.foreground }]}>{text}</Text>
    </View>
  );
}

function InfoTile({ label, text }: { label: string; text: string }) {
  const c = useThemeColors();
  return (
    <View style={[s.infoTile, { backgroundColor: c.background }]}>
      <Text style={[s.infoTileLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[s.infoTileText, { color: c.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  // Header card
  headerCard: { gap: spacing.xs, padding: spacing.lg },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pointName: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  pointVi: { fontSize: fontSize.sm, marginTop: 2 },
  pointSummary: { fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  checkpointBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  checkpointText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  learningCard: { gap: spacing.md, padding: spacing.lg },
  learningTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  infoLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  infoText: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 4 },
  prereqRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  prereqPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  prereqText: { fontSize: fontSize.xs },
  infoGrid: { gap: spacing.sm },
  infoTile: { borderRadius: radius.lg, padding: spacing.md },
  infoTileLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  infoTileText: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 4 },
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
  ctaWrap: { alignItems: "center" },
});
