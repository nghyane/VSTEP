import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useProgress, useUpdateGoal } from "@/hooks/use-progress";
import { useSelfAssess, useStartPlacement, useSkipOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/hooks/use-auth";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { QuestionLevel, VstepBand } from "@/types/api";

// ─── Data constants (mirrored from frontend) ────────────────────────────────

type Step = "welcome" | "self-assess" | "quiz" | "goal" | "skip";

const LEVELS = [
  {
    band: "A2" as QuestionLevel,
    title: "Mới bắt đầu (A2)",
    desc: "Bạn biết tiếng Anh cơ bản, giao tiếp đơn giản trong cuộc sống hàng ngày",
  },
  {
    band: "B1" as QuestionLevel,
    title: "Trung cấp (B1)",
    desc: "Hiểu ý chính khi nghe/đọc, viết được đoạn văn ngắn, nói được về chủ đề quen thuộc",
  },
  {
    band: "B2" as QuestionLevel,
    title: "Khá (B2)",
    desc: "Đọc hiểu báo chí, viết bài luận có cấu trúc, thảo luận tự tin về nhiều chủ đề",
  },
  {
    band: "C1" as QuestionLevel,
    title: "Nâng cao (C1)",
    desc: "Sử dụng tiếng Anh thành thạo, đọc tài liệu học thuật, viết essay phức tạp",
  },
];

const TARGET_BANDS: VstepBand[] = ["B1", "B2", "C1"];

const DEADLINES = [
  { label: "1 tháng", months: 1 },
  { label: "3 tháng", months: 3 },
  { label: "6 tháng", months: 6 },
  { label: "1 năm", months: 12 },
  { label: "Không giới hạn", months: undefined as number | undefined },
] as const;

const DAILY_TIMES = [
  { label: "15 phút", minutes: 15 },
  { label: "30 phút", minutes: 30 },
  { label: "1 giờ", minutes: 60 },
  { label: "2 giờ", minutes: 120 },
  { label: "Tuỳ tôi", minutes: undefined as number | undefined },
] as const;

const PREVIOUS_TESTS = [
  { value: "none", label: "Chưa từng" },
  { value: "vstep", label: "VSTEP" },
  { value: "ielts", label: "IELTS" },
  { value: "toeic", label: "TOEIC" },
  { value: "other", label: "Khác" },
] as const;

// ─── Quiz questions (identical to frontend) ──────────────────────────────────

interface QuizQuestion {
  stem: string;
  options: string[];
  correct: number;
  level: QuestionLevel;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { stem: "She _____ to school every day.", options: ["go", "goes", "going", "gone"], correct: 1, level: "A2" },
  { stem: "What is the opposite of 'hot'?", options: ["warm", "cold", "cool", "wet"], correct: 1, level: "A2" },
  { stem: "I _____ a student. I study at a university.", options: ["is", "are", "am", "be"], correct: 2, level: "A2" },
  { stem: "If it rains tomorrow, we _____ at home.", options: ["stay", "will stay", "stayed", "would stay"], correct: 1, level: "B1" },
  { stem: "He asked me where I _____.", options: ["live", "lived", "living", "was live"], correct: 1, level: "B1" },
  { stem: "The book _____ by millions of people worldwide.", options: ["has read", "has been read", "have read", "is reading"], correct: 1, level: "B1" },
  { stem: "Had she studied harder, she _____ the exam.", options: ["would pass", "will pass", "would have passed", "has passed"], correct: 2, level: "B2" },
  { stem: "The manager insisted that every employee _____ the meeting.", options: ["attends", "attend", "attended", "attending"], correct: 1, level: "B2" },
  { stem: "Scarcely had he arrived _____ the ceremony began.", options: ["than", "when", "that", "then"], correct: 1, level: "C1" },
  { stem: "The phenomenon, _____ implications are far-reaching, warrants further investigation.", options: ["which", "that", "whose", "whom"], correct: 2, level: "C1" },
];

const LETTERS = "ABCD";

function scoreQuiz(answers: number[]): QuestionLevel {
  const byLevel: Record<string, { correct: number; total: number }> = {};
  for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
    const q = QUIZ_QUESTIONS[i];
    if (!byLevel[q.level]) byLevel[q.level] = { correct: 0, total: 0 };
    byLevel[q.level].total++;
    if (answers[i] === q.correct) byLevel[q.level].correct++;
  }
  const levels: QuestionLevel[] = ["A2", "B1", "B2", "C1"];
  let ceiling: QuestionLevel = "A2";
  for (const level of levels) {
    const stats = byLevel[level];
    if (!stats || stats.total === 0) continue;
    if (stats.correct / stats.total >= 0.6) ceiling = level;
    else break;
  }
  return ceiling;
}

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

