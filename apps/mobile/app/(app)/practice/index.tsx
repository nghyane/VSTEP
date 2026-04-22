import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { DepthButton } from "@/components/DepthButton";
import type { Skill } from "@/types/api";

const SKILLS: { key: Skill; desc: string }[] = [
  { key: "listening", desc: "3 phần · nghe hiểu" },
  { key: "reading",   desc: "4 đoạn văn · đọc hiểu" },
  { key: "writing",   desc: "Thư + luận · AI chấm" },
  { key: "speaking",  desc: "3 phần · ghi âm + AI" },
];

export default function PracticeScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.base, paddingBottom: insets.bottom + spacing["3xl"] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Text style={[s.pageTitle, { color: c.foreground }]}>Luyện tập</Text>

      {/* ── Foundation Section ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: c.foreground }]}>Nền tảng</Text>
        <Text style={[s.sectionSub, { color: c.subtle }]}>Từ vựng và ngữ pháp — gốc rễ mọi kỹ năng</Text>
        <View style={s.foundationGrid}>
          <FoundationCard
            icon="flash"
            color={c.skillWriting}
            title="Từ vựng"
            desc="Flashcard SRS · 60+ chủ đề theo level"
            onPress={() => router.push("/(app)/practice/foundation/vocab")}
          />
          <FoundationCard
            icon="clipboard"
            color={c.skillReading}
            title="Ngữ pháp"
            desc="Cấu trúc câu gắn level A2–C1"
            onPress={() => router.push("/(app)/practice/grammar")}
          />
        </View>
      </View>

      {/* ── Skills Section ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: c.foreground }]}>Kỹ năng</Text>
        <Text style={[s.sectionSub, { color: c.subtle }]}>Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu</Text>
        <View style={s.skillGrid}>
          {SKILLS.map(({ key, desc }) => (
            <SkillCard
              key={key}
              skill={key}
              desc={desc}
              onPress={() => router.push(`/(app)/practice/${key}`)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function FoundationCard({
  icon, color, title, desc, onPress,
}: { icon: string; color: string; title: string; desc: string; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable
      style={[s.foundationCard, { backgroundColor: c.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[s.foundationIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.foundationTitle, { color: c.foreground }]}>{title}</Text>
        <Text style={[s.foundationDesc, { color: c.subtle }]}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.placeholder} />
    </HapticTouchable>
  );
}

function SkillCard({ skill, desc, onPress }: { skill: Skill; desc: string; onPress: () => void }) {
  const c = useThemeColors();
  const color = useSkillColor(skill);
  return (
    <HapticTouchable
      style={[s.skillCard, { backgroundColor: c.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <SkillIcon skill={skill} size={28} />
      <Text style={[s.skillLabel, { color: c.foreground }]}>{SKILL_LABELS[skill]}</Text>
      <Text style={[s.skillEn, { color: c.subtle }]}>{skill.charAt(0).toUpperCase() + skill.slice(1)}</Text>
      <Text style={[s.skillDesc, { color: c.mutedForeground }]}>{desc}</Text>
    </HapticTouchable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl },

  pageTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, marginBottom: spacing.xl },

  section: { marginBottom: spacing["2xl"] },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, marginBottom: 2 },
  sectionSub: { fontSize: fontSize.sm, marginBottom: spacing.lg },

  // Foundation (2 cards stacked)
  foundationGrid: { gap: spacing.sm },
  foundationCard: {
    ...depthNeutral,
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  foundationIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  foundationTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  foundationDesc: { fontSize: fontSize.xs, marginTop: 2 },

  // Skills (2x2 grid)
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillCard: {
    ...depthNeutral,
    borderRadius: radius.lg,
    padding: spacing.base,
    width: "48%",
    gap: 2,
  },
  skillLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold, marginTop: spacing.sm },
  skillEn: { fontSize: fontSize.xs },
  skillDesc: { fontSize: fontSize.sm, marginTop: spacing.xs },
});
