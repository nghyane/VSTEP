import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useCreateGoal, useProgress, useUpdateGoal } from "@/hooks/use-progress";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { VstepBand } from "@/types/api";

const TOTAL_STEPS = 4;

// ─── Option card ────────────────────────────────────────────────────────────

interface OptionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
}

function OptionCard({ icon, title, subtitle, selected, badge, onPress }: OptionCardProps) {
  const c = useThemeColors();
  return (
    <HapticTouchable
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.optionCard,
        {
          borderColor: selected ? c.primary : c.border,
          backgroundColor: selected ? c.primary + "08" : c.card,
        },
      ]}
    >
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: selected ? c.primary + "18" : c.muted },
        ]}
      >
        <Ionicons name={icon} size={22} color={selected ? c.primary : c.mutedForeground} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: c.foreground }]}>{title}</Text>
        <Text style={[styles.optionSubtitle, { color: c.mutedForeground }]}>{subtitle}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: c.primary + "18" }]}>
          <Text style={[styles.badgeText, { color: c.primary }]}>{badge}</Text>
        </View>
      )}
      {selected && (
        <Ionicons name="checkmark-circle" size={22} color={c.primary} />
      )}
    </HapticTouchable>
  );
}

// ─── Band card (larger, for step 3) ─────────────────────────────────────────

interface BandCardProps {
  band: VstepBand;
  score: string;
  description: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
}