// ─── Band card ──────────────────────────────────────────────────────────────

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

// ─── Toggle chip ────────────────────────────────────────────────────────────

function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.toggleChip,
        {
          borderColor: active ? c.primary : c.border,
          backgroundColor: active ? c.primary + "10" : c.card,
        },
      ]}
    >
      <Text style={[styles.toggleChipText, { color: active ? c.primary : c.foreground }]}>
        {label}
      </Text>
    </HapticTouchable>
  );
}

// ─── Quiz view ──────────────────────────────────────────────────────────────

function QuizView({
  question,
  index,
  total,
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: number | null;
  onSelect: (optionIndex: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const c = useThemeColors();
  const progress = ((index + 1) / total) * 100;
  const isLast = index === total - 1;

  function optionColors(oi: number) {
    if (selected === null) return { bg: c.card, border: c.border, text: c.foreground, letterBg: c.muted, letterColor: c.mutedForeground };
    if (selected === oi) {
      const isCorrect = oi === question.correct;
      return {
        bg: isCorrect ? "#10b98115" : "#ef444515",
        border: isCorrect ? "#10b981" : "#ef4444",
        text: isCorrect ? "#059669" : "#dc2626",
        letterBg: isCorrect ? "#10b981" : "#ef4444",
        letterColor: "#ffffff",
      };
    }
    if (oi === question.correct) return { bg: "#10b98108", border: "#10b981", text: c.foreground, letterBg: c.muted, letterColor: c.mutedForeground };
    return { bg: c.card, border: c.border, text: c.mutedForeground, letterBg: c.muted, letterColor: c.mutedForeground };
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <HapticTouchable onPress={onBack}>
          <Text style={[styles.quizBackBtn, { color: c.mutedForeground }]}>← Thoát</Text>
        </HapticTouchable>
        <Text style={[styles.quizCounter, { color: c.mutedForeground }]}>
          Câu {index + 1}/{total}
        </Text>
      </View>
      <View style={[styles.quizProgressTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.quizProgressFill, { backgroundColor: c.primary, width: `${progress}%` }]} />
      </View>
      <View style={[styles.quizStemCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.quizStem, { color: c.foreground }]}>{question.stem}</Text>
      </View>
      <View style={{ gap: spacing.md }}>
        {question.options.map((opt, oi) => {
          const colors = optionColors(oi);
          return (
            <HapticTouchable
              key={`${index}-${oi}`}
              activeOpacity={0.7}
              disabled={selected !== null}
              onPress={() => onSelect(oi)}
              style={[styles.quizOption, { backgroundColor: colors.bg, borderColor: colors.border }]}
            >
              <View style={[styles.quizLetter, { backgroundColor: colors.letterBg }]}>
                <Text style={[styles.quizLetterText, { color: colors.letterColor }]}>{LETTERS[oi]}</Text>
              </View>
              <Text style={[styles.quizOptionText, { color: colors.text }]}>{opt}</Text>
            </HapticTouchable>
          );
        })}
      </View>
      {selected !== null && (
        <HapticTouchable
          activeOpacity={0.8}
          onPress={onNext}
          style={[styles.quizNextBtn, { backgroundColor: c.primary }]}
        >
          <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>
            {isLast ? "Xem kết quả" : "Câu tiếp theo"}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.primaryForeground} />
        </HapticTouchable>
      )}
    </View>
  );
}

// ─── Quiz result ────────────────────────────────────────────────────────────

function QuizResult({
  level,
  onRetry,
  onContinue,
}: {
  level: QuestionLevel;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const c = useThemeColors();
  const levelInfo = LEVELS.find((l) => l.band === level);
  return (
    <View style={{ alignItems: "center", gap: spacing.lg, paddingTop: spacing["2xl"] }}>
      <Text style={[styles.title, { color: c.foreground }]}>Kết quả đánh giá</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground, textAlign: "center" }]}>
        Dựa trên câu trả lời, trình độ ước tính của bạn là
      </Text>
      <View style={[styles.quizResultBadge, { borderColor: c.primary, backgroundColor: c.primary + "10" }]}>
        <Text style={[styles.quizResultLevel, { color: c.primary }]}>{level}</Text>
        {levelInfo && <Text style={[styles.quizResultTitle, { color: c.mutedForeground }]}>{levelInfo.title}</Text>}
      </View>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <HapticTouchable
          activeOpacity={0.7}
          onPress={onRetry}
          style={[styles.outlineBtn, { borderColor: c.border }]}
        >
          <Text style={[styles.btnTextOutline, { color: c.foreground }]}>Làm lại</Text>
        </HapticTouchable>
        <HapticTouchable
          activeOpacity={0.8}
          onPress={onContinue}
          style={[styles.primaryBtn, { backgroundColor: c.primary }]}
        >
          <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>Tiếp tục</Text>
          <Ionicons name="chevron-forward" size={18} color={c.primaryForeground} />
        </HapticTouchable>
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();

  const selfAssess = useSelfAssess();
  const startPlacement = useStartPlacement();
  const skipOnboarding = useSkipOnboarding();
  const updateGoal = useUpdateGoal();
  const progressQuery = useProgress();
  const existingGoal = progressQuery.data?.goal ?? null;

  const isMutating =
    selfAssess.isPending || skipOnboarding.isPending || updateGoal.isPending || startPlacement.isPending;

  // ─── State ────────────────────────────────────────────────────────────
  const [step, setStepRaw] = useState<Step>("welcome");
  const [selectedLevel, setSelectedLevel] = useState<QuestionLevel | null>(null);
  const [targetBand, setTargetBand] = useState<VstepBand>("B2");
  const [deadlineMonths, setDeadlineMonths] = useState<number | undefined>(3);
  const [dailyMinutes, setDailyMinutes] = useState<number | undefined>(30);

  // Quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(
    Array(QUIZ_QUESTIONS.length).fill(null),
  );
  const [quizDone, setQuizDone] = useState(false);

  // Skip survey
  const [skipTargetBand, setSkipTargetBand] = useState<VstepBand>("B2");
  const [englishYears, setEnglishYears] = useState("");
  const [previousTest, setPreviousTest] = useState<"ielts" | "toeic" | "vstep" | "other" | "none">("none");
  const [previousScore, setPreviousScore] = useState("");

  // Animations
  const isTransitioning = useRef(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // If user already has a goal, jump to goal step
  useEffect(() => {
    if (existingGoal && step === "welcome") {
      setStepRaw("goal");
    }
  }, [existingGoal, step]);

  // ─── Transition helpers ───────────────────────────────────────────────
  function animateTransition(direction: "forward" | "back", callback: () => void) {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const exitTo = direction === "forward" ? -50 : 50;
    const enterFrom = direction === "forward" ? 50 : -50;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: exitTo, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterFrom);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => { isTransitioning.current = false; });
    });
  }

  function goTo(next: Step, direction: "forward" | "back" = "forward") {
    animateTransition(direction, () => setStepRaw(next));
    const stepOrder: Step[] = ["welcome", "self-assess", "quiz", "goal", "skip"];
    const idx = stepOrder.indexOf(next);
    Animated.timing(progressAnim, {
      toValue: Math.max(0, idx) / (stepOrder.length - 1),
      duration: 300, useNativeDriver: false, easing: Easing.out(Easing.cubic),
    }).start();
  }

  // ─── Handlers ─────────────────────────────────────────────────────────
  function handleSelectLevel(band: QuestionLevel) {
    setSelectedLevel(band);
    goTo("goal");
  }

  const handleQuizAnswer = useCallback(
    (optionIndex: number) => {
      const next = [...quizAnswers];
      next[quizIndex] = optionIndex;
      setQuizAnswers(next);
    },
    [quizAnswers, quizIndex],
  );

  function handleQuizNext() {
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      const level = scoreQuiz(quizAnswers as number[]);
      setSelectedLevel(level);
      setQuizDone(true);
    }
  }

  function resetQuiz() {
    setQuizIndex(0);
    setQuizAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
    setQuizDone(false);
  }

  function handleGoalSubmit() {
    if (isMutating) return;
    const deadline =
      deadlineMonths != null
        ? new Date(Date.now() + deadlineMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    const onSuccess = async () => {
      await progressQuery.refetch();
      router.replace("/(app)/(tabs)");
    };
    const onError = (err: Error) => {
      Alert.alert("Lỗi", err.message || "Không thể lưu mục tiêu");
    };

    if (existingGoal) {
      updateGoal.mutate(
        { id: existingGoal.id, targetBand, deadline, dailyStudyTimeMinutes: dailyMinutes },
        { onSuccess, onError },
      );
    } else {
      selfAssess.mutate(
        {
          listening: selectedLevel ?? "A2",
          reading: selectedLevel ?? "A2",
          writing: selectedLevel ?? "A2",
          speaking: selectedLevel ?? "A2",
          targetBand,
          deadline,
          dailyStudyTimeMinutes: dailyMinutes,
        },
        { onSuccess, onError },
      );
    }
  }

  function handleSkipSubmit() {
    if (isMutating) return;
    const onSuccess = async () => {
      await progressQuery.refetch();
      router.replace("/(app)/(tabs)");
    };
    const onError = (err: Error) => {
      Alert.alert("Lỗi", err.message || "Không thể lưu");
    };
    skipOnboarding.mutate(
      {
        targetBand: skipTargetBand,
        englishYears: englishYears ? Number(englishYears) : undefined,
        previousTest,
        previousScore: previousTest !== "none" && previousScore ? previousScore : undefined,
      },
      { onSuccess, onError },
    );
  }

  function handleStartPlacement() {
    if (isMutating) return;
    startPlacement.mutate(undefined, {
      onSuccess: (data) => {
        router.push({ pathname: "/(app)/practice/[sessionId]", params: { sessionId: data.sessionId } });
      },
      onError: (err: Error) => {
        Alert.alert("Lỗi", err.message || "Không thể bắt đầu bài test");
      },
    });
  }

  // ─── Step content ─────────────────────────────────────────────────────
  function renderStepContent() {
    switch (step) {
      // ─── Welcome: 4 paths ─────────────────────────────────────────────
      case "welcome":
        return (
          <View style={styles.welcomeContainer}>
            <View style={styles.illustrationArea}>
              <View style={[styles.mainCircle, { backgroundColor: c.primary + "15" }]}>
                <Ionicons name="school" size={56} color={c.primary} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingTopLeft, { backgroundColor: c.skillListening + "20" }]}>
                <Ionicons name="headset" size={20} color={c.skillListening} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingTopRight, { backgroundColor: c.skillSpeaking + "20" }]}>
                <Ionicons name="mic" size={20} color={c.skillSpeaking} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingBottomLeft, { backgroundColor: c.skillReading + "20" }]}>
                <Ionicons name="book" size={20} color={c.skillReading} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingBottomRight, { backgroundColor: c.skillWriting + "20" }]}>
                <Ionicons name="create" size={20} color={c.skillWriting} />
              </View>
            </View>
            <Text style={[styles.welcomeTitle, { color: c.foreground }]}>
              Chào mừng bạn đến VSTEP
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: c.mutedForeground }]}>
              Hãy cho chúng tôi biết trình độ của bạn để cá nhân hoá lộ trình học
            </Text>
            <View style={{ gap: spacing.md, width: "100%" }}>
              <OptionCard
                icon="person-outline"
                title="Tự xác định trình độ"
                subtitle="Chọn mức A2 – C1 mà bạn cảm thấy phù hợp nhất"
                selected={false}
                onPress={() => goTo("self-assess")}
              />
              <OptionCard
                icon="help-circle-outline"
                title="Làm bài kiểm tra"
                subtitle="10 câu trắc nghiệm · khoảng 3 phút"
                selected={false}
                onPress={() => goTo("quiz")}
              />
              <OptionCard
                icon="clipboard-outline"
                title="Làm bài test đánh giá thật"
                subtitle="Bài test Listening & Reading · khoảng 60 phút"
                selected={false}
                onPress={handleStartPlacement}
              />
            </View>
            <HapticTouchable onPress={() => goTo("skip")}>
              <Text style={[styles.skipLink, { color: c.mutedForeground }]}>
                Bỏ qua, tôi muốn vào học luôn →
              </Text>
            </HapticTouchable>
          </View>
        );

      // ─── Self-assess: level selection ─────────────────────────────────
      case "self-assess":
        return (
          <>
            <StepHeader title="Trình độ hiện tại của bạn" subtitle="Chọn mức phù hợp nhất với khả năng hiện tại" />
            <View style={styles.optionList}>
              {LEVELS.map((level) => (
                <OptionCard
                  key={level.band}
                  icon="school-outline"
                  title={level.title}
                  subtitle={level.desc}
                  selected={false}
                  onPress={() => handleSelectLevel(level.band)}
                />
              ))}
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <HapticTouchable
                activeOpacity={0.7}
                onPress={() => goTo("welcome", "back")}
                style={[styles.outlineBtn, { borderColor: c.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={c.foreground} />
                <Text style={[styles.btnTextOutline, { color: c.foreground }]}>Quay lại</Text>
              </HapticTouchable>
            </View>
          </>
        );

      // ─── Quiz: 10 MCQ ────────────────────────────────────────────────
      case "quiz":
        if (quizDone) {
          return (
            <QuizResult
              level={selectedLevel ?? "A2"}
              onRetry={resetQuiz}
              onContinue={() => goTo("goal")}
            />
          );
        }
        return (
          <QuizView
            question={QUIZ_QUESTIONS[quizIndex]}
            index={quizIndex}
            total={QUIZ_QUESTIONS.length}
            selected={quizAnswers[quizIndex]}
            onSelect={handleQuizAnswer}
            onNext={handleQuizNext}
            onBack={() => {
              resetQuiz();
              goTo("welcome", "back");
            }}
          />
        );

      // ─── Goal: target band + deadline + daily time ────────────────────
      case "goal":
        return (
          <>
            <StepHeader title="Mục tiêu của bạn" subtitle="Thiết lập mục tiêu để lộ trình học phù hợp hơn" />
            <View style={[styles.goalCard, { borderColor: c.border, backgroundColor: c.card }]}>
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.goalLabel, { color: c.foreground }]}>Band mục tiêu</Text>
                <View style={styles.chipRow}>
                  {TARGET_BANDS.map((b) => (
                    <ToggleChip key={b} label={b} active={targetBand === b} onPress={() => setTargetBand(b)} />
                  ))}
                </View>
              </View>
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.goalLabel, { color: c.foreground }]}>Thời hạn</Text>
                <View style={styles.chipRow}>
                  {DEADLINES.map((d) => (
                    <ToggleChip
                      key={d.label}
                      label={d.label}
                      active={deadlineMonths === d.months}
                      onPress={() => setDeadlineMonths(d.months)}
                    />
                  ))}
                </View>
              </View>
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.goalLabel, { color: c.foreground }]}>Thời gian học mỗi ngày</Text>
                <View style={styles.chipRow}>
                  {DAILY_TIMES.map((t) => (
                    <ToggleChip
                      key={t.label}
                      label={t.label}
                      active={dailyMinutes === t.minutes}
                      onPress={() => setDailyMinutes(t.minutes)}
                    />
                  ))}
                </View>
              </View>
            </View>
            <View style={[styles.btnRow, { marginTop: spacing.lg }]}>
              {!existingGoal && (
                <HapticTouchable
                  activeOpacity={0.7}
                  onPress={() => goTo(selectedLevel && quizDone ? "quiz" : "self-assess", "back")}
                  style={[styles.outlineBtn, { borderColor: c.border }]}
                >
                  <Ionicons name="chevron-back" size={18} color={c.foreground} />
                  <Text style={[styles.btnTextOutline, { color: c.foreground }]}>Quay lại</Text>
                </HapticTouchable>
              )}
              <HapticTouchable
                activeOpacity={0.8}
                onPress={handleGoalSubmit}
                disabled={isMutating}
                style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: isMutating ? 0.7 : 1 }]}
              >
                {isMutating ? (
                  <ActivityIndicator size="small" color={c.primaryForeground} />
                ) : (
                  <>
                    <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>
                      Bắt đầu luyện tập
                    </Text>
                    <Ionicons name="checkmark" size={18} color={c.primaryForeground} />
                  </>
                )}
              </HapticTouchable>
            </View>
          </>
        );

      // ─── Skip: quick survey ───────────────────────────────────────────
      case "skip":
        return (
          <>
            <StepHeader title="Thông tin nhanh" subtitle="Giúp chúng tôi cá nhân hoá lộ trình dù bạn bỏ qua đánh giá" />
            <View style={[styles.goalCard, { borderColor: c.border, backgroundColor: c.card }]}>
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.goalLabel, { color: c.foreground }]}>Band mục tiêu</Text>
                <View style={styles.chipRow}>
                  {TARGET_BANDS.map((b) => (
                    <ToggleChip key={b} label={b} active={skipTargetBand === b} onPress={() => setSkipTargetBand(b)} />
                  ))}
                </View>
              </View>
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.goalLabel, { color: c.foreground }]}>Số năm học tiếng Anh (tuỳ chọn)</Text>
                <TextInput
                  value={englishYears}
                  onChangeText={setEnglishYears}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 5"
                  placeholderTextColor={c.mutedForeground}
                  style={[styles.textInput, { borderColor: c.border, backgroundColor: c.background, color: c.foreground }]}
                />
              </View>
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.goalLabel, { color: c.foreground }]}>Bạn đã thi bài test nào chưa?</Text>
                <View style={styles.chipRow}>
                  {PREVIOUS_TESTS.map((t) => (
                    <ToggleChip
                      key={t.value}
                      label={t.label}
                      active={previousTest === t.value}
                      onPress={() => setPreviousTest(t.value)}
                    />
                  ))}
                </View>
              </View>
              {previousTest !== "none" && (
                <View style={{ gap: spacing.xs }}>
                  <Text style={[styles.goalLabel, { color: c.foreground }]}>Điểm đạt được (tuỳ chọn)</Text>
                  <TextInput
                    value={previousScore}
                    onChangeText={setPreviousScore}
                    placeholder="Ví dụ: 6.5"
                    placeholderTextColor={c.mutedForeground}
                    style={[styles.textInput, { borderColor: c.border, backgroundColor: c.background, color: c.foreground }]}
                  />
                </View>
              )}
            </View>
            <View style={[styles.btnRow, { marginTop: spacing.lg }]}>
              <HapticTouchable
                activeOpacity={0.7}
                onPress={() => goTo("welcome", "back")}
                style={[styles.outlineBtn, { borderColor: c.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={c.foreground} />
                <Text style={[styles.btnTextOutline, { color: c.foreground }]}>Quay lại</Text>
              </HapticTouchable>
              <HapticTouchable
                activeOpacity={0.8}
                onPress={handleSkipSubmit}
                disabled={isMutating}
                style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: isMutating ? 0.7 : 1 }]}
              >
                {isMutating ? (
                  <ActivityIndicator size="small" color={c.primaryForeground} />
                ) : (
                  <>
                    <Text style={[styles.btnTextPrimary, { color: c.primaryForeground }]}>
                      Bắt đầu luyện tập
                    </Text>
                    <Ionicons name="checkmark" size={18} color={c.primaryForeground} />
                  </>
                )}
              </HapticTouchable>
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
      <HapticTouchable
        style={styles.logoutBtn}
        onPress={() => { signOut(); router.replace("/(auth)/login"); }}
      >
        <Ionicons name="log-out-outline" size={20} color={c.mutedForeground} />
      </HapticTouchable>

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

      <BouncyScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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
      </BouncyScrollView>
    </View>
  );
}

