// Goal screen — set/update learning target
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/hooks/use-auth";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type Level = "A1" | "A2" | "B1" | "B2" | "C1";
const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"];

export default function GoalScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<Level>((profile?.targetLevel as Level) ?? "B2");

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
    >
      <View style={s.mascotRow}>
        <Mascot name="hero" size={100} animation="float" />
      </View>

      <Text style={[s.title, { color: c.foreground }]}>Mục tiêu VSTEP</Text>
      <Text style={[s.sub, { color: c.mutedForeground }]}>
        Chọn band VSTEP bạn muốn đạt được
      </Text>

      <View style={s.levelList}>
        {LEVELS.map((lvl) => {
          const active = selected === lvl;
          return (
            <HapticTouchable
              key={lvl}
              onPress={() => setSelected(lvl)}
              scalePress
              style={[
                s.levelRow,
                {
                  borderColor: active ? c.primary : c.border,
                  borderBottomColor: active ? c.primaryDark : "#CACACA",
                  backgroundColor: active ? c.primaryTint : c.surface,
                },
              ]}
            >
              <Text style={[s.lvl, { color: active ? c.primary : c.foreground }]}>{lvl}</Text>
              <Text style={[s.lvlDesc, { color: active ? c.primaryDark : c.mutedForeground }]}>
                {getLevelDesc(lvl)}
              </Text>
              {active && (
                <View style={[s.check, { backgroundColor: c.primary }]}>
                  <Text style={s.checkMark}>✓</Text>
                </View>
              )}
            </HapticTouchable>
          );
        })}
      </View>

      <DepthButton fullWidth size="lg" onPress={() => router.back()}>
        Lưu mục tiêu
      </DepthButton>
    </ScrollView>
  );
}

function getLevelDesc(level: Level): string {
  switch (level) {
    case "A1": return "Người mới bắt đầu";
    case "A2": return "Sơ cấp";
    case "B1": return "Trung cấp";
    case "B2": return "Trên trung cấp";
    case "C1": return "Nâng cao";
  }
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  mascotRow: { alignItems: "center" },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  sub: { fontSize: fontSize.sm, textAlign: "center" },
  levelList: { gap: spacing.sm },
  levelRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.base, position: "relative" },
  lvl: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, width: 36 },
  lvlDesc: { flex: 1, fontSize: fontSize.sm },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  checkMark: { color: "#FFF", fontSize: 14, fontFamily: fontFamily.bold },
});
