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
        <Text style={[s.infoTitle, { color }]}>Thong tin ky nang</Text>
        <Text style={[s.infoText, { color: c.mutedForeground }]}>
          {getSkillInfo(skill)}
        </Text>
      </DepthCard>

      {/* Recommendations */}
      <DepthCard style={s.recoCard}>
        <Text style={[s.recoTitle, { color: c.foreground }]}>Goi y luyen tap</Text>
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
        Luyen tap ngay
      </DepthButton>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function getSkillInfo(skill: Skill): string {
  switch (skill) {
    case "listening": return "Bai nghe VSTEP kiem tra kha nang hieu hoi thoai va bai giang. Gom 3 phan voi do kho tang dan.";
    case "reading":   return "Bai doc VSTEP kiem tra kha nang hieu van ban. Gom 3 phan: van ban ngan, trung binh va dai.";
    case "writing":   return "Bai viet VSTEP gom 2 phan: viet thu chinh thuc va bai luan phan tich.";
    case "speaking":  return "Bai noi VSTEP kiem tra kha nang giao tiep tu phong van theo trinh do A2 den C1.";
  }
}

function getRecommendations(skill: Skill): string[] {
  switch (skill) {
    case "listening": return ["Nghe podcast tieng Anh hang ngay 15 phut", "Luyen nghe chep chinh ta", "Chu y tu noi lien, am nuoc anh/my"];
    case "reading":   return ["Doc bao tieng Anh 10 phut moi ngay", "Luyen ky nang skimming va scanning", "Mo rong tu vung theo chu de"];
    case "writing":   return ["Viet diary tieng Anh moi ngay", "Hoc cau truc thu chinh thuc", "Luyen viet luan theo mau IELTS/VSTEP"];
    case "speaking":  return ["Luyen noi to voi chinh minh", "Xem TED talks va bắt chước cach noi", "Ghi am ban than de kiem tra"];
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
