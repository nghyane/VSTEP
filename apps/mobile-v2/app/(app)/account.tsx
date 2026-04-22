// Account screen
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DepthButton } from "@/components/DepthButton";
import { useAuth } from "@/hooks/use-auth";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function AccountScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
    >
      <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[s.label, { color: c.subtle }]}>Email</Text>
        <Text style={[s.value, { color: c.foreground }]}>{user?.email ?? "—"}</Text>
      </View>
      <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[s.label, { color: c.subtle }]}>Ho ten</Text>
        <Text style={[s.value, { color: c.foreground }]}>{user?.fullName ?? "—"}</Text>
      </View>
      <DepthButton variant="secondary" onPress={() => router.back()} fullWidth>
        Quay lai
      </DepthButton>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"] },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.base, borderBottomColor: "#CACACA" },
  label: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, marginBottom: 4 },
  value: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
});
