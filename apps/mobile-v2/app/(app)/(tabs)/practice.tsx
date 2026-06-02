import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon, type GameIconName } from "@/components/GameIcon";
import { Mascot } from "@/components/Mascot";
import { RecommendationSection } from "@/features/practice/RecommendationSection";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type PracticeRoute =
  | "/(app)/vocabulary"
  | "/(app)/practice/grammar"
  | "/(app)/practice/listening"
  | "/(app)/practice/reading"
  | "/(app)/practice/writing"
  | "/(app)/practice/speaking"
  | "/(app)/practice/results";

interface PracticeItem {
  key: string;
  title: string;
  subtitle: string;
  meta?: string;
  icon: GameIconName;
  color: string;
  tint: string;
  route: PracticeRoute;
}

export default function PracticeHubScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  const foundationItems: PracticeItem[] = [
    {
      key: "vocabulary",
      title: "Từ vựng",
      subtitle: "Flashcard SRS · 30 chủ đề theo level",
      icon: "vocabulary",
      color: c.primary,
      tint: c.primaryTint,
      route: "/(app)/vocabulary",
    },
    {
      key: "grammar",
      title: "Ngữ pháp",
      subtitle: "38 điểm ngữ pháp · 3 cấp độ",
      icon: "grammar",
      color: c.skillReading,
      tint: "#F3EAFF",
      route: "/(app)/practice/grammar",
    },
  ];

  const skillItems: PracticeItem[] = [
    {
      key: "listening",
      title: "Nghe",
      subtitle: "Listening",
      meta: "3 phần · nghe hiểu",
      icon: "listening",
      color: c.skillListening,
      tint: c.infoTint,
      route: "/(app)/practice/listening",
    },
    {
      key: "reading",
      title: "Đọc",
      subtitle: "Reading",
      meta: "4 đoạn văn · đọc hiểu",
      icon: "reading",
      color: c.skillReading,
      tint: "#F3EAFF",
      route: "/(app)/practice/reading",
    },
    {
      key: "writing",
      title: "Viết",
      subtitle: "Writing",
      meta: "Thư + luận · AI chấm",
      icon: "writing",
      color: c.skillWriting,
      tint: c.primaryTint,
      route: "/(app)/practice/writing",
    },
    {
      key: "speaking",
      title: "Nói",
      subtitle: "Speaking",
      meta: "3 phần · ghi âm + AI",
      icon: "speaking",
      color: c.skillSpeaking,
      tint: c.coinTint,
      route: "/(app)/practice/speaking",
    },
  ];

  useEffect(() => {
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay: 60 + index * 90,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnims]);

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
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn mục luyện để vào học ngay.</Text>
      </Animated.View>

      <Animated.View style={animStyle(1)}>
        <RecommendationSection />
      </Animated.View>

      <Animated.View style={[styles.section, animStyle(2)]}>
        <SectionHeader title="Nền tảng" subtitle="Từ vựng và ngữ pháp — gốc rễ mọi kỹ năng" />
        <View style={styles.foundationList}>
          {foundationItems.map((item) => (
            <FoundationCard key={item.key} item={item} onPress={() => router.push(item.route as never)} />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, animStyle(3)]}>
        <SectionHeader title="Kỹ năng" subtitle="Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu" />
        <View style={styles.skillGrid}>
          {skillItems.map((item) => (
            <SkillCard key={item.key} item={item} onPress={() => router.push(item.route as never)} />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={animStyle(4)}>
        <HapticTouchable scalePress activeOpacity={0.9} onPress={() => router.push("/(app)/practice/results" as never)}>
          <View style={[styles.resultsCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.mutedForeground }]}>
            <View style={[styles.resultsIcon, { backgroundColor: c.primaryTint }]}>
              <GameIcon name="writing" size={34} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.resultsTitle, { color: c.foreground }]}>Kết quả AI chấm</Text>
              <Text style={[styles.resultsSub, { color: c.mutedForeground }]}>Xem lại các bài Viết đã được AI chấm điểm chi tiết.</Text>
            </View>
            <Text style={[styles.chevron, { color: c.subtle }]}>›</Text>
          </View>
        </HapticTouchable>
      </Animated.View>

      <View style={styles.mascotRow}>
        <Mascot name="hero" size={72} animation="none" />
        <View style={[styles.mascotBubble, { backgroundColor: c.primaryTint, borderColor: c.borderFocus }]}>
          <Text style={[styles.mascotText, { color: c.primaryDark }]}>Chạm vào từng thẻ để luyện ngay. Học đều nền tảng và 4 kỹ năng sẽ hiệu quả hơn học dồn.</Text>
        </View>
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: c.subtle }]}>{subtitle}</Text>
    </View>
  );
}

function FoundationCard({ item, onPress }: { item: PracticeItem; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable scalePress activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.foundationCard, { backgroundColor: c.card, borderColor: item.color + "40", borderBottomColor: item.color }]}>
        <View style={[styles.foundationIcon, { backgroundColor: item.tint }]}>
          <GameIcon name={item.icon} size={46} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: c.foreground }]}>{item.title}</Text>
          <Text style={[styles.cardSubtitle, { color: c.mutedForeground }]}>{item.subtitle}</Text>
        </View>
        <Text style={[styles.chevron, { color: item.color }]}>›</Text>
      </View>
    </HapticTouchable>
  );
}

function SkillCard({ item, onPress }: { item: PracticeItem; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <View style={styles.skillCardWrapper}>
      <HapticTouchable scalePress activeOpacity={0.9} onPress={onPress}>
        <View style={[styles.skillCard, { backgroundColor: c.card, borderColor: item.color + "40", borderBottomColor: item.color }]}>
          <View style={[styles.skillIcon, { backgroundColor: item.tint }]}>
            <GameIcon name={item.icon} size={44} />
          </View>
          <Text style={[styles.skillTitle, { color: c.foreground }]}>{item.title}</Text>
          <Text style={[styles.skillSubtitle, { color: item.color }]}>{item.subtitle}</Text>
          {item.meta ? <Text style={[styles.skillMeta, { color: c.mutedForeground }]}>{item.meta}</Text> : null}
        </View>
      </HapticTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.xl },
  title: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold, letterSpacing: -0.4 },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 20 },
  section: { gap: spacing.md },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  sectionSubtitle: { fontSize: fontSize.sm, lineHeight: 20 },
  foundationList: { gap: spacing.md },
  foundationCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  foundationIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  cardSubtitle: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 2 },
  chevron: { fontSize: 34, lineHeight: 36, fontFamily: fontFamily.extraBold },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm },
  skillCardWrapper: { width: "48.5%" },
  skillCard: {
    height: 176,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  skillIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  skillTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  skillSubtitle: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: 2 },
  skillMeta: { fontSize: fontSize.xs, lineHeight: 17, marginTop: spacing.xs },
  resultsCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  resultsIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  resultsSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 18 },
  mascotRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  mascotBubble: { flex: 1, borderWidth: 1.5, borderRadius: radius.xl, padding: spacing.md },
  mascotText: { fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.semiBold },
});
