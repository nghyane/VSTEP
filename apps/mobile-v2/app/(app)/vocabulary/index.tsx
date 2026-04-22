// Vocabulary index — placeholder
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DepthButton } from "@/components/DepthButton";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

export default function VocabularyScreen() {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <Mascot name="vocabulary" size={130} animation="float" />
      <Text style={[s.title, { color: c.foreground }]}>Tu vung</Text>
      <Text style={[s.sub, { color: c.mutedForeground }]}>
        He thong luyen tu vung SRS dang duoc phat trien. Vui long quay lai sau!
      </Text>
      <DepthButton variant="secondary" onPress={() => router.back()}>Quay lai</DepthButton>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  title: { fontSize: 24, fontFamily: fontFamily.extraBold },
  sub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
