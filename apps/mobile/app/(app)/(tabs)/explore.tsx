import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { useProgress } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill, VstepBand } from "@/types/api";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Data ────────────────────────────────────────────────────────────────────

const SKILLS_DATA: { key: Skill; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "listening", label: "Listening", desc: "Luyện nghe hội thoại và bài giảng thực tế", icon: "headset" },
  { key: "reading", label: "Reading", desc: "Phân tích đoạn văn, tìm ý chính nhanh chóng", icon: "book" },
  { key: "writing", label: "Writing", desc: "Viết luận và thư với phản hồi chi tiết từ AI", icon: "create" },
  { key: "speaking", label: "Speaking", desc: "Luyện nói theo chủ đề, AI đánh giá phát âm", icon: "mic" },
];

const STEPS = [
  {
    num: "1",
    title: "Làm bài thi thử",
    desc: "Chọn đề thi Aptis đầy đủ 4 kỹ năng hoặc luyện riêng từng phần.",
    icon: "document-text" as const,
    gradient: ["#4F5BD5", "#6C7BF0"] as [string, string],
  },
  {
    num: "2",
    title: "AI chấm điểm tức thì",
    desc: "AI phân tích Writing & Speaking theo rubric chuẩn Aptis, trả kết quả trong vài phút.",
    icon: "flash" as const,
    gradient: ["#30A46C", "#4FD1A0"] as [string, string],
  },
  {
    num: "3",
    title: "Lộ trình cá nhân",
    desc: "Phân tích điểm mạnh / yếu và bài tập gợi ý riêng theo trình độ của bạn.",
    icon: "trending-up" as const,
    gradient: ["#E5A700", "#F0C850"] as [string, string],
  },
];

const BANDS: { level: VstepBand; label: string; desc: string; skills: string[]; color: string; bgColor: string }[] = [
  {
    level: "B1",
    label: "Trung cấp",
    desc: "Giao tiếp hàng ngày, hiểu ý chính khi nghe và đọc.",
    skills: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
    color: "#4B7BF5",
    bgColor: "#4B7BF510",
  },
  {
    level: "B2",
    label: "Trung cấp cao",
    desc: "Tự tin trong môi trường học thuật và chuyên môn.",
    skills: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
    color: "#4F5BD5",
    bgColor: "#4F5BD510",
  },
  {
    level: "C1",
    label: "Nâng cao",
    desc: "Sử dụng tiếng Anh linh hoạt trong mọi tình huống phức tạp.",
    skills: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
    color: "#7C5BD5",
    bgColor: "#7C5BD510",
  },
];

const TESTIMONIALS = [
  {
    name: "Minh Anh",
    role: "Sinh viên ĐH Bách Khoa",
    quote: "Mình từ B1 lên B2 sau 2 tháng luyện tập. AI chấm Writing rất chi tiết, chỉ ra đúng lỗi cần sửa.",
    score: "B1 → B2",
    initials: "MA",
  },
  {
    name: "Thanh Hà",
    role: "Nhân viên văn phòng",
    quote: "Giao diện dễ dùng, luyện 15 phút mỗi ngày. Tiết kiệm thời gian hơn đi học trung tâm.",
    score: "B2 → C1",
    initials: "TH",
  },
  {
    name: "Đức Huy",
    role: "Giảng viên tiếng Anh",
    quote: "Đề thi sát chuẩn Aptis, phù hợp để giới thiệu cho sinh viên luyện tập thêm ngoài giờ.",
    score: "Đề xuất cho SV",
    initials: "ĐH",
  },
];

// ─── Fade-in hook ────────────────────────────────────────────────────────────

