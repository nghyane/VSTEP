import { useState, useRef, useEffect } from "react";
import {
  Animated,
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
import { api } from "@/lib/api";
import { getRefreshToken, saveTokens } from "@/lib/auth";
import type { AuthUser, Profile } from "@/types/api";

type Level = "B1" | "B2" | "C1";
type StudyTime = 15 | 30 | 45 | 60;
type Deadline = "3m" | "6m" | "1y" | "none";

const STEP_META: { key: string; label: string; mascot: MascotName }[] = [
  { key: "welcome", label: "Bắt đầu", mascot: "wave" },
  { key: "target", label: "Mục tiêu", mascot: "hero" },
  { key: "time", label: "Lịch học", mascot: "think" },
  { key: "deadline", label: "Thời hạn", mascot: "levelup" },
];

export default function OnboardingScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, signIn } = useAuth();
  const [finishing, setFinishing] = useState(false);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<Level>("B2");
  const [studyTime, setStudyTime] = useState<StudyTime>(30);
  const [deadline, setDeadline] = useState<Deadline>("6m");

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
  }, [step]);

  async function next() {
    if (step < STEP_META.length - 1) {
      slideAnim.setValue(20);
      setStep(step + 1);
    } else {
      // Bước cuối: switch-profile để reissue token với active_profile_id
      if (!profile) { router.replace("/(app)/(tabs)"); return; }
      setFinishing(true);
      try {
        const refreshToken = await getRefreshToken();
        const res = await api.post<{ accessToken: string; refreshToken: string; profile: Profile }>(
          "/api/v1/auth/switch-profile",
          { profile_id: profile.id, refresh_token: refreshToken },
        );
        await saveTokens(res.accessToken, res.refreshToken, user!, res.profile);
        await signIn(res.accessToken, res.refreshToken, user!, res.profile);
      } catch {
        // Nếu fail vẫn vào app, token cũ sẽ dùng được nếu đã có profile
      } finally {
        setFinishing(false);
        router.replace("/(app)/(tabs)");
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
          <HapticTouchable onPress={back} style={s.backBtn} scalePress>
            <Text style={[s.backText, { color: c.mutedForeground }]}>Quay lại</Text>
          </HapticTouchable>
        ) : (
          <HapticTouchable onPress={() => router.replace("/(app)/(tabs)")} style={s.backBtn} scalePress>
            <Text style={[s.backText, { color: c.mutedForeground }]}>Bỏ qua</Text>
          </HapticTouchable>
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
            {step === 1 ? "Chọn band mục tiêu" : null}
            {step === 2 ? "Thời gian học mỗi ngày" : null}
            {step === 3 ? "Thời hạn hoàn thành" : null}
          </Text>
          <Text style={[s.desc, { color: c.mutedForeground }]}>
            {step === 0 ? "Hành trình chinh phục chứng chỉ tiếng Anh bắt đầu từ đây." : null}
            {step === 1 ? "Band VSTEP bạn muốn đạt được?" : null}
            {step === 2 ? "Bạn có thể dành bao nhiêu phút mỗi ngày?" : null}
            {step === 3 ? "Khi nào bạn muốn hoàn thành mục tiêu?" : null}
          </Text>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <View style={s.welcomeCard}>
              <Text style={[s.welcomeItem, { color: c.foreground }]}>
                VSTEP đánh giá 4 kỹ năng: Nghe, Đọc, Viết, Nói
              </Text>
              <Text style={[s.welcomeItem, { color: c.foreground }]}>
                AI chấm điểm chi tiết, phản hồi từng câu
              </Text>
              <Text style={[s.welcomeItem, { color: c.foreground }]}>
                Lộ trình luyện tập cá nhân hóa theo trình độ
              </Text>
            </View>
          )}

          {/* Step 1: Target Band */}
          {step === 1 && (
            <View style={s.optionList}>
              {(["B1", "B2", "C1"] as Level[]).map((lvl, i) => {
                const selected = target === lvl;
                return (
                  <HapticTouchable
                    key={lvl}
                    onPress={() => setTarget(lvl)}
                    scalePress
                    style={[
                      s.optionCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <Text style={[s.optionLevel, { color: selected ? c.primary : c.foreground }]}>
                      {lvl}
                    </Text>
                    <Text style={[s.optionDesc, { color: selected ? c.primaryDark : c.mutedForeground }]}>
                      {lvl === "B1" ? "Trung cấp — giao tiếp cơ bản" : lvl === "B2" ? "Trên trung cấp — giao tiếp độc lập" : "Nâng cao — giao tiếp thành thạo"}
                    </Text>
                    {selected && (
                      <View style={[s.checkBadge, { backgroundColor: c.primary }]}>
                        <Text style={s.checkMark}>✓</Text>
                      </View>
                    )}
                  </HapticTouchable>
                );
              })}
            </View>
          )}

          {/* Step 2: Study Time */}
          {step === 2 && (
            <View style={s.timeGrid}>
              {([15, 30, 45, 60] as StudyTime[]).map((mins) => {
                const selected = studyTime === mins;
                return (
                  <HapticTouchable
                    key={mins}
                    onPress={() => setStudyTime(mins)}
                    scalePress
                    style={[
                      s.timeCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <Text style={[s.timeValue, { color: selected ? c.primary : c.foreground }]}>
                      {mins}
                    </Text>
                    <Text style={[s.timeUnit, { color: selected ? c.primaryDark : c.mutedForeground }]}>
                      phút/ngày
                    </Text>
                  </HapticTouchable>
                );
              })}
            </View>
          )}

          {/* Step 3: Deadline */}
          {step === 3 && (
            <View style={s.optionList}>
              {([
                { key: "3m" as Deadline, label: "3 tháng", desc: "Cấp tốc" },
                { key: "6m" as Deadline, label: "6 tháng", desc: "Phổ biến nhất" },
                { key: "1y" as Deadline, label: "1 năm", desc: "Ổn định" },
                { key: "none" as Deadline, label: "Không giới hạn", desc: "Tự do" },
              ]).map(({ key, label, desc }) => {
                const selected = deadline === key;
                return (
                  <HapticTouchable
                    key={key}
                    onPress={() => setDeadline(key)}
                    scalePress
                    style={[
                      s.optionCard,
                      {
                        borderColor: selected ? c.primary : c.border,
                        borderBottomColor: selected ? c.primaryDark : "#CACACA",
                        backgroundColor: selected ? c.primaryTint : c.surface,
                      },
                    ]}
                  >
                    <Text style={[s.optionLevel, { color: selected ? c.primary : c.foreground }]}>
                      {label}
                    </Text>
                    <Text style={[s.optionDesc, { color: selected ? c.primaryDark : c.mutedForeground }]}>
                      {desc}
                    </Text>
                    {selected && (
                      <View style={[s.checkBadge, { backgroundColor: c.primary }]}>
                        <Text style={s.checkMark}>✓</Text>
                      </View>
                    )}
                  </HapticTouchable>
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
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  optionLevel: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, width: 36 },
  optionDesc: { flex: 1, fontSize: fontSize.sm },
  checkBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  checkMark: { color: "#FFF", fontSize: 14, fontFamily: fontFamily.bold },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timeCard: {
    width: "47%",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  timeValue: { fontSize: 32, fontFamily: fontFamily.extraBold },
  timeUnit: { fontSize: fontSize.xs, marginTop: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.base },
});