import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function ExamResultScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { score, total } = useLocalSearchParams<{ score: string; total: string }>();

  const mcqScore = Number(score ?? 0);
  const mcqTotal = Number(total ?? 0);
  const pct = mcqTotal > 0 ? Math.round((mcqScore / mcqTotal) * 100) : 0;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.center, { paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.xl }]}>
        <View style={[s.icon, { backgroundColor: c.primaryTint }]}>
          <Ionicons name="checkmark" size={40} color={c.primary} />
        </View>
        <Text style={[s.title, { color: c.foreground }]}>Nộp bài thành công!</Text>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
          <Text style={[s.label, { color: c.mutedForeground }]}>Điểm MCQ (Nghe + Đọc)</Text>
          <Text style={[s.score, { color: c.primary }]}>
            {mcqScore}<Text style={[s.total, { color: c.subtle }]}>/{mcqTotal}</Text>
          </Text>
          <View style={[s.bar, { backgroundColor: c.muted }]}>
            <View style={[s.fill, { backgroundColor: c.primary, width: `${pct}%` as any }]} />
          </View>
          <Text style={[s.note, { color: c.subtle }]}>Writing và Speaking đang được AI chấm điểm</Text>
        </View>
        <DepthButton fullWidth onPress={() => router.replace("/(app)/(tabs)/exams" as any)} style={{ marginTop: spacing.xl }}>
          Về danh sách đề thi
        </DepthButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, marginBottom: spacing.xl },
  card: { width: "100%", borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.md },
  label: { fontSize: fontSize.sm },
  score: { fontSize: 56, fontFamily: fontFamily.extraBold },
  total: { fontSize: fontSize.xl },
  bar: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  note: { fontSize: fontSize.xs, textAlign: "center" },
});