function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useProgress();

  const scrollY = useRef(new Animated.Value(0)).current;

  const goal = progress.data?.goal ?? null;
  const skills = progress.data?.skills ?? [];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} />
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        <HeroSection colors={c} topInset={insets.top} />

        {goal && (
          <LevelCard
            goal={goal}
            skills={skills}
            colors={c}
            onAdjust={() => router.push("/(app)/goal")}
          />
        )}

        <SkillsSection colors={c} onSkillPress={(s) => router.push(`/(app)/practice/${s}`)} />
        <HowItWorksSection colors={c} />
        <RoadmapSection colors={c} />
        <TestimonialsSection colors={c} />
        <CtaSection colors={c} onPress={() => router.push("/(app)/(tabs)/exams")} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection({ colors: c, topInset }: { colors: ReturnType<typeof useThemeColors>; topInset: number }) {
  const anim1 = useFadeIn(100);
  const anim2 = useFadeIn(250);

  return (
    <View style={[styles.heroContainer, { paddingTop: HEADER_H + topInset + 16 }]}>
      <Animated.Text style={[styles.heroTitle, { color: c.foreground }, anim1]}>
        Khám phá lộ trình{"\n"}luyện thi
      </Animated.Text>
      <Animated.Text style={[styles.heroAccent, { color: c.primary }, anim2]}>
        dành riêng cho bạn
      </Animated.Text>
    </View>
  );
}

// ─── Level Card ──────────────────────────────────────────────────────────────

function LevelCard({
  goal,
  skills,
  colors: c,
  onAdjust,
}: {
  goal: NonNullable<ReturnType<typeof useProgress>["data"]>["goal"];
  skills: NonNullable<ReturnType<typeof useProgress>["data"]>["skills"];
  colors: ReturnType<typeof useThemeColors>;
  onAdjust: () => void;
}) {
  const anim = useFadeIn(350);
  if (!goal) return null;

  const currentLevels = skills
    .map((s) => s.currentLevel)
    .filter(Boolean);
  const displayCurrent = goal.currentEstimatedBand ?? (currentLevels.length > 0 ? currentLevels[0] : "—");

  return (
    <Animated.View style={[styles.levelCard, { backgroundColor: c.muted, borderColor: c.border }, anim]}>
      <View style={[styles.levelBadge, { backgroundColor: c.primary + "18" }]}>
        <Text style={[styles.levelBadgeText, { color: c.primary }]}>Aptis</Text>
      </View>
      <Text style={[styles.levelTitle, { color: c.foreground }]}>
        {displayCurrent} → {goal.targetBand}
      </Text>
      <HapticTouchable
        style={[styles.levelBtn, { borderColor: c.border }]}
        onPress={onAdjust}
      >
        <Text style={[styles.levelBtnText, { color: c.primary }]}>Điều chỉnh lộ trình của bạn</Text>
      </HapticTouchable>
    </Animated.View>
  );
}

// ─── Skills Section ──────────────────────────────────────────────────────────

function SkillsSection({
  colors: c,
  onSkillPress,
}: {
  colors: ReturnType<typeof useThemeColors>;
  onSkillPress: (skill: Skill) => void;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const anim = useFadeIn(450);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth = (SCREEN_W - spacing.xl * 2) / 2;

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveTab(index);
      Animated.spring(indicatorX, {
        toValue: index * tabWidth,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    },
    [indicatorX, tabWidth],
  );

  // Show skills for active tab: 0 = receptive (listening, reading), 1 = productive (writing, speaking)
  const tabSkills = activeTab === 0
    ? SKILLS_DATA.filter((s) => s.key === "listening" || s.key === "reading")
    : SKILLS_DATA.filter((s) => s.key === "writing" || s.key === "speaking");

  return (
    <Animated.View style={[styles.section, anim]}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>
        Sẵn sàng phá vỡ giới hạn?
      </Text>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: c.muted }]}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: tabWidth,
              backgroundColor: c.primary,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
        {["Nghe & Đọc", "Viết & Nói"].map((label, i) => (
          <HapticTouchable
            key={label}
            style={styles.tab}
            onPress={() => handleTabPress(i)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === i ? "#fff" : c.mutedForeground },
              ]}
            >
              {label}
            </Text>
          </HapticTouchable>
        ))}
      </View>

      {/* Skill Cards */}
      {tabSkills.map((skill) => (
        <SkillCard
          key={skill.key}
          skill={skill}
          colors={c}
          onPress={() => onSkillPress(skill.key)}
        />
      ))}
    </Animated.View>
  );
}

