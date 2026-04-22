import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
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

      <Text style={[s.title, { color: c.foreground }]}>Ngữ pháp</Text>
      <Text style={[s.sub, { color: c.mutedForeground }]}>
        Điểm ngữ pháp có cấu trúc, từ cơ bản đến nâng cao.
      </Text>

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
        <View style={s.list}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>
            {`${points.length} ĐIỂM NGỮ PHÁP`}
          </Text>
          {points.map((point) => (
            <HapticTouchable
              key={point.id}
              style={[s.row, { borderBottomColor: c.borderLight }]}
              activeOpacity={0.7}
            >
              <View style={[s.rowIcon, { backgroundColor: "#F3EAFF" }]}>
                <GameIcon name="pencil" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowName, { color: c.foreground }]}>{point.name}</Text>
                {point.vietnameseName ? (
                  <Text style={[s.rowSub, { color: c.mutedForeground }]}>{point.vietnameseName}</Text>
                ) : null}
                {point.levels.length > 0 ? (
                  <View style={s.levelRow}>
                    {point.levels.map((lvl) => (
                      <View key={lvl} style={[s.levelPill, { backgroundColor: c.muted }]}>
                        <Text style={[s.levelText, { color: c.mutedForeground }]}>{lvl}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={14} color={c.subtle} />
            </HapticTouchable>
          ))}
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
  sub: { fontSize: fontSize.sm, lineHeight: 20 },
  loadingWrap: { paddingVertical: spacing["2xl"], alignItems: "center" },
  list: { gap: 0 },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.base, borderBottomWidth: 1 },
  rowIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  rowSub: { fontSize: fontSize.xs, marginTop: 2 },
  levelRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  levelPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  levelText: { fontSize: 10, fontFamily: fontFamily.medium },
});
