import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const TABS: { key: Skill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
];

export default function SessionScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [active, setActive] = useState<Skill>("listening");

  const content = useMemo(() => {
    switch (active) {
      case "listening":
        return {
          title: "Nghe — Part 1",
          desc: "Phát audio, theo dõi câu hỏi và chọn đáp án trắc nghiệm. Điểm được tính ngay khi nộp.",
        };
      case "reading":
        return {
          title: "Đọc — Passage 1",
          desc: "Đọc đoạn văn, làm câu hỏi trắc nghiệm và chuyển passage bằng tab điều hướng.",
        };
      case "writing":
        return {
          title: "Viết — Task 1",
          desc: "Nhập bài viết trực tiếp trên màn hình. Khi nộp bài, hệ thống chuyển sang trạng thái chờ AI chấm.",
        };
      default:
        return {
          title: "Nói — Part 1",
          desc: "Ghi âm câu trả lời, tải file audio lên rồi nộp để AI xử lý và chấm điểm bất đồng bộ.",
        };
    }
  }, [active]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.base }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.sessionTitle, { color: c.foreground }]}>Phiên thi #{id}</Text>
          <Text style={[styles.sessionSub, { color: c.mutedForeground }]}>Tự động lưu mỗi 30 giây</Text>
        </View>
        <View style={[styles.timerPill, { backgroundColor: c.primaryTint }]}> 
          <Text style={[styles.timerText, { color: c.primaryDark }]}>59:30</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const activeTab = active === tab.key;
          return (
            <HapticTouchable
              key={tab.key}
              style={[styles.tab, activeTab ? { backgroundColor: c.primaryTint, borderColor: c.primary } : { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => setActive(tab.key)}
            >
              <Text style={[styles.tabText, { color: activeTab ? c.primary : c.mutedForeground }]}>{tab.label}</Text>
            </HapticTouchable>
          );
        })}
      </View>

      <DepthCard style={styles.contentCard}>
        <View style={styles.contentHeader}>
          <Mascot name={active === "listening" ? "listen" : active === "reading" ? "read" : active === "writing" ? "write" : "speak"} size={68} animation="none" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contentTitle, { color: c.foreground }]}>{content.title}</Text>
            <Text style={[styles.contentDesc, { color: c.mutedForeground }]}>{content.desc}</Text>
          </View>
        </View>

        <View style={[styles.answerBox, { backgroundColor: c.muted }]}> 
          <Text style={[styles.answerPlaceholder, { color: c.subtle }]}>Đây là màn hình khung của phiên thi. Ở phase tiếp theo sẽ nối API thật cho câu hỏi, autosave và submit theo từng kỹ năng.</Text>
        </View>

        <View style={styles.footerRow}>
          <DepthButton variant="secondary">Lưu tạm</DepthButton>
          <DepthButton onPress={() => router.replace(`/(app)/exam-result/${id}` as any)}>Nộp bài</DepthButton>
        </View>
      </DepthCard>

      <View style={{ height: insets.bottom + 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.base },
  topBarCenter: { flex: 1, marginHorizontal: spacing.md },
  sessionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  sessionSub: { fontSize: fontSize.xs, marginTop: 2 },
  timerPill: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  timerText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  tabRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.base },
  tab: { flex: 1, borderWidth: 1.5, borderRadius: radius.lg, paddingVertical: spacing.sm, alignItems: "center" },
  tabText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  contentCard: { gap: spacing.base },
  contentHeader: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  contentTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  contentDesc: { fontSize: fontSize.xs, lineHeight: 18, marginTop: 2 },
  answerBox: { borderRadius: radius.lg, padding: spacing.base, minHeight: 160, justifyContent: "center" },
  answerPlaceholder: { fontSize: fontSize.sm, lineHeight: 22 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
});
