// Practice foundation index — vocab + grammar entry
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { DepthCard } from "@/components/DepthCard";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function FoundationIndexScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
    >
      <Text style={[s.title, { color: c.foreground }]}>Nen tang</Text>
      <Text style={[s.sub, { color: c.mutedForeground }]}>Tu vung va Ngu phap</Text>

      <HapticTouchable onPress={() => router.push("/(app)/vocabulary" as any)} activeOpacity={0.8}>
        <DepthCard style={s.card}>
          <GameIcon name="book" size={36} />
          <Text style={[s.cardTitle, { color: c.foreground }]}>Tu vung</Text>
          <Text style={[s.cardDesc, { color: c.mutedForeground }]}>
            Hoc tu vung theo chu de voi he thong SRS (lap lai co gian cach).
          </Text>
        </DepthCard>
      </HapticTouchable>

      <HapticTouchable onPress={() => router.push("/(app)/practice/grammar" as any)} activeOpacity={0.8}>
        <DepthCard style={s.card}>
          <GameIcon name="pencil" size={36} />
          <Text style={[s.cardTitle, { color: c.foreground }]}>Ngu phap</Text>
          <Text style={[s.cardDesc, { color: c.mutedForeground }]}>
            200+ diem ngu phap co cau truc, tu co ban den nang cao.
          </Text>
        </DepthCard>
      </HapticTouchable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm },
  card: { gap: spacing.sm },
  cardTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  cardDesc: { fontSize: fontSize.sm, lineHeight: 20 },
});
