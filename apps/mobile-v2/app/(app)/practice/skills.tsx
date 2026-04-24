import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const SKILLS: {
  key: Skill;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  meta: string;
}[] = [
  { key: "listening", label: "Nghe",  sub: "Listening", icon: "headset",  meta: "3 phần · MCQ · chấm ngay" },
  { key: "reading",   label: "Đọc",   sub: "Reading",   icon: "book",     meta: "3 đoạn · MCQ · chấm ngay" },
  { key: "writing",   label: "Viết",  sub: "Writing",   icon: "create",   meta: "2 task · AI chấm" },
  { key: "speaking",  label: "Nói",   sub: "Speaking",  icon: "mic",      meta: "3 phần · ghi âm + AI" },
];

const PARTS: Record<Skill, { label: string; meta: string; badge: string }[]> = {
  listening: [
    { badge: "P1", label: "Hội thoại ngắn",       meta: "MCQ · chấm ngay" },
    { badge: "P2", label: "Hội thoại dài",         meta: "MCQ · chấm ngay" },
    { badge: "P3", label: "Bài giảng / độc thoại", meta: "MCQ · chấm ngay" },
  ],
  reading: [
    { badge: "P1", label: "Đọc hiểu ngắn",   meta: "MCQ · chấm ngay" },
    { badge: "P2", label: "Đọc hiểu trung",  meta: "MCQ · chấm ngay" },
    { badge: "P3", label: "Đọc hiểu dài",    meta: "MCQ · chấm ngay" },
  ],
  writing: [
    { badge: "T1", label: "Viết thư / email", meta: "AI chấm sau khi nộp" },
    { badge: "T2", label: "Viết luận",        meta: "AI chấm sau khi nộp" },
  ],
  speaking: [
    { badge: "A2", label: "Câu hỏi cơ bản",         meta: "Ghi âm + tải audio" },
    { badge: "B1", label: "Trả lời mở rộng",         meta: "Ghi âm + tải audio" },
    { badge: "B2", label: "Trình bày và phản biện",  meta: "Ghi âm + tải audio" },
  ],
};

export default function PracticeSkillsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Skill>("listening");
  const color = useSkillColor(selected);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Luyện tập</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Luyện 4 kỹ năng</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>
          Nghe / Đọc chấm ngay · Viết / Nói AI chấm sau
        </Text>
      </View>

      {/* 2x2 skill grid */}
      <View style={s.grid}>
        {SKILLS.map((skill) => (
          <SkillCard
            key={skill.key}
            skill={skill}
            active={selected === skill.key}
            onPress={() => setSelected(skill.key)}
          />
        ))}
      </View>

      {/* Part list */}
      <View style={[s.partsCard, { backgroundColor: c.card, borderColor: color + "40", borderBottomColor: color }]}>
        <Text style={[s.partsTitle, { color }]}>Chọn phần luyện tập</Text>
        {PARTS[selected].map((part, i) => (
          <HapticTouchable
            key={i}
            style={[
              s.partRow,
              { borderTopColor: c.borderLight },
              i === 0 && { borderTopWidth: 1, marginTop: spacing.sm },
            ]}
            activeOpacity={0.75}
            onPress={() => router.push(`/(app)/practice/${selected}` as any)}
          >
            <View style={[s.partBadge, { backgroundColor: color + "18" }]}>
              <Text style={[s.partBadgeText, { color }]}>{part.badge}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.partLabel, { color: c.foreground }]}>{part.label}</Text>
              <Text style={[s.partMeta, { color: c.mutedForeground }]}>{part.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={color} />
          </HapticTouchable>
        ))}
      </View>

      <DepthButton
        fullWidth
        onPress={() => router.push(`/(app)/practice/${selected}` as any)}
        style={{ backgroundColor: color, borderColor: color }}
      >
        {`Bắt đầu luyện ${SKILLS.find((sk) => sk.key === selected)!.label.toLowerCase()}`}
      </DepthButton>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function SkillCard({
  skill,
  active,
  onPress,
}: {
  skill: (typeof SKILLS)[number];
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const color = useSkillColor(skill.key);

  return (
    <HapticTouchable
      style={s.skillCardWrapper}
      scalePress
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View
        style={[
          s.skillCard,
          {
            backgroundColor: active ? color + "12" : c.card,
            borderColor: active ? color : c.border,
            borderBottomColor: active ? color : "#CACACA",
          },
        ]}
      >
        <View style={[s.skillIconWrap, { backgroundColor: color + "20" }]}>
          <Ionicons name={skill.icon} size={24} color={color} />
        </View>
        <Text style={[s.skillLabel, { color: active ? color : c.foreground }]}>
          {skill.label}
        </Text>
        <Text style={[s.skillSub, { color: c.subtle }]}>{skill.sub}</Text>
        <Text style={[s.skillMeta, { color: c.mutedForeground }]} numberOfLines={2}>
          {skill.meta}
        </Text>
      </View>
    </HapticTouchable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.xs },
  // Skill grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  skillCardWrapper: { width: "47%" },
  skillCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  skillIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  skillLabel: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  skillSub: { fontSize: fontSize.xs },
  skillMeta: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 2 },
  // Parts card
  partsCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  partsTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  partRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 0,
  },
  partBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  partBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  partLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  partMeta: { fontSize: fontSize.xs, marginTop: 2 },
});