function SkillCard({
  skill,
  colors: c,
  onPress,
}: {
  skill: (typeof SKILLS_DATA)[number];
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const skillColor = useSkillColor(skill.key);

  return (
    <HapticTouchable
      style={[styles.skillCard, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.skillIconBox, { backgroundColor: skillColor + "15" }]}>
        <Ionicons name={skill.icon} size={24} color={skillColor} />
      </View>
      <View style={styles.skillCardContent}>
        <Text style={[styles.skillCardTitle, { color: c.foreground }]}>{skill.label}</Text>
        <Text style={[styles.skillCardDesc, { color: c.mutedForeground }]}>{skill.desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
    </HapticTouchable>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorksSection({ colors: c }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>
        Tối ưu hành trình luyện thi
      </Text>
      <Text style={[styles.sectionSub, { color: c.mutedForeground }]}>
        3 bước đơn giản để chinh phục Aptis cùng AI
      </Text>
      {STEPS.map((step, i) => (
        <StepCard key={step.num} step={step} index={i} colors={c} />
      ))}
    </View>
  );
}

function StepCard({
  step,
  index,
  colors: c,
}: {
  step: (typeof STEPS)[number];
  index: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const anim = useFadeIn(500 + index * 150);

  return (
    <Animated.View style={[styles.stepCard, anim]}>
      <View style={[styles.stepGradientBg, { backgroundColor: step.gradient[0] }]}>
        <Text style={styles.stepWatermark}>Bước {step.num}</Text>
        <View style={styles.stepContent}>
          <View style={styles.stepIconCircle}>
            <Ionicons name={step.icon} size={22} color="#fff" />
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDesc}>{step.desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Roadmap Section ─────────────────────────────────────────────────────────

function RoadmapSection({ colors: c }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lộ trình rõ ràng</Text>
      <Text style={[styles.sectionSub, { color: c.mutedForeground }]}>
        Từ B1 đến C1 — mỗi cấp là một bước tiến cụ thể
      </Text>
      {BANDS.map((band, i) => (
        <BandCard key={band.level} band={band} index={i} colors={c} />
      ))}
    </View>
  );
}

function BandCard({
  band,
  index,
  colors: c,
}: {
  band: (typeof BANDS)[number];
  index: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const anim = useFadeIn(600 + index * 180);

  return (
    <Animated.View
      style={[
        styles.bandCard,
        { backgroundColor: c.card, borderColor: c.border, borderLeftColor: band.color, borderLeftWidth: 4 },
        anim,
      ]}
    >
      <View style={styles.bandHeader}>
        <View style={[styles.bandBadge, { backgroundColor: band.color }]}>
          <Text style={styles.bandBadgeText}>{band.level}</Text>
        </View>
        <View style={styles.bandHeaderText}>
          <Text style={[styles.bandLabel, { color: c.foreground }]}>{band.label}</Text>
          <Text style={[styles.bandDesc, { color: c.mutedForeground }]}>{band.desc}</Text>
        </View>
      </View>
      <View style={styles.bandTags}>
        {band.skills.map((s) => (
          <View key={s} style={[styles.bandTag, { backgroundColor: band.bgColor }]}>
            <Text style={[styles.bandTagText, { color: band.color }]}>{s}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Testimonials Section ────────────────────────────────────────────────────

function TestimonialsSection({ colors: c }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Học viên nói gì?</Text>
      <Text style={[styles.sectionSub, { color: c.mutedForeground }]}>
        Hàng nghìn người đã cải thiện điểm Aptis
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.testimonialScroll}
        decelerationRate="fast"
        snapToInterval={SCREEN_W * 0.78 + spacing.sm}
      >
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={t.name} item={t} index={i} colors={c} />
        ))}
      </ScrollView>
    </View>
  );
}

function TestimonialCard({
  item,
  index,
  colors: c,
}: {
  item: (typeof TESTIMONIALS)[number];
  index: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const anim = useFadeIn(700 + index * 120);

  return (
    <Animated.View style={[styles.testimonialCard, { backgroundColor: c.card, borderColor: c.border }, anim]}>
      <View style={styles.testimonialHeader}>
        <View style={[styles.testimonialAvatar, { backgroundColor: c.primary + "18" }]}>
          <Text style={[styles.testimonialInitials, { color: c.primary }]}>{item.initials}</Text>
        </View>
        <View>
          <Text style={[styles.testimonialName, { color: c.foreground }]}>{item.name}</Text>
          <Text style={[styles.testimonialRole, { color: c.mutedForeground }]}>{item.role}</Text>
        </View>
      </View>
      <Text style={[styles.testimonialQuote, { color: c.mutedForeground }]}>{item.quote}</Text>
      <View style={[styles.testimonialScoreBadge, { backgroundColor: c.success + "15" }]}>
        <Text style={[styles.testimonialScoreText, { color: c.success }]}>{item.score}</Text>
      </View>
    </Animated.View>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CtaSection({
  colors: c,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const anim = useFadeIn(900);

  return (
    <Animated.View style={[styles.ctaCard, { backgroundColor: c.primary + "08" }, anim]}>
      <Text style={[styles.ctaTitle, { color: c.foreground }]}>
        Bắt đầu luyện thi ngay hôm nay
      </Text>
      <Text style={[styles.ctaSub, { color: c.mutedForeground }]}>
        Chọn đề thi và làm bài thử đầu tiên — hoàn toàn miễn phí.
      </Text>
      <HapticTouchable
        style={[styles.ctaBtn, { backgroundColor: c.primary }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaBtnText}>Làm bài thi thử</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </HapticTouchable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },


  // Scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },

  // Hero
  heroContainer: { paddingBottom: spacing.sm },
  heroTitle: { fontSize: 30, fontFamily: fontFamily.extraBold, lineHeight: 40 },
  heroAccent: { fontSize: 30, fontFamily: fontFamily.extraBold, lineHeight: 40, marginTop: 2 },

  // Level Card
  levelCard: {
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    borderWidth: 1,
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  levelBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  levelTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  levelBtn: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  levelBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  // Section
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  sectionSub: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, marginTop: -spacing.sm + 2 },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: 3,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: radius.lg - 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    zIndex: 1,
  },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  // Skill Card
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  skillIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  skillCardContent: { flex: 1, gap: 2 },
  skillCardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  skillCardDesc: { fontSize: fontSize.xs, fontFamily: fontFamily.regular, lineHeight: 18 },

  // Step Card
  stepCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  stepGradientBg: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepWatermark: {
    fontSize: 42,
    fontFamily: fontFamily.extraBold,
    color: "rgba(255,255,255,0.15)",
    lineHeight: 48,
  },
  stepContent: { gap: spacing.sm },
  stepIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, color: "#fff" },
  stepDesc: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, color: "rgba(255,255,255,0.75)", lineHeight: 20 },

  // Band Card
  bandCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  bandHeader: { flexDirection: "row", gap: spacing.md },
  bandBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  bandBadgeText: { color: "#fff", fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  bandHeaderText: { flex: 1, gap: 2 },
  bandLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  bandDesc: { fontSize: fontSize.xs, fontFamily: fontFamily.regular, lineHeight: 18 },
  bandTags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bandTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  bandTagText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },

  // Testimonial
  testimonialScroll: { paddingRight: spacing.xl },
  testimonialCard: {
    width: SCREEN_W * 0.78,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  testimonialHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  testimonialInitials: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  testimonialName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  testimonialRole: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
  testimonialQuote: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, lineHeight: 22 },
  testimonialScoreBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  testimonialScoreText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },

  // CTA
  ctaCard: {
    borderRadius: radius["2xl"],
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  ctaTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, textAlign: "center" },
  ctaSub: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, textAlign: "center" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  ctaBtnText: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
});
