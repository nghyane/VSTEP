import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthCard } from "@/components/DepthCard";
import { SkillIcon } from "@/components/SkillIcon";
import { DepthButton } from "@/components/DepthButton";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const SKILLS: { key: Skill; label: string; desc: string; mascot: "listen" | "read" | "write" | "speak" }[] = [
  { key: "listening", label: "Nghe", desc: "Audio + câu hỏi trắc nghiệm theo từng phần", mascot: "listen" },
  { key: "reading", label: "Đọc", desc: "Đoạn văn + câu hỏi trắc nghiệm theo passage", mascot: "read" },
  { key: "writing", label: "Viết", desc: "Nhập bài viết và chờ AI chấm bất đồng bộ", mascot: "write" },
  { key: "speaking", label: "Nói", desc: "Ghi âm câu trả lời, tải audio lên rồi chờ AI chấm", mascot: "speak" },
];

export default function PracticeSkillsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Skill>("listening");

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.foreground }]}>Luyện 4 kỹ năng</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn kỹ năng muốn luyện. Nghe/Đọc chấm ngay, Viết/Nói trả kết quả sau khi AI xử lý.</Text>

      <View style={styles.tabRow}>
        {SKILLS.map((skill) => (
          <SkillTab
            key={skill.key}
            skill={skill.key}
            label={skill.label}
            active={selected === skill.key}
            onPress={() => setSelected(skill.key)}
          />
        ))}
      </View>

      <SkillContent skill={selected} onStart={() => router.push(`/(app)/practice/${selected}` as any)} />

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function SkillTab({
  skill,
  label,
  active,
  onPress,
}: {
  skill: Skill;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const color = useSkillColor(skill);

  return (
    <HapticTouchable
      style={[styles.tab, { backgroundColor: active ? color + "18" : c.muted, borderColor: active ? color : "transparent" }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <SkillIcon skill={skill} size={15} />
      <Text style={[styles.tabLabel, { color: active ? color : c.mutedForeground }]}>{label}</Text>
    </HapticTouchable>
  );
}

function SkillContent({ skill, onStart }: { skill: Skill; onStart: () => void }) {
  const c = useThemeColors();
  const color = useSkillColor(skill);
  const current = SKILLS.find((item) => item.key === skill)!;

  const blocks: Record<Skill, { label: string; meta: string }[]> = {
    listening: [
      { label: "Part 1 · Hội thoại ngắn", meta: "MCQ · chấm ngay" },
      { label: "Part 2 · Hội thoại dài", meta: "MCQ · chấm ngay" },
      { label: "Part 3 · Bài giảng", meta: "MCQ · chấm ngay" },
    ],
    reading: [
      { label: "Part 1 · Đọc hiểu ngắn", meta: "MCQ · chấm ngay" },
      { label: "Part 2 · Đọc hiểu trung bình", meta: "MCQ · chấm ngay" },
      { label: "Part 3 · Đọc hiểu dài", meta: "MCQ · chấm ngay" },
    ],
    writing: [
      { label: "Part 1 · Viết thư / email", meta: "AI chấm sau khi nộp" },
      { label: "Part 2 · Viết luận", meta: "AI chấm sau khi nộp" },
    ],
    speaking: [
      { label: "A2 · Câu hỏi cơ bản", meta: "Ghi âm + tải audio" },
      { label: "B1 · Trả lời mở rộng", meta: "Ghi âm + tải audio" },
      { label: "B2/C1 · Trình bày và phản biện", meta: "Ghi âm + tải audio" },
    ],
  };

  return (
    <View style={styles.skillContent}>
      <DepthCard variant="skill" skillColor={color} style={styles.skillHeader}>
        <Mascot name={current.mascot} size={68} animation="none" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.skillName, { color }]}>{current.label}</Text>
          <Text style={[styles.skillDesc, { color: c.mutedForeground }]}>{current.desc}</Text>
        </View>
      </DepthCard>

      <Text style={[styles.sectionLabel, { color: c.subtle }]}>LUỒNG LÀM BÀI</Text>

      {blocks[skill].map((block, index) => (
        <HapticTouchable
          key={index}
          style={[styles.catRow, { borderBottomColor: c.borderLight }]}
          activeOpacity={0.7}
          onPress={onStart}
        >
          <View style={[styles.catDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.catLabel, { color: c.foreground }]}>{block.label}</Text>
            <Text style={[styles.catMeta, { color: c.mutedForeground }]}>{block.meta}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={c.subtle} />
        </HapticTouchable>
      ))}

      <DepthButton fullWidth onPress={onStart} style={{ marginTop: spacing.base }}>
        {`Bắt đầu luyện ${current.label.toLowerCase()}`}
      </DepthButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20 },
  tabRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  tab: { flex: 1, flexDirection: "column", alignItems: "center", gap: 4, paddingVertical: spacing.sm, borderRadius: radius.lg, borderWidth: 1.5 },
  tabLabel: { fontSize: 11, fontFamily: fontFamily.semiBold },
  skillContent: { gap: spacing.sm },
  skillHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  skillName: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  skillDesc: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 18 },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginTop: spacing.sm },
  catRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  catMeta: { fontSize: fontSize.xs, marginTop: 2 },
});
