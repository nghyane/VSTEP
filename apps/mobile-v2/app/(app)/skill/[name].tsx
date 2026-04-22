// Skill detail screen — per-skill progress + recommendations
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SkillIcon } from "@/components/SkillIcon";
import { DepthCard } from "@/components/DepthCard";
import { DepthButton } from "@/components/DepthButton";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { useSkillDetail } from "@/hooks/use-progress";
import type { Skill } from "@/types/api";
import type { MascotName } from "@/components/Mascot";

const MASCOT_MAP: Record<Skill, MascotName> = {
  listening: "listen",
  reading:   "read",
  writing:   "write",
  speaking:  "speak",
};

export default function SkillDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const skill = (["listening", "reading", "writing", "speaking"].includes(name ?? "")
    ? name
    : "listening") as Skill;
  const color = useSkillColor(skill);
  const mascot = MASCOT_MAP[skill];
  const { data } = useSkillDetail(skill);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.base }]}
    >
      {/* Hero */}
      <View style={s.hero}>
        <Mascot name={mascot} size={110} animation="float" />
        <View style={s.heroText}>
          <SkillIcon skill={skill} size={22} />
          <Text style={[s.heroTitle, { color }]}>
            {skill.charAt(0).toUpperCase() + skill.slice(1)}
          </Text>
          <Text style={[s.heroScore, { color: c.foreground }]}>
            {data?.score !== null && data?.score !== undefined
              ? `${data.score.toFixed(1)} / 10`
              : "—"}
          </Text>
        </View>
      </View>

      {/* Info card */}
      <DepthCard variant="skill" skillColor={color} style={s.infoCard}>
        <Text style={[s.infoTitle, { color }]}>Thông tin kỹ năng</Text>
        <Text style={[s.infoText, { color: c.mutedForeground }]}>
          {getSkillInfo(skill)}
        </Text>
      </DepthCard>

      {/* Recommendations */}
      <DepthCard style={s.recoCard}>
        <Text style={[s.recoTitle, { color: c.foreground }]}>Gợi ý luyện tập</Text>
        {getRecommendations(skill).map((r, i) => (
          <View key={i} style={[s.recoRow, { borderBottomColor: c.borderLight }]}>
            <View style={[s.recoDot, { backgroundColor: color }]} />
            <Text style={[s.recoText, { color: c.mutedForeground }]}>{r}</Text>
          </View>
        ))}
      </DepthCard>

      <DepthButton
        fullWidth
        size="lg"
        onPress={() => router.push(`/(app)/practice/${skill}` as any)}
      >
        LUYỆN TẬP NGAY
      </DepthButton>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function getSkillInfo(skill: Skill): string {
  switch (skill) {
    case "listening": return "Bài nghe VSTEP kiểm tra khả năng hiểu hội thoại và bài giảng. Gồm 3 phần với độ khó tăng dần.";
    case "reading":   return "Bài đọc VSTEP kiểm tra khả năng hiểu văn bản. Gồm 3 phần: văn bản ngắn, trung bình và dài.";
    case "writing":   return "Bài viết VSTEP gồm 2 phần: viết thư chính thức và bài luận phân tích.";
    case "speaking":  return "Bài nói VSTEP kiểm tra khả năng giao tiếp từ phỏng vấn theo trình độ A2 đến C1.";
  }
}

function getRecommendations(skill: Skill): string[] {
  switch (skill) {
    case "listening": return ["Nghe podcast tiếng Anh hàng ngày 15 phút", "Luyện nghe chép chính tả", "Chú ý từ nối liền, âm nước Anh/Mỹ"];
    case "reading":   return ["Đọc báo tiếng Anh 10 phút mỗi ngày", "Luyện kỹ năng skimming và scanning", "Mở rộng từ vựng theo chủ đề"];
    case "writing":   return ["Viết diary tiếng Anh mỗi ngày", "Học cấu trúc thư chính thức", "Luyện viết luận theo mẫu IELTS/VSTEP"];
    case "speaking":  return ["Luyện nói to với chính mình", "Xem TED talks và bắt chước cách nói", "Ghi âm bản thân để kiểm tra"];
  }
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.xl, marginBottom: spacing.sm },
  heroText: { flex: 1, gap: spacing.sm },
  heroTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  heroScore: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold },
  infoCard: { gap: spacing.sm },
  infoTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  infoText: { fontSize: fontSize.sm, lineHeight: 22 },
  recoCard: { gap: spacing.sm },
  recoTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginBottom: spacing.xs },
  recoRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  recoDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  recoText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
});
