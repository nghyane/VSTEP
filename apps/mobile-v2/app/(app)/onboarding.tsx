import { useState, useRef, useEffect } from "react";
import {
  Animated,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mascot, type MascotName } from "@/components/Mascot";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { useAuth } from "@/hooks/use-auth";
import { completeOnboardingApi } from "@/lib/api";
import { showWelcomeGift } from "@/features/onboarding/welcome-gift-store";
import { getRefreshToken, saveTokens } from "@/lib/auth";
import type { AuthUser } from "@/types/api";

type TargetLevel = "B1" | "B2" | "C1";
type EntryLevel = "A1" | "A2" | "B1" | "B2" | "C1";
type StudyTime = 15 | 30 | 45 | 60;
type Deadline = "3m" | "6m" | "1y";

const STEP_META: { key: string; label: string; mascot: MascotName }[] = [
  { key: "welcome", label: "Bắt đầu", mascot: "wave" },
  { key: "entry", label: "Hiện tại", mascot: "think" },
  { key: "target", label: "Mục tiêu", mascot: "hero" },
  { key: "time", label: "Lịch học", mascot: "think" },
  { key: "deadline", label: "Thời hạn", mascot: "levelup" },
];

const ENTRY_LEVELS: EntryLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const TARGET_LEVELS: TargetLevel[] = ["B1", "B2", "C1"];
const LEVEL_RANK: Record<EntryLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };
const TARGET_INFO: Record<TargetLevel, string> = {
  B1: "Trung cấp — giao tiếp cơ bản",
  B2: "Trên trung cấp — giao tiếp độc lập",
  C1: "Nâng cao — giao tiếp thành thạo",
};

function availableTargets(entryLevel: EntryLevel): TargetLevel[] {
  return TARGET_LEVELS.filter((level) => LEVEL_RANK[level] >= LEVEL_RANK[entryLevel]);
}

