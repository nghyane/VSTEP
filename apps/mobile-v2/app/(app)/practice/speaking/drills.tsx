import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { MascotEmpty } from "@/components/MascotStates";
import { useSpeakingDrills } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";
const COLOR_TEXT = "#A07800";

export default function SpeakingDrillsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: drills, isLoading, isError } = useSpeakingDrills();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Luyện nói</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Speaking Drills</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>Shadowing và dictation theo câu ngắn</Text>
      </View>

      {isLoading && <View style={s.center}><ActivityIndicator color={COLOR} size="large" /></View>}

      {isError && (
        <View style={s.center}>
          <Text style={[s.errorText, { color: c.destructive }]}>Không thể tải drill. Vui lòng thử lại.</Text>
        </View>
      )}

      {!isLoading && !isError && (!drills || drills.length === 0) && (
        <MascotEmpty mascot="think" title="Chưa có drill" subtitle="Nội dung đang được cập nhật." />
      )}

      {drills && drills.length > 0 && (
        <View style={s.list}>
          {drills.map((drill) => (
            <HapticTouchable
              key={drill.id}
              scalePress
              onPress={() => router.push(`/(app)/practice/speaking/drill/${drill.id}` as any)}
            >
              <DepthCard style={s.card}>
                <View style={s.cardHeader}>
                  <View style={[s.levelBadge, { backgroundColor: COLOR + "25" }]}> 
                    <Text style={[s.levelText, { color: COLOR_TEXT }]}>{drill.level}</Text>
                  </View>
                  <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={2}>{drill.title}</Text>
                </View>
                <View style={s.metaRow}>
                  <Ionicons name="mic-outline" size={14} color={COLOR_TEXT} />
                  <Text style={[s.metaText, { color: c.mutedForeground }]}> {drill.estimatedMinutes ?? 5} phút</Text>
                </View>
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
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  errorText: { fontSize: fontSize.sm, textAlign: "center" },
  list: { gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  levelText: { fontSize: 10, fontFamily: fontFamily.bold },
  cardTitle: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.bold },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: fontSize.xs },
});