// ─── Step header ──────────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.stepHeader}>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  logoutBtn: {
    position: "absolute",
    top: 8,
    right: 16,
    zIndex: 20,
    padding: spacing.sm,
  },

  // Progress bar
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: 3, borderRadius: 2 },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
  },

  // Welcome
  welcomeContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
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
  floatingTopLeft: { top: 10, left: 10 },
  floatingTopRight: { top: 10, right: 10 },
  floatingBottomLeft: { bottom: 10, left: 10 },
  floatingBottomRight: { bottom: 10, right: 10 },
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
  skipLink: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },

  // Step header
  stepHeader: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
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
  optionList: { gap: spacing.md },
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
  optionText: { flex: 1 },
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

  // Band cards
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

  // Toggle chips
  toggleChip: {
    borderWidth: 1.5,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  toggleChipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  // Goal / Skip card
  goalCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.lg,
  },
  goalLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },

  // Text input
  textInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
  },

  // Quiz
  quizBackBtn: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  quizCounter: {
    fontSize: fontSize.sm,
  },
  quizProgressTrack: {
    height: 6,
    borderRadius: 3,
    width: "100%",
  },
  quizProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  quizStemCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  quizStem: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    lineHeight: 28,
  },
  quizOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  quizLetter: {
    width: 28,
    height: 28,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  quizLetterText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  quizOptionText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    flex: 1,
  },
  quizNextBtn: {
    flexDirection: "row",
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  quizResultBadge: {
    borderWidth: 2,
    borderRadius: radius.xl,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  quizResultLevel: {
    fontSize: 40,
    fontWeight: "800",
  },
  quizResultTitle: {
    fontSize: fontSize.sm,
  },

  // Buttons
  btnRow: {
    flexDirection: "row",
    gap: spacing.md,
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
