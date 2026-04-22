import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const SKILLS = [
  { key: "listening", label: "Nghe", color: "#1CB0F6" },
  { key: "reading", label: "Đọc", color: "#7850C8" },
  { key: "writing", label: "Viết", color: "#58CC02" },
  { key: "speaking", label: "Nói", color: "#FFC800" },
] as const;

export default function PracticeHubScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay: 60 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  function animStyle(index: number) {
    return {
      opacity: fadeAnims[index],
      transform: [
        {
          translateY: fadeAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          }),
        },
      ],
    };
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={animStyle(0)}>
        <Text style={[styles.title, { color: c.foreground }]}>Luyện tập</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn luồng học phù hợp với mục tiêu hiện tại của bạn.</Text>
      </Animated.View>

      <Animated.View style={animStyle(1)}>
        <HapticTouchable
          style={[styles.branchCard, { backgroundColor: c.card }]}
          activeOpacity={1}
        >
          <View style={styles.branchHeader}>
            <View style={[styles.branchIconWrap, { backgroundColor: c.primaryTint }]}>
              <GameIcon name="graduation" size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.branchTitle, { color: c.foreground }]}>Luyện tập nền tảng</Text>
              <Text style={[styles.branchSub, { color: c.mutedForeground }]}>Học từ vựng theo chủ đề và ngữ pháp có cấu trúc trước khi vào luyện đề.</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <StatPill icon="book" value="60+" label="chủ đề" />
            <StatPill icon="pencil" value="200+" label="điểm ngữ pháp" />
            <StatPill icon="lightning" value="SRS" label="lặp lại" />
          </View>

          <View style={styles.chipRow}>
            <Chip label="Từ vựng" color={c.primary} />
            <Chip label="Ngữ pháp" color={c.skillReading} />
          </View>

          <DepthButton fullWidth onPress={() => router.push("/(app)/practice/foundation" as any)}>
            Bắt đầu nền tảng →
          </DepthButton>
        </HapticTouchable>
      </Animated.View>

      <Animated.View style={animStyle(2)}>
        <HapticTouchable
          style={[styles.branchCard, { backgroundColor: c.card }]}
          activeOpacity={1}
        >
          <View style={styles.branchHeader}>
            <View style={[styles.branchIconWrap, { backgroundColor: c.infoTint }]}>
              <GameIcon name="star" size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.branchTitle, { color: c.foreground }]}>Luyện 4 kỹ năng</Text>
              <Text style={[styles.branchSub, { color: c.mutedForeground }]}>Nghe và Đọc được chấm ngay. Viết và Nói được AI chấm bất đồng bộ.</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <StatPill icon="headphones" value="4" label="kỹ năng" />
            <StatPill icon="rocket" value="MCQ + AI" label="dạng bài" />
            <StatPill icon="star" value="Adaptive" label="gợi ý" />
          </View>

          <View style={styles.chipRow}>
            {SKILLS.map((skill) => (
              <View key={skill.key} style={[styles.skillChip, { backgroundColor: skill.color + "15" }]}>
                <Ionicons
                  name={
                    skill.key === "listening" ? "headset-outline"
                    : skill.key === "reading" ? "book-outline"
                    : skill.key === "writing" ? "create-outline"
                    : "mic-outline"
                  }
                  size={14}
                  color={skill.color}
                />
                <Text style={[styles.skillChipText, { color: skill.color }]}>{skill.label}</Text>
              </View>
            ))}
          </View>

          <DepthButton variant="info" fullWidth onPress={() => router.push("/(app)/practice/skills" as any)}>
            Bắt đầu luyện kỹ năng →
          </DepthButton>
        </HapticTouchable>
      </Animated.View>

      <View style={styles.mascotRow}>
        <Mascot name="hero" size={72} animation="none" />
        <View style={[styles.mascotBubble, { backgroundColor: c.primaryTint, borderColor: c.borderFocus }]}>
          <Text style={[styles.mascotText, { color: c.primaryDark }]}>Đi đúng thứ tự: nền tảng → 4 kỹ năng → thi thử. Học đều mỗi ngày sẽ hiệu quả hơn học dồn.</Text>
        </View>
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: Parameters<typeof GameIcon>[0]["name"];
  value: string;
  label: string;
}) {
  const c = useThemeColors();
  return (
    <View style={[styles.statPill, { backgroundColor: c.muted }]}> 
      <GameIcon name={icon} size={14} />
      <Text style={[styles.statValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + "18" }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.xl },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },
  branchCard: { borderWidth: 2, borderBottomWidth: 4, borderColor: "#E5E5E5", borderBottomColor: "#CACACA", borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.lg },
  branchHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  branchIconWrap: { width: 52, height: 52, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  branchTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  branchSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 18 },
  statRow: { flexDirection: "row", gap: spacing.md },
  statPill: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg, gap: 4 },
  statValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  statLabel: { fontSize: 10 },
  chipRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  chip: { paddingHorizontal: spacing.base, paddingVertical: 6, borderRadius: radius.full },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.full },
  skillChipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  mascotRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  mascotBubble: { flex: 1, borderWidth: 1.5, borderRadius: radius.xl, padding: spacing.md },
  mascotText: { fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.semiBold },
});