function deadlineToDate(value: Deadline): string {
  const date = new Date();
  if (value === "3m") date.setMonth(date.getMonth() + 3);
  if (value === "6m") date.setMonth(date.getMonth() + 6);
  if (value === "1y") date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function defaultNickname(user: AuthUser | null): string {
  if (user?.fullName) return user.fullName;
  return user?.email.split("@")[0] ?? "Learner";
}

export default function OnboardingScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, signIn, suggestedNickname, setSuggestedNickname } = useAuth();
  const [finishing, setFinishing] = useState(false);
  const [step, setStep] = useState(0);
  const [entry, setEntry] = useState<EntryLevel>("A2");
  const [target, setTarget] = useState<TargetLevel>("B2");
  const [studyTime, setStudyTime] = useState<StudyTime>(30);
  const [deadline, setDeadline] = useState<Deadline>("6m");
  const targets = availableTargets(entry);

  const progressAnim = useRef(new Animated.Value(0.25)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEP_META.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [progressAnim, slideAnim, step]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (profile) return false;
      if (step > 0) setStep((current) => Math.max(0, current - 1));
      return true;
    });
    return () => subscription.remove();
  }, [profile, step]);

  function pickEntry(next: EntryLevel) {
    setEntry(next);
    const nextTargets = availableTargets(next);
    if (!nextTargets.includes(target)) setTarget(nextTargets[0] ?? "C1");
  }

  async function next() {
    if (step < STEP_META.length - 1) {
      slideAnim.setValue(20);
      setStep(step + 1);
    } else {
      if (!user) { router.replace("/(auth)/login"); return; }
      if (profile) { router.replace("/(app)/(tabs)"); return; }
      setFinishing(true);
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("Missing refresh token");
        const nickname = suggestedNickname?.trim() || defaultNickname(user);
        const res = await completeOnboardingApi(nickname, entry, target, deadlineToDate(deadline));
        await saveTokens(res.accessToken, refreshToken, user, res.profile);
        await signIn(res.accessToken, refreshToken, user, res.profile);
        if (res.onboardingBonus?.granted) {
          showWelcomeGift(res.onboardingBonus.amount);
        }
        setSuggestedNickname(null);
        router.replace("/(app)/(tabs)");
      } catch {
        setFinishing(false);
      }
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const meta = STEP_META[step];

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing.base }]}>
        {step > 0 ? (
          <View style={s.backBtn}>
            <HapticTouchable onPress={back} scalePress>
              <Text style={[s.backText, { color: c.mutedForeground }]}>Quay lại</Text>
            </HapticTouchable>
          </View>
        ) : (
          <View style={s.backBtn} />
        )}
        <Text style={[s.stepText, { color: c.subtle }]}>
          {step + 1}/{STEP_META.length}
        </Text>
        <View style={s.backBtn} />
      </View>

      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
        <Animated.View
          style={[s.progressBar, { backgroundColor: c.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* Mascot */}
          <View style={s.mascotSection}>
            <Mascot name={meta.mascot} size={110} animation="none" />
          </View>

          <Text style={[s.title, { color: c.foreground }]}>
            {step === 0 ? "Chào mừng đến VSTEP!" : null}
            {step === 1 ? "Trình độ hiện tại" : null}
            {step === 2 ? "Chọn band mục tiêu" : null}
            {step === 3 ? "Thời gian học mỗi ngày" : null}
            {step === 4 ? "Thời hạn hoàn thành" : null}
          </Text>
          <Text style={[s.desc, { color: c.mutedForeground }]}>
            {step === 0 ? "Hành trình chinh phục chứng chỉ tiếng Anh bắt đầu từ đây." : null}
            {step === 1 ? "Bạn đang ở khoảng level nào? Có thể tự ước lượng trước." : null}
            {step === 2 ? "Band VSTEP bạn muốn đạt được?" : null}
            {step === 3 ? "Bạn có thể dành bao nhiêu phút mỗi ngày?" : null}
            {step === 4 ? "Khi nào bạn muốn hoàn thành mục tiêu?" : null}
          </Text>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <View style={s.welcomeCard}>
              <Text style={[s.welcomeItem, { color: c.foreground }]}>
                VSTEP đánh giá 4 kỹ năng: Nghe, Đọc, Viết, Nói
              </Text>
              <Text style={[s.welcomeItem, { color: c.foreground }]}>
                Hệ thống chấm điểm chi tiết, phản hồi từng câu
              </Text>
              <Text style={[s.welcomeItem, { color: c.foreground }]}>
                Lộ trình luyện tập cá nhân hóa theo trình độ
              </Text>
            </View>
          )}

          {/* Step 1: Entry Level */}
          {step === 1 && (
            <View style={s.entryGrid}>
              {ENTRY_LEVELS.map((lvl) => {
                const selected = entry === lvl;
                return (
                  <View
                    key={lvl}
                    style={[
                      s.entryCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <HapticTouchable onPress={() => pickEntry(lvl)} scalePress>
                      <View style={s.entryCardInner}>
                        <Text style={[s.entryLevel, { color: selected ? c.primary : c.foreground }]}>{lvl}</Text>
                      </View>
                    </HapticTouchable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Step 2: Target Band */}
          {step === 2 && (
            <View style={s.optionList}>
              {targets.map((lvl) => {
                const selected = target === lvl;
                return (
                  <View
                    key={lvl}
                    style={[
                      s.optionCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <HapticTouchable onPress={() => setTarget(lvl)} scalePress>
                      <View style={s.optionCardInner}>
                        <Text style={[s.optionLevel, { color: selected ? c.primary : c.foreground }]}>
                          {lvl}
                        </Text>
                        <Text style={[s.optionDesc, { color: selected ? c.primaryDark : c.mutedForeground }]}>
                          {TARGET_INFO[lvl]}
                        </Text>
                        {selected && (
                          <View style={[s.checkBadge, { backgroundColor: c.primary }]}>
                            <Text style={s.checkMark}>✓</Text>
                          </View>
                        )}
                      </View>
                    </HapticTouchable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Step 3: Study Time */}
          {step === 3 && (
            <View style={s.timeGrid}>
              {([15, 30, 45, 60] as StudyTime[]).map((mins) => {
                const selected = studyTime === mins;
                return (
                  <View
                    key={mins}
                    style={[
                      s.timeCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <HapticTouchable onPress={() => setStudyTime(mins)} scalePress>
                      <View style={s.timeCardInner}>
                        <Text style={[s.timeValue, { color: selected ? c.primary : c.foreground }]}>
                          {mins}
                        </Text>
                        <Text style={[s.timeUnit, { color: selected ? c.primaryDark : c.mutedForeground }]}>
                          phút/ngày
                        </Text>
                      </View>
                    </HapticTouchable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Step 4: Deadline */}
          {step === 4 && (
            <View style={s.optionList}>
              {([
                { key: "3m" as Deadline, label: "3 tháng", desc: "Cấp tốc" },
                { key: "6m" as Deadline, label: "6 tháng", desc: "Phổ biến nhất" },
                { key: "1y" as Deadline, label: "1 năm", desc: "Ổn định" },
              ]).map(({ key, label, desc }) => {
                const selected = deadline === key;
                return (
                  <View
                    key={key}
                    style={[
                      s.optionCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <HapticTouchable onPress={() => setDeadline(key)} scalePress>
                      <View style={s.optionCardInner}>
                        <Text style={[s.deadlineLevel, { color: selected ? c.primary : c.foreground }]} numberOfLines={1}>
                          {label}
                        </Text>
                        <Text
                          style={[s.optionDesc, { color: selected ? c.primaryDark : c.mutedForeground }]}
                        >
                          {desc}
                        </Text>
                        {selected && (
                          <View style={[s.checkBadge, { backgroundColor: c.primary }]}>
                            <Text style={s.checkMark}>✓</Text>
                          </View>
                        )}
                      </View>
                    </HapticTouchable>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <DepthButton fullWidth size="lg" onPress={next} disabled={finishing}>
          {finishing ? "Đang xử lý..." : step === STEP_META.length - 1 ? "Bắt đầu học tập!" : "Tiếp theo"}
        </DepthButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  backBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minWidth: 60 },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  stepText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  progressTrack: { height: 4, marginHorizontal: spacing.xl, borderRadius: 2, marginBottom: spacing.base },
  progressBar: { height: "100%", borderRadius: 2 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  mascotSection: { alignItems: "center", marginBottom: spacing.lg },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  desc: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 22 },
  welcomeCard: { gap: spacing.base, paddingHorizontal: spacing.md },
  welcomeItem: { fontSize: fontSize.base, lineHeight: 24 },
  optionList: { gap: spacing.sm },
  entryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  entryCard: {
    width: "30%",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  entryCardInner: { minHeight: 72, alignItems: "center", justifyContent: "center" },
  entryLevel: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  optionCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  optionCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  optionLevel: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, width: 36 },
  deadlineLevel: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, minWidth: 88, flexShrink: 0 },
  optionDesc: { flex: 1, fontSize: fontSize.sm },
  checkBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  checkMark: { color: "#FFF", fontSize: 14, fontFamily: fontFamily.bold },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timeCard: {
    width: "47%",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  timeCardInner: {
    paddingVertical: spacing.lg,
    alignItems: "center" as const,
  },
  timeValue: { fontSize: 32, fontFamily: fontFamily.extraBold },
  timeUnit: { fontSize: fontSize.xs, marginTop: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.base },
});
