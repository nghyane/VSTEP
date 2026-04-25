import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { MascotEmpty } from "@/components/MascotStates";
import { useSpeakingDrillHistory, useSpeakingVstepHistory } from "@/hooks/use-practice";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";

export default function SpeakingHistoryScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vstep = useSpeakingVstepHistory();
  const drills = useSpeakingDrillHistory();
  const loading = vstep.isLoading || drills.isLoading;
  const empty = !loading && (vstep.data?.length ?? 0) === 0 && (drills.data?.length ?? 0) === 0;

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}> 
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Luyện nói</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Lịch sử luyện nói</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>Bài VSTEP và drill đã luyện</Text>
      </View>

      {loading ? <ActivityIndicator color={COLOR} size="large" /> : null}
      {empty ? <MascotEmpty mascot="think" title="Chưa có lịch sử" subtitle="Hãy bắt đầu luyện nói để xem lịch sử tại đây." /> : null}

      {vstep.data && vstep.data.length > 0 ? (
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>VSTEP SPEAKING</Text>
          {vstep.data.map((item) => (
            <HapticTouchable key={item.id} onPress={() => router.push(`/(app)/grading/speaking/${item.id}` as any)}>
              <DepthCard style={s.card}>
                <Text style={[s.cardTitle, { color: c.foreground }]}>Bài nói VSTEP</Text>
                <Text style={[s.meta, { color: c.mutedForeground }]}>{item.durationSeconds}s · {formatDate(item.submittedAt)}</Text>
              </DepthCard>
            </HapticTouchable>
          ))}
        </View>
      ) : null}

      {drills.data && drills.data.length > 0 ? (
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>DRILLS</Text>
          {drills.data.map((item) => (
            <DepthCard key={item.id} style={s.card}>
              <Text style={[s.cardTitle, { color: c.foreground }]}>Drill session</Text>
              <Text style={[s.meta, { color: c.mutedForeground }]}>{item.attemptCount} câu · {formatDate(item.startedAt)}</Text>
            </DepthCard>
          ))}
        </View>
      ) : null}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  card: { padding: spacing.lg, gap: spacing.xs },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  meta: { fontSize: fontSize.xs },
});
