import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
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
          onPress={() => router.push("/(app)/practice/foundation" as any)}
          activeOpacity={0.8}
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

          <View style={[styles.branchCta, { backgroundColor: c.primary }]}>
            <Text style={styles.branchCtaText}>Bắt đầu nền tảng</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </View>
        </HapticTouchable>
      </Animated.View>

      <Animated.View style={animStyle(2)}>
        <HapticTouchable
          style={[styles.branchCard, { backgroundColor: c.card }]}
          onPress={() => router.push("/(app)/practice/skills" as any)}
          activeOpacity={0.8}
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
              <Chip key={skill.key} label={skill.label} color={skill.color} />
            ))}
          </View>

          <View style={styles.skillIconRow}>
            {SKILLS.map((skill) => (
              <View key={skill.key} style={[styles.skillIconWrap, { backgroundColor: skill.color + "15" }]}>
                <Ionicons
                  name={
                    skill.key === "listening"
                      ? "headset-outline"
                      : skill.key === "reading"
                        ? "book-outline"
                        : skill.key === "writing"
                          ? "create-outline"
                          : "mic-outline"
                  }
                  size={20}
                  color={skill.color}
                />
              </View>
            ))}
          </View>

          <View style={[styles.branchCta, { backgroundColor: c.info, borderBottomColor: "#0E7ABF" }]}>
            <Text style={styles.branchCtaText}>Bắt đầu luyện kỹ năng</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </View>
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
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },
  branchCard: { borderWidth: 2, borderBottomWidth: 4, borderColor: "#E5E5E5", borderBottomColor: "#CACACA", borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.md },
  branchHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  branchIconWrap: { width: 52, height: 52, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  branchTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  branchSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 18 },
  statRow: { flexDirection: "row", gap: spacing.sm },
  statPill: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.lg, gap: 2 },
  statValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  statLabel: { fontSize: 10 },
  chipRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  skillIconRow: { flexDirection: "row", gap: spacing.sm },
  skillIconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  branchCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.xl, borderWidth: 0, borderBottomWidth: 4, borderBottomColor: "#3D8B00" },
  branchCtaText: { color: "#FFF", fontSize: fontSize.sm, fontFamily: fontFamily.bold, letterSpacing: 0.3 },
  mascotRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  mascotBubble: { flex: 1, borderWidth: 1.5, borderRadius: radius.xl, padding: spacing.md },
  mascotText: { fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.semiBold },
});
