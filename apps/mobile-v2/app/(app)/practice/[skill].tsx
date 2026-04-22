import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DepthButton } from "@/components/DepthButton";
import { SkillIcon } from "@/components/SkillIcon";
import { Mascot } from "@/components/Mascot";
import { DepthCard } from "@/components/DepthCard";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";
import type { MascotName } from "@/components/Mascot";

const SKILL_MASCOT: Record<Skill, MascotName> = {
  listening: "listen",
  reading: "read",
  writing: "write",
  speaking: "speak",
};

export default function PracticeSkillScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { skill } = useLocalSearchParams<{ skill: string }>();

  const validSkill = (["listening", "reading", "writing", "speaking"].includes(skill ?? "")
    ? skill
    : "listening") as Skill;

  const color = useSkillColor(validSkill);
  const mascot = SKILL_MASCOT[validSkill];

  const flow = {
    listening: {
      title: "Luyện nghe",
      intro: "Nghe audio và trả lời câu hỏi trắc nghiệm. Kết quả trả về ngay sau khi nộp.",
      steps: [
        "Chọn bài nghe và phát audio theo từng phần.",
        "Trả lời các câu trắc nghiệm liên quan đến nội dung nghe.",
        "Nộp bài để xem điểm và đáp án đúng ngay lập tức.",
      ],
    },
    reading: {
      title: "Luyện đọc",
      intro: "Đọc passage, làm câu hỏi trắc nghiệm và nhận điểm ngay sau khi nộp.",
      steps: [
        "Đọc đoạn văn theo từng passage hoặc part.",
        "Chọn đáp án cho từng câu hỏi.",
        "Nộp bài để xem kết quả, đáp án đúng và giải thích.",
      ],
    },
    writing: {
      title: "Luyện viết",
      intro: "Nhập bài viết theo task. AI sẽ chấm bất đồng bộ và trả kết quả sau khi xử lý xong.",
      steps: [
        "Đọc đề bài và yêu cầu số từ tối thiểu.",
        "Soạn bài trực tiếp trên ô nhập văn bản.",
        "Nộp bài và chờ AI chấm điểm, nhận strengths → improvements → rewrites.",
      ],
    },
    speaking: {
      title: "Luyện nói",
      intro: "Ghi âm câu trả lời, tải audio lên trước khi nộp. AI sẽ chấm bất đồng bộ.",
      steps: [
        "Đọc prompt và chuẩn bị ý trong thời gian ngắn.",
        "Ghi âm câu trả lời trên thiết bị.",
        "Tải file audio lên rồi nộp bài để AI xử lý và chấm điểm.",
      ],
    },
  }[validSkill];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mascotSection}>
        <Mascot name={mascot} size={96} animation="none" />
      </View>

      <View style={[styles.header, { borderColor: color + "30", borderBottomColor: color }]}> 
        <SkillIcon skill={validSkill} size={24} bare />
        <Text style={[styles.title, { color }]}>{flow.title}</Text>
      </View>

      <Text style={[styles.intro, { color: c.mutedForeground }]}>{flow.intro}</Text>

      <DepthCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: c.foreground }]}>Luồng làm bài</Text>
        {flow.steps.map((stepText, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: color }]} />
            <Text style={[styles.stepText, { color: c.foreground }]}>{stepText}</Text>
          </View>
        ))}
      </DepthCard>

      <DepthButton onPress={() => router.push(`/(app)/practice/result/${validSkill}` as any)} fullWidth>
        Mô phỏng bắt đầu bài luyện
      </DepthButton>

      <DepthButton variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.sm }} fullWidth>
        Quay lại
      </DepthButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  mascotSection: { alignItems: "center", marginBottom: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.lg, backgroundColor: "#FFF" },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  intro: { fontSize: fontSize.base, lineHeight: 24, marginBottom: spacing.base },
  card: { gap: spacing.sm, marginBottom: spacing.base },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  stepRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  stepText: { flex: 1, fontSize: fontSize.sm, lineHeight: 22 },
});