function BandCard({ band, score, description, selected, badge, onPress }: BandCardProps) {
  const c = useThemeColors();
  return (
    <HapticTouchable
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.bandCard,
        {
          borderColor: selected ? c.primary : c.border,
          backgroundColor: selected ? c.primary + "08" : c.card,
        },
      ]}
    >
      <View style={styles.bandCardHeader}>
        <Text style={[styles.bandLabel, { color: selected ? c.primary : c.foreground }]}>
          {band}
        </Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: c.primary + "18" }]}>
            <Text style={[styles.badgeText, { color: c.primary }]}>{badge}</Text>
          </View>
        )}
        {selected && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
      </View>
      <Text style={[styles.bandScore, { color: c.mutedForeground }]}>{score}</Text>
      <Text style={[styles.bandDesc, { color: c.mutedForeground }]}>{description}</Text>
    </HapticTouchable>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const progressQuery = useProgress();
  const existingGoal = progressQuery.data?.goal ?? null;
  const isMutating = createGoal.isPending || updateGoal.isPending;

  const [step, setStep] = useState(0);
  const [targetBand, setTargetBand] = useState<VstepBand>("B2");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [timeline, setTimeline] = useState("6m");
  const isTransitioning = useRef(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  function animateTransition(direction: "forward" | "back", callback: () => void) {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const exitTo = direction === "forward" ? -50 : 50;
    const enterFrom = direction === "forward" ? 50 : -50;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: exitTo,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterFrom);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isTransitioning.current = false;
      });
    });
  }

  function animateProgress(toStep: number) {
    Animated.timing(progressAnim, {
      toValue: toStep / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }

  function goForward() {
    if (isTransitioning.current) return;
    const next = step + 1;
    animateTransition("forward", () => setStep(next));
    animateProgress(next);
  }

  function goBack() {
    if (isTransitioning.current) return;
    const prev = step - 1;
    animateTransition("back", () => setStep(prev));
    animateProgress(prev);
  }

  function handleSubmit() {
    if (isMutating) return;
    const now = new Date();
    switch (timeline) {
      case "3m":
        now.setMonth(now.getMonth() + 3);
        break;
      case "6m":
        now.setMonth(now.getMonth() + 6);
        break;
      case "1y":
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setFullYear(now.getFullYear() + 2);
        break;
    }
    const deadline = now.toISOString();
    const payload = { targetBand, deadline, dailyStudyTimeMinutes: dailyMinutes };
    const onSuccess = async () => {
      await progressQuery.refetch();
      router.replace("/(app)/(tabs)");
    };
    const onError = (err: Error) => {
      Alert.alert("Lỗi", err.message || "Không thể lưu mục tiêu");
    };

    if (existingGoal) {
      updateGoal.mutate({ id: existingGoal.id, ...payload }, { onSuccess, onError });
    } else {
      createGoal.mutate(payload, {
        onSuccess,
        onError: (err: Error) => {
          // 409 = goal already exists, refetch and try update
          if (err.message?.includes("already")) {
            progressQuery.refetch().then(() => {
              const goal = progressQuery.data?.goal;
              if (goal) {
                updateGoal.mutate({ id: goal.id, ...payload }, { onSuccess, onError });
              } else {
                onError(err);
              }
            });
          } else {
            onError(err);
          }
        },
      });
    }
  }

  const canContinue = step >= 0 && step <= 3;

  // ─── Step content ───────────────────────────────────────────────────────

  function renderStepContent() {
    switch (step) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            <View style={styles.illustrationArea}>
              {/* Main circle */}
              <View style={[styles.mainCircle, { backgroundColor: c.primary + '15' }]}>
                <Ionicons name="school" size={56} color={c.primary} />
              </View>
              {/* Floating skill icons */}
              <View style={[styles.floatingIcon, styles.floatingTopLeft, { backgroundColor: c.skillListening + '20' }]}>
                <Ionicons name="headset" size={20} color={c.skillListening} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingTopRight, { backgroundColor: c.skillSpeaking + '20' }]}>
                <Ionicons name="mic" size={20} color={c.skillSpeaking} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingBottomLeft, { backgroundColor: c.skillReading + '20' }]}>
                <Ionicons name="book" size={20} color={c.skillReading} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingBottomRight, { backgroundColor: c.skillWriting + '20' }]}>
                <Ionicons name="create" size={20} color={c.skillWriting} />
              </View>
            </View>
            <Text style={[styles.welcomeTitle, { color: c.foreground }]}>
              Học thông minh hơn với AI
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: c.mutedForeground }]}>
              Luyện tập Nghe, Nói, Đọc, Viết với AI chấm điểm và hướng dẫn bạn cải thiện
            </Text>
          </View>
        );

      case 1:
        return (
          <>
            <StepHeader
              step={1}
              title="Mục tiêu band điểm VSTEP?"
              subtitle="Hệ thống sẽ điều chỉnh bài tập phù hợp"
            />
            <View style={styles.optionList}>
              <BandCard
                band="B1"
                score="4.0 – 5.5"
                description="Giao tiếp cơ bản trong cuộc sống"
                selected={targetBand === "B1"}
                onPress={() => setTargetBand("B1")}
              />
              <BandCard
                band="B2"
                score="6.0 – 8.0"
                description="Chuẩn đầu ra phổ biến nhất"
                selected={targetBand === "B2"}
                badge="Phổ biến"
                onPress={() => setTargetBand("B2")}
              />
              <BandCard
                band="C1"
                score="8.5 – 10"
                description="Thành thạo, sử dụng linh hoạt"
                selected={targetBand === "C1"}
                onPress={() => setTargetBand("C1")}
              />
            </View>
          </>
        );

      case 2:
        return (
          <>
            <StepHeader
              step={2}
              title="Mỗi ngày bạn có thể học bao lâu?"
              subtitle="Đều đặn quan trọng hơn thời lượng"
            />
            <View style={styles.optionList}>
              <OptionCard
                icon="time-outline"
                title="15 phút"
                subtitle="Ít nhưng đều đặn"
                selected={dailyMinutes === 15}
                onPress={() => setDailyMinutes(15)}
              />
              <OptionCard
                icon="time-outline"
                title="30 phút"
                subtitle="Phù hợp với đa số"
                selected={dailyMinutes === 30}
                badge="Gợi ý"
                onPress={() => setDailyMinutes(30)}
              />
              <OptionCard
                icon="time-outline"
                title="45 phút"
                subtitle="Tiến bộ nhanh hơn"
                selected={dailyMinutes === 45}
                onPress={() => setDailyMinutes(45)}
              />
              <OptionCard
                icon="time-outline"
                title="60+ phút"
                subtitle="Chuẩn bị gấp, tập trung cao"
                selected={dailyMinutes === 60}
                onPress={() => setDailyMinutes(60)}
              />
            </View>
          </>
        );

      case 3:
        return (
          <>
            <StepHeader
              step={3}
              title="Khi nào bạn cần đạt mục tiêu?"
              subtitle="Chúng tôi sẽ xây dựng kế hoạch phù hợp"
            />
            <View style={styles.optionList}>
              <OptionCard
                icon="flash"
                title="3 tháng"
                subtitle="Chuẩn bị ngắn hạn"
                selected={timeline === "3m"}
                onPress={() => setTimeline("3m")}
              />
              <OptionCard
                icon="calendar"
                title="6 tháng"
                subtitle="Thời gian lý tưởng"
                selected={timeline === "6m"}
                badge="Gợi ý"
                onPress={() => setTimeline("6m")}
              />
              <OptionCard
                icon="calendar-outline"
                title="1 năm"
                subtitle="Chuẩn bị kỹ lưỡng"
                selected={timeline === "1y"}
                onPress={() => setTimeline("1y")}
              />
              <OptionCard
                icon="infinite"
                title="Không giới hạn"
                subtitle="Học theo tốc độ của bạn"
                selected={timeline === "none"}
                onPress={() => setTimeline("none")}
              />
            </View>
          </>
        );

      default:
        return null;
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: c.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {renderStepContent()}
        </Animated.View>
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: c.background,
            paddingBottom: Math.max(insets.bottom, spacing.base),
            borderTopColor: c.border,
          },
        ]}
      >
        {step === 0 ? (
          <HapticTouchable
            activeOpacity={0.8}
            style={[styles.primaryBtnFull, { backgroundColor: c.primary }]}
            onPress={goForward}
          >
            <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>Bắt đầu</Text>
          </HapticTouchable>
        ) : (
          <View style={styles.btnRow}>
            <HapticTouchable
              activeOpacity={0.7}
              style={[styles.outlineBtn, { borderColor: c.border }]}
              onPress={goBack}
            >
              <Ionicons name="chevron-back" size={18} color={c.foreground} />
              <Text style={[styles.btnTextOutline, { color: c.foreground }]}>Quay lại</Text>
            </HapticTouchable>

            {step === 3 ? (
              <HapticTouchable
                activeOpacity={0.8}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: c.primary,
                    opacity: isMutating ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={isMutating}
              >
                {isMutating ? (
                  <ActivityIndicator size="small" color={c.primaryForeground} />
                ) : (
                  <>
                    <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>
                      Hoàn tất
                    </Text>
                    <Ionicons name="checkmark" size={18} color={c.primaryForeground} />
                  </>
                )}
              </HapticTouchable>
            ) : (
              <HapticTouchable
                activeOpacity={0.8}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: c.primary,
                    opacity: canContinue ? 1 : 0.5,
                  },
                ]}
                onPress={goForward}
                disabled={!canContinue}
              >
                <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>
                  Tiếp tục
                </Text>
                <Ionicons name="chevron-forward" size={18} color={c.primaryForeground} />
              </HapticTouchable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Step header ──────────────────────────────────────────────────────────

function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle: string;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.stepHeader}>
      <Text style={[styles.stepIndicator, { color: c.mutedForeground }]}>
        Bước {step} / {TOTAL_STEPS - 1}
      </Text>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    width: "100%",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
  },

  // Welcome (step 0)
  welcomeContainer: {
    alignItems: "center",
    paddingTop: spacing["2xl"],
    gap: spacing.lg,
  },
  illustrationArea: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  mainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingIcon: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingTopLeft: {
    top: 10,
    left: 10,
  },
  floatingTopRight: {
    top: 10,
    right: 10,
  },
  floatingBottomLeft: {
    bottom: 10,
    left: 10,
  },
  floatingBottomRight: {
    bottom: 10,
    right: 10,
  },
  welcomeTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.base,
  },

  // Step header
  stepHeader: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  stepIndicator: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  // Option cards
  optionList: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  optionSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Badge
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },

  // Band cards (step 3)
  bandCard: {
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.xs,
  },
  bandCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bandLabel: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    flex: 1,
  },
  bandScore: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  bandDesc: {
    fontSize: fontSize.sm,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  btnRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  primaryBtnFull: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  outlineBtn: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  btnTextPrimary: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  btnTextOutline: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
});
