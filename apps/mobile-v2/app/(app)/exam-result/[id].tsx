import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { GradingErrorState, GradingLoadingState } from "@/components/GradingStates";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useExamSessionResults } from "@/hooks/use-exam-results";
import { useStreak } from "@/hooks/use-progress";
import type { Skill } from "@/types/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type ResultData = NonNullable<ReturnType<typeof useExamSessionResults>["data"]>;
type McqDetailItem = ResultData["mcqDetail"][number];
type WritingFeedbackItem = ResultData["writingFeedback"][number];
type SpeakingFeedbackItem = ResultData["speakingFeedback"][number];
type FilterId = "all" | "wrong" | "unanswered";
type ProductiveItem = {
  id: string;
  label: string;
  score: number | null;
  status: string;
};

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_LABEL: Record<Skill, string> = {
  listening: "Nghe",
  reading: "Đọc",
  writing: "Viết",
  speaking: "Nói",
};
const SKILL_ICON: Record<Skill, keyof typeof Ionicons.glyphMap> = {
  listening: "volume-high",
  reading: "book",
  writing: "create",
  speaking: "mic",
};
const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "wrong", label: "Sai" },
  { id: "unanswered", label: "Chưa làm" },
];
const WRITING_LABEL: Record<string, string> = {
  taskFulfillment: "Task Fulfillment",
  task_fulfillment: "Task Fulfillment",
  organization: "Organization",
  vocabulary: "Vocabulary",
  lexical: "Vocabulary",
  grammar: "Grammar",
  coherence: "Coherence",
};
const SPEAKING_LABEL: Record<string, string> = {
  fluency: "Fluency",
  pronunciation: "Pronunciation",
  discourseManagement: "Discourse Management",
  discourse_management: "Discourse Management",
  vocabulary: "Vocabulary",
  vocab: "Vocabulary",
  grammar: "Grammar",
  content: "Content",
};

export default function ExamResultScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: sessionId, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const { data, isLoading, isError, isFetching, refetch } = useExamSessionResults(sessionId ?? "");
  const { data: streakData } = useStreak();
  const [activeSkill, setActiveSkill] = useState<Skill>("listening");

  const skills = useMemo(() => (data ? reviewSkills(data) : []), [data]);

  useEffect(() => {
    if (!data || skills.length === 0) return;
    if (!skills.some((skill) => skill.key === activeSkill)) setActiveSkill(defaultSkill(data, skills));
  }, [activeSkill, data, skills]);

  if (!sessionId) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <MascotEmpty mascot="think" title="Không tìm thấy phiên thi" subtitle="" />
        <DepthButton fullWidth onPress={() => router.replace("/(app)/(tabs)/exams")} style={{ marginTop: spacing.xl }}>
          Về danh sách đề thi
        </DepthButton>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <GradingLoadingState label="Đang tải kết quả bài thi..." accentColor={c.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <GradingErrorState
          title="Không thể tải kết quả"
          subtitle="Kết nối chưa ổn hoặc kết quả chưa sẵn sàng. Thử lại ngay hoặc quay về danh sách đề."
          onRetry={() => void refetch()}
          onBack={() => router.replace("/(app)/(tabs)/exams")}
          retrying={isFetching}
        />
      </View>
    );
  }

  const active = skills.find((skill) => skill.key === activeSkill) ?? skills[0];

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight, backgroundColor: c.surface }]}>
        <HapticTouchable onPress={() => router.replace("/(app)/(tabs)/exams")} style={[s.backButton, { backgroundColor: c.surfaceTint, borderColor: c.border }]}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: c.subtle }]}>KẾT QUẢ THI THỬ</Text>
          <Text style={[s.headerTitle, { color: c.foreground }]} numberOfLines={2}>{data.exam?.title ?? "Bài thi thử"}</Text>
          <Text style={[s.headerMeta, { color: c.mutedForeground }]}>{modeLabel(data)}</Text>
        </View>
        <StatusPill status={data.summary.scoreStatus} />
      </View>

      {celebrate === "streak" ? <StreakCelebration streak={streakData?.current ?? null} /> : null}

      <ScrollView
        style={s.root}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing["3xl"] }]}
        showsVerticalScrollIndicator={false}
      >
        <SummaryBanner data={data} />
        <SkillSelector skills={skills} activeSkill={active?.key ?? activeSkill} onSelect={setActiveSkill} data={data} />
        <View style={[s.detailCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {active?.key === "listening" || active?.key === "reading" ? (
            <McqReviewPanel data={data} skill={active.key} />
          ) : active?.key === "writing" ? (
            <WritingReviewPanel data={data} />
          ) : active?.key === "speaking" ? (
            <SpeakingReviewPanel data={data} />
          ) : (
            <EmptyBlock text="Chưa có dữ liệu kỹ năng này." />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StreakCelebration({ streak }: { streak: number | null }) {
  const c = useThemeColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const lift = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 95, useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [lift, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.celebration,
        {
          opacity,
          transform: [{ translateY: lift }, { scale }],
          backgroundColor: c.streak + "18",
          borderColor: c.streak,
        },
      ]}
    >
      <View style={[s.fireHalo, { backgroundColor: c.streak + "22" }]}>
        <GameIcon name="fire" size={38} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.celebrationTitle, { color: c.foreground }]}>Streak đã được giữ hôm nay</Text>
        <Text style={[s.celebrationSub, { color: c.mutedForeground }]}>Hoàn thành bài thi được tính vào chuỗi học tập.</Text>
      </View>
      <Text style={[s.celebrationCount, { color: c.streak }]}>{streak == null ? "" : `${streak}`}</Text>
    </Animated.View>
  );
}

function SummaryBanner({ data }: { data: ResultData }) {
  const c = useThemeColors();
  const summary = data.summary;
  const band = summary.overall.band;
  const hasBand = band != null;
  const bandValue = band != null ? scoreText(band) : summary.display.bandValue;
  const totalScore = summary.overall.scoreOn10 == null ? summary.display.totalScoreValue : `${scoreText(summary.overall.scoreOn10)}/10`;
  const outcomeLabel = summary.overall.resultLabel ?? summary.overall.vstepLevel ?? summary.overall.cefrLevel ?? statusLabel(summary.scoreStatus);
  const processing = summary.scoreStatus === "pending" || summary.scoreStatus === "partial" || summary.hasPendingJobs;

  return (
    <View style={[s.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.summaryHead}>
        <View>
          <Text style={[s.eyebrow, { color: c.subtle }]}>TỔNG QUAN</Text>
          <Text style={[s.summaryOutcome, { color: c.foreground }]}>{outcomeLabel}</Text>
        </View>
        <StatusPill status={summary.scoreStatus} />
      </View>

      <View style={[s.bandBox, { backgroundColor: c.primaryTint, borderColor: c.primaryLight }]}>
        <Text style={[s.bandLabel, { color: c.primaryDark }]}>BAND HIỆN TẠI</Text>
        <View style={s.bandRow}>
          <Text style={[s.bandValue, { color: c.foreground }]}>{bandValue}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.bandTitle, { color: c.foreground }]}>{summary.display.bandTitle}</Text>
            <Text style={[s.bandSub, { color: c.mutedForeground }]}>{summary.display.totalScoreTitle}</Text>
          </View>
        </View>
      </View>

      <View style={s.metricGrid}>
        <MetricPill label="Điểm tổng" value={totalScore} tone={hasBand ? "success" : "muted"} />
        <MetricPill label="Nghe + Đọc" value={summary.mcq.total > 0 ? `${summary.mcq.correct}/${summary.mcq.total}` : "—"} tone={summary.mcq.wrong > 0 || summary.mcq.unanswered > 0 ? "warning" : "success"} />
      </View>

      {processing ? (
        <View style={[s.notice, { backgroundColor: c.warningTint, borderColor: c.warning }]}>
          <ActivityIndicator color={c.warning} size="small" />
          <Text style={[s.noticeText, { color: c.foreground }]}>
            {summary.display.pendingBadgeLabel ?? "Writing/Speaking đang được chấm, kết quả sẽ tự cập nhật khi hoàn tất."}
          </Text>
        </View>
      ) : !hasBand && summary.overall.reason ? (
        <View style={[s.notice, { backgroundColor: c.surfaceTint, borderColor: c.border }]}>
          <Ionicons name="information-circle" size={18} color={c.subtle} />
          <Text style={[s.noticeText, { color: c.mutedForeground }]}>{summary.overall.reason}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SkillSelector({
  skills,
  activeSkill,
  onSelect,
  data,
}: {
  skills: ReviewSkill[];
  activeSkill: Skill;
  onSelect: (skill: Skill) => void;
  data: ResultData;
}) {
  const c = useThemeColors();
  return (
    <View style={[s.skillCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.skillHead}>
        <View>
          <Text style={[s.eyebrow, { color: c.subtle }]}>KỸ NĂNG</Text>
          <Text style={[s.skillHint, { color: c.foreground }]}>Chọn phần cần xem chi tiết</Text>
        </View>
        <Text style={[s.countPill, { backgroundColor: c.surfaceTint, borderColor: c.border, color: c.mutedForeground }]}>{skills.length}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.skillRail}>
        {skills.map((skill) => (
          <SkillChip
            key={skill.key}
            skill={skill}
            active={activeSkill === skill.key}
            score={data.scores?.[skill.key] ?? null}
            onPress={() => onSelect(skill.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SkillChip({ skill, active, score, onPress }: { skill: ReviewSkill; active: boolean; score: number | null; onPress: () => void }) {
  const c = useThemeColors();
  const color = skillColor(c, skill.key);
  const hasScore = score != null;
  return (
    <HapticTouchable
      onPress={onPress}
      style={[
        s.skillChip,
        {
          backgroundColor: active ? `${color}18` : c.surfaceTint,
          borderColor: active ? color : c.border,
        },
      ]}
    >
      <View style={[s.skillIcon, { borderColor: color, backgroundColor: c.surface }]}>
        <Ionicons name={SKILL_ICON[skill.key]} size={18} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.skillName, { color: c.foreground }]}>{skill.label}</Text>
        <Text style={[s.skillMeta, { color: c.mutedForeground }]} numberOfLines={1}>{hasScore ? `${scoreText(score)}/10` : skill.statusLabel}</Text>
      </View>
      {skill.issueCount > 0 ? (
        <Text style={[s.issuePill, { backgroundColor: c.warning, color: c.surface }]}>{skill.issueCount}</Text>
      ) : null}
    </HapticTouchable>
  );
}

function McqReviewPanel({ data, skill }: { data: ResultData; skill: "listening" | "reading" }) {
  const c = useThemeColors();
  const groups = useMemo(() => mcqGroups(data, skill), [data, skill]);
  const [activeId, setActiveId] = useState(groups[0]?.id ?? "");
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    if (!groups.some((group) => group.id === activeId)) setActiveId(groups[0]?.id ?? "");
  }, [activeId, groups]);

  const active = groups.find((group) => group.id === activeId) ?? groups[0];
  if (!active) return <EmptyBlock text="Phần này chưa có câu trắc nghiệm." />;

  const wrongCount = active.items.filter((item) => item.status === "wrong").length;
  const unansweredCount = active.items.filter((item) => item.status === "unanswered").length;
  const visibleItems = active.items.filter((item) => filter === "all" || item.status === filter);

  return (
    <View>
      <View style={s.panelHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.panelOverline, { color: c.mutedForeground }]}>Review trắc nghiệm</Text>
          <Text style={[s.panelTitle, { color: c.foreground }]}>{SKILL_LABEL[skill]} · {active.label}</Text>
        </View>
        <Text style={[s.scoreBadge, { backgroundColor: c.surfaceTint, borderColor: c.border, color: c.foreground }]}>{active.correct}/{active.total} đúng</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRail}>
        {groups.map((group) => (
          <HapticTouchable
            key={group.id}
            onPress={() => {
              setActiveId(group.id);
              setFilter("all");
            }}
            style={[s.partTab, { borderColor: group.id === active.id ? c.primary : c.border, backgroundColor: group.id === active.id ? c.primaryTint : c.surface }]}
          >
            <Text style={[s.partTabText, { color: group.id === active.id ? c.primaryDark : c.mutedForeground }]}>{group.label} ({group.correct}/{group.total})</Text>
          </HapticTouchable>
        ))}
      </ScrollView>

      <View style={s.filterRow}>
        {FILTERS.map((item) => {
          const count = item.id === "all" ? active.total : item.id === "wrong" ? wrongCount : unansweredCount;
          return (
            <HapticTouchable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[s.filterChip, { borderColor: filter === item.id ? c.primary : c.border, backgroundColor: filter === item.id ? c.primaryTint : c.surface }]}
            >
              <Text style={[s.filterText, { color: filter === item.id ? c.primaryDark : c.mutedForeground }]}>{item.label} ({count})</Text>
            </HapticTouchable>
          );
        })}
      </View>

      {active.contextBody ? (
        <View style={[s.contextBox, { backgroundColor: c.surfaceTint, borderColor: c.borderLight }]}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>{skill === "listening" ? "TRANSCRIPT" : "BÀI ĐỌC"}</Text>
          {active.contextLabel ? <Text style={[s.contextTitle, { color: c.foreground }]}>{active.contextLabel}</Text> : null}
          <Text style={[s.contextText, { color: c.foreground }]}>{active.contextBody}</Text>
        </View>
      ) : null}

      <View style={{ gap: spacing.md }}>
        {visibleItems.length > 0 ? visibleItems.map((item) => <QuestionCard key={item.id} item={item} />) : <EmptyBlock text="Không có câu nào trong bộ lọc này." />}
      </View>
    </View>
  );
}

function QuestionCard({ item }: { item: McqReviewItem }) {
  const c = useThemeColors();
  return (
    <View style={[s.questionCard, { borderColor: c.borderLight, backgroundColor: c.surface }]}>
      <View style={s.questionTop}>
        <Text style={[s.questionNo, { color: c.foreground }]}>Câu {item.no}</Text>
        <AnswerStatusBadge status={item.status} label={item.statusLabel} />
        {item.selectedLabel ? <Text style={[s.selectedText, { color: c.mutedForeground }]}>Bạn chọn: {item.selectedLabel}</Text> : null}
      </View>
      <Text style={[s.questionStem, { color: c.foreground }]}>{item.stem}</Text>
      <View style={{ gap: spacing.sm }}>
        {OPTION_LABELS.map((letter, index) => (
          <OptionRow
            key={letter}
            letter={letter}
            text={item.options[index] ?? "—"}
            isCorrect={item.correctLabel === letter}
            isSelected={item.selectedLabel === letter}
          />
        ))}
      </View>
    </View>
  );
}

function OptionRow({ letter, text, isCorrect, isSelected }: { letter: string; text: string; isCorrect: boolean; isSelected: boolean }) {
  const c = useThemeColors();
  const wrongPick = isSelected && !isCorrect;
  const borderColor = isCorrect ? c.primary : wrongPick ? c.destructive : c.borderLight;
  const bg = isCorrect ? c.primaryTint : wrongPick ? c.destructiveTint : c.surfaceTint;
  const markerBg = isCorrect ? c.primary : wrongPick ? c.destructive : c.surface;
  const markerText = isCorrect || wrongPick ? c.surface : c.mutedForeground;
  return (
    <View style={[s.optionRow, { backgroundColor: bg, borderLeftColor: borderColor }]}>
      <Text style={[s.optionMarker, { backgroundColor: markerBg, borderColor, color: markerText }]}>{letter}</Text>
      <Text style={[s.optionText, { color: c.foreground }]}>{text}</Text>
    </View>
  );
}

function WritingReviewPanel({ data }: { data: ResultData }) {
  const tasks = useMemo(() => [...(data.version?.writingTasks ?? [])].sort((a, b) => a.part - b.part || a.displayOrder - b.displayOrder), [data.version?.writingTasks]);
  const fallbackItems = data.writingFeedback.map((feedback, index) => ({ id: feedback.taskId, label: `Task ${index + 1}`, score: feedback.overallBand, status: feedback.scoreStatus }));
  const items: ProductiveItem[] = tasks.length > 0
    ? tasks.map((task) => {
      const feedback = data.writingFeedback.find((item) => item.taskId === task.id);
      return { id: task.id, label: `Task ${task.part}`, score: feedback?.overallBand ?? null, status: feedback?.scoreStatus ?? "not_submitted" };
    })
    : fallbackItems;
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.some((item) => item.id === activeId)) setActiveId(items[0]?.id ?? "");
  }, [activeId, items]);

  if (items.length === 0) return <EmptyBlock text="Không có phần Writing." />;

  const active = items.find((item) => item.id === activeId) ?? items[0];
  const task = tasks.find((item) => item.id === active.id) ?? null;
  const feedback = data.writingFeedback.find((item) => item.taskId === active.id) ?? null;

  return (
    <ProductiveLayout title="Writing" items={items} activeId={active.id} onSelect={setActiveId} tone="writing">
      <ProductiveHeader title={task ? `Writing Task ${task.part}` : active.label} score={feedback?.overallBand ?? null} status={feedback?.scoreStatus ?? active.status} meta={feedback ? `${feedback.wordCount} từ` : undefined} tone="writing" />
      {task?.prompt ? <DetailSection title="Đề bài"><Text style={s.detailText}>{task.prompt}</Text></DetailSection> : null}
      {feedback?.text ? <DetailSection title="Bài làm"><Text style={s.detailText}>{feedback.text}</Text></DetailSection> : null}
      <RubricSection scores={feedback?.criterionScores ?? null} labels={WRITING_LABEL} tone="writing" />
      <FeedbackBlock feedback={feedback?.feedback ?? null} />
      <PendingBlock status={feedback?.scoreStatus ?? active.status} />
    </ProductiveLayout>
  );
}

function SpeakingReviewPanel({ data }: { data: ResultData }) {
  const parts = useMemo(() => [...(data.version?.speakingParts ?? [])].sort((a, b) => a.part - b.part || a.displayOrder - b.displayOrder), [data.version?.speakingParts]);
  const fallbackItems = data.speakingFeedback.map((feedback, index) => ({ id: feedback.partId, label: `Part ${index + 1}`, score: feedback.overallBand, status: feedback.scoreStatus }));
  const items: ProductiveItem[] = parts.length > 0
    ? parts.map((part) => {
      const feedback = data.speakingFeedback.find((item) => item.partId === part.id);
      return { id: part.id, label: `Part ${part.part}`, score: feedback?.overallBand ?? null, status: feedback?.scoreStatus ?? "not_submitted" };
    })
    : fallbackItems;
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.some((item) => item.id === activeId)) setActiveId(items[0]?.id ?? "");
  }, [activeId, items]);

  if (items.length === 0) return <EmptyBlock text="Không có phần Speaking." />;

  const active = items.find((item) => item.id === activeId) ?? items[0];
  const part = parts.find((item) => item.id === active.id) ?? null;
  const feedback = data.speakingFeedback.find((item) => item.partId === active.id) ?? null;

  return (
    <ProductiveLayout title="Speaking" items={items} activeId={active.id} onSelect={setActiveId} tone="speaking">
      <ProductiveHeader title={part ? `Speaking Part ${part.part}` : active.label} score={feedback?.overallBand ?? null} status={feedback?.scoreStatus ?? active.status} tone="speaking" />
      {part ? <DetailSection title="Đề nói"><Text style={s.detailText}>{speakingPromptText(part.content)}</Text></DetailSection> : null}
      {feedback?.audioUrl ? <DetailSection title="Bài nói"><AudioPlayback uri={feedback.audioUrl} /></DetailSection> : null}
      {feedback?.transcript ? <DetailSection title="Transcript"><Text style={s.detailText}>{feedback.transcript}</Text></DetailSection> : null}
      <RubricSection scores={feedback?.criterionScores ?? null} labels={SPEAKING_LABEL} tone="speaking" />
      <FeedbackBlock feedback={feedback?.feedback ?? null} />
      <PendingBlock status={feedback?.scoreStatus ?? active.status} />
    </ProductiveLayout>
  );
}

function ProductiveLayout({
  title,
  items,
  activeId,
  onSelect,
  tone,
  children,
}: {
  title: string;
  items: ProductiveItem[];
  activeId: string;
  onSelect: (id: string) => void;
  tone: "writing" | "speaking";
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  const color = toneColor(c, tone);
  return (
    <View>
      <View style={s.panelHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.panelOverline, { color: c.mutedForeground }]}>Chi tiết</Text>
          <Text style={[s.panelTitle, { color: c.foreground }]}>{title}</Text>
        </View>
        <Text style={[s.scoreBadge, { backgroundColor: c.surfaceTint, borderColor: c.border, color: c.foreground }]}>{items.length} phần</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRail}>
        {items.map((item) => (
          <HapticTouchable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[s.productiveTab, { borderColor: item.id === activeId ? color : c.border, backgroundColor: item.id === activeId ? `${color}18` : c.surface }]}
          >
            <Text style={[s.productiveTabLabel, { color: c.foreground }]}>{item.label}</Text>
            <Text style={[s.productiveTabScore, { color }]}>{item.score == null ? statusLabel(item.status) : `${scoreText(item.score)}/10`}</Text>
          </HapticTouchable>
        ))}
      </ScrollView>
      <View style={s.productiveBody}>{children}</View>
    </View>
  );
}

function ProductiveHeader({ title, score, status, meta, tone }: { title: string; score: number | null; status: string; meta?: string; tone: "writing" | "speaking" }) {
  const c = useThemeColors();
  const color = toneColor(c, tone);
  return (
    <View style={[s.productiveHeader, { borderColor: c.borderLight }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.productiveTitle, { color: c.foreground }]}>{title}</Text>
        <Text style={[s.productiveMeta, { color: c.mutedForeground }]}>{meta ? `${meta} · ${statusLabel(status)}` : statusLabel(status)}</Text>
      </View>
      <Text style={[s.productiveScore, { color: score == null ? c.subtle : color }]}>{score == null ? "—" : `${scoreText(score)}/10`}</Text>
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View style={[s.detailSection, { borderColor: c.borderLight }]}>
      <Text style={[s.sectionLabel, { color: c.subtle }]}>{title.toUpperCase()}</Text>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>
  );
}

function RubricSection({ scores, labels, tone }: { scores: ResultData["writingFeedback"][number]["criterionScores"]; labels: Record<string, string>; tone: "writing" | "speaking" }) {
  const c = useThemeColors();
  const color = toneColor(c, tone);
  if (!scores || scores.length === 0) return null;
  return (
    <DetailSection title="Điểm theo tiêu chí">
      <View style={{ gap: spacing.md }}>
        {scores.map((criterion) => (
          <RubricRow key={criterion.key} label={labels[criterion.key] ?? criterion.key} score={criterion.score} color={color} />
        ))}
      </View>
    </DetailSection>
  );
}

function RubricRow({ label, score, color }: { label: string; score: number; color: string }) {
  const c = useThemeColors();
  const pct = Math.max(0, Math.min(100, score * 10));
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={s.rubricTop}>
        <Text style={[s.rubricLabel, { color: c.foreground }]}>{label}</Text>
        <Text style={[s.rubricScore, { color }]}>{scoreText(score)}/10</Text>
      </View>
      <View style={[s.rubricTrack, { backgroundColor: c.muted }]}>
        <View style={[s.rubricFill, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function FeedbackBlock({ feedback }: { feedback: WritingFeedbackItem["feedback"] | SpeakingFeedbackItem["feedback"] }) {
  if (!feedback) return null;
  const strengths = normalizeTextItems(feedback.strengths);
  const improvements = normalizeImprovementItems((feedback.improvements && feedback.improvements.length > 0) ? feedback.improvements : feedback.evidenceNotes);
  const rewrites = normalizeRewriteItems(feedback.rewrites);
  if (strengths.length === 0 && improvements.length === 0 && rewrites.length === 0) return null;

  return (
    <DetailSection title="Nhận xét AI">
      <View style={{ gap: spacing.lg }}>
        {strengths.length > 0 ? <FeedbackList title="Điểm mạnh" tone="success" items={strengths.map((message) => ({ message, explanation: "" }))} /> : null}
        {improvements.length > 0 ? <FeedbackList title="Cần cải thiện" tone="warning" items={improvements} /> : null}
        {rewrites.length > 0 ? <RewriteList rewrites={rewrites} /> : null}
      </View>
    </DetailSection>
  );
}

function FeedbackList({ title, tone, items }: { title: string; tone: "success" | "warning"; items: { message: string; explanation: string }[] }) {
  const c = useThemeColors();
  const color = tone === "success" ? c.primary : c.warning;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[s.feedbackTitle, { color }]}>{title.toUpperCase()}</Text>
      {items.map((item) => (
        <View key={`${item.message}-${item.explanation}`} style={s.feedbackRow}>
          <Text style={[s.bullet, { color }]}>•</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.feedbackMessage, { color: c.foreground }]}>{item.message}</Text>
            {item.explanation ? <Text style={[s.feedbackExplanation, { color: c.mutedForeground }]}>{item.explanation}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function RewriteList({ rewrites }: { rewrites: { original: string; improved: string; reason: string }[] }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[s.feedbackTitle, { color: c.info }]}>GỢI Ý VIẾT LẠI</Text>
      {rewrites.map((item) => (
        <View key={`${item.original}-${item.improved}`} style={[s.rewriteBox, { borderColor: c.borderLight, backgroundColor: c.surfaceTint }]}>
          {item.original ? <Text style={[s.rewriteText, { color: c.destructive }]}>Gốc: {item.original}</Text> : null}
          {item.improved ? <Text style={[s.rewriteText, { color: c.foreground }]}>Cải thiện: {item.improved}</Text> : null}
          {item.reason ? <Text style={[s.feedbackExplanation, { color: c.subtle }]}>{item.reason}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function PendingBlock({ status }: { status: string }) {
  const c = useThemeColors();
  if (status === "ready" || status === "completed") return null;
  const processing = status === "pending" || status === "processing" || status === "partial";
  return (
    <DetailSection title="Trạng thái">
      <View style={[s.pendingBox, { backgroundColor: c.warningTint, borderColor: c.warning }]}>
        {processing ? <ActivityIndicator color={c.warning} size="small" /> : <Ionicons name="information-circle" size={18} color={c.warning} />}
        <Text style={[s.noticeText, { color: c.foreground }]}>{statusLabel(status)}</Text>
      </View>
    </DetailSection>
  );
}

function AudioPlayback({ uri }: { uri: string }) {
  const c = useThemeColors();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (soundRef.current) void soundRef.current.unloadAsync();
    };
  }, []);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (playing && soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        });
        soundRef.current = sound;
      }
      await soundRef.current.playAsync();
      setPlaying(true);
    } catch {
      Alert.alert("Không phát được audio", "Bài nói chưa tải được. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HapticTouchable onPress={() => void toggle()} style={[s.audioButton, { backgroundColor: c.coinTint, borderColor: c.coin }]}>
      {loading ? <ActivityIndicator color={c.coinDark} size="small" /> : <Ionicons name={playing ? "pause" : "play"} size={18} color={c.coinDark} />}
      <Text style={[s.audioText, { color: c.foreground }]}>{playing ? "Tạm dừng bài nói" : "Phát bài nói"}</Text>
    </HapticTouchable>
  );
}

function StatusPill({ status }: { status: string }) {
  const c = useThemeColors();
  const color = status === "ready" ? c.success : status === "failed" ? c.destructive : status === "pending" || status === "partial" ? c.warning : c.subtle;
  const bg = status === "ready" ? c.primaryTint : status === "failed" ? c.destructiveTint : status === "pending" || status === "partial" ? c.warningTint : c.surfaceTint;
  return (
    <View style={[s.statusPill, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[s.statusText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "muted" }) {
  const c = useThemeColors();
  const borderColor = tone === "success" ? c.primaryLight : tone === "warning" ? c.warning : c.border;
  const bg = tone === "success" ? `${c.primaryTint}80` : tone === "warning" ? c.warningTint : c.surfaceTint;
  return (
    <View style={[s.metricPill, { backgroundColor: bg, borderColor }]}>
      <Text style={[s.metricLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[s.metricValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

function AnswerStatusBadge({ status, label }: { status: McqReviewItem["status"]; label: string }) {
  const c = useThemeColors();
  const color = status === "correct" ? c.primaryDark : status === "wrong" ? c.destructive : c.subtle;
  const bg = status === "correct" ? c.primaryTint : status === "wrong" ? c.destructiveTint : c.surfaceTint;
  return <Text style={[s.answerBadge, { backgroundColor: bg, borderColor: color, color }]}>{label}</Text>;
}

function EmptyBlock({ text }: { text: string }) {
  const c = useThemeColors();
  return (
    <View style={s.emptyBlock}>
      <Ionicons name="document-text-outline" size={28} color={c.subtle} />
      <Text style={[s.emptyText, { color: c.mutedForeground }]}>{text}</Text>
    </View>
  );
}

interface ReviewSkill {
  key: Skill;
  label: string;
  status: string;
  statusLabel: string;
  issueCount: number;
}

interface McqReviewItem {
  id: string;
  no: number;
  stem: string;
  options: readonly string[];
  status: McqDetailItem["answerStatus"];
  statusLabel: string;
  selectedLabel: string | null;
  correctLabel: string;
}

interface McqReviewGroup {
  id: string;
  label: string;
  contextLabel: string | null;
  contextBody: string | null;
  correct: number;
  total: number;
  items: McqReviewItem[];
}

function reviewSkills(data: ResultData): ReviewSkill[] {
  const fromReview = data.review.skills.map((skill) => ({
    key: skill.key,
    label: skill.label,
    status: skill.status,
    statusLabel: skill.statusLabel,
    issueCount: skill.issueCount,
  }));
  const skills = fromReview.length > 0
    ? fromReview
    : data.session.selectedSkills.map((key) => ({
      key,
      label: SKILL_LABEL[key],
      status: data.scores?.[key] == null ? "not_submitted" : "ready",
      statusLabel: data.scores?.[key] == null ? "Chưa có điểm" : "Đã chấm",
      issueCount: 0,
    }));
  return skills.sort((a, b) => SKILL_ORDER.indexOf(a.key) - SKILL_ORDER.indexOf(b.key));
}

function defaultSkill(data: ResultData, skills: ReviewSkill[]): Skill {
  const withIssues = skills.find((skill) => skill.issueCount > 0);
  if (withIssues) return withIssues.key;
  const withScore = skills.find((skill) => data.scores?.[skill.key] != null);
  return withScore?.key ?? skills[0]?.key ?? "listening";
}

function mcqGroups(data: ResultData, skill: "listening" | "reading"): McqReviewGroup[] {
  if (!data.version) return [];
  const detail = new Map(data.mcqDetail.map((item) => [`${item.itemRefType}:${item.itemRefId}`, item]));
  if (skill === "reading") {
    return [...data.version.readingPassages]
      .sort((a, b) => a.part - b.part || a.displayOrder - b.displayOrder)
      .map((passage) => buildMcqGroup(
        `reading-${passage.part}`,
        `Part ${passage.part}`,
        passage.title,
        passage.passage,
        [...passage.items].sort((a, b) => a.displayOrder - b.displayOrder),
        "exam_reading_item",
        detail,
      ));
  }

  const byPart = new Map<number, NonNullable<ResultData["version"]>["listeningSections"]>();
  for (const section of data.version.listeningSections) {
    const list = byPart.get(section.part) ?? [];
    list.push(section);
    byPart.set(section.part, list);
  }
  return [...byPart.entries()].sort(([a], [b]) => a - b).map(([part, sections]) => {
    const sorted = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
    const items = sorted.flatMap((section) => [...section.items].sort((a, b) => a.displayOrder - b.displayOrder));
    const transcript = sorted.map((section) => section.transcript).filter((text): text is string => Boolean(text)).join("\n\n") || null;
    return buildMcqGroup(`listening-${part}`, `Part ${part}`, sorted[0]?.partTitle ?? null, transcript, items, "exam_listening_item", detail);
  });
}

function buildMcqGroup(
  id: string,
  label: string,
  contextLabel: string | null,
  contextBody: string | null,
  items: { id: string; stem: string; options: readonly string[]; correctIndex: number }[],
  itemRefType: "exam_listening_item" | "exam_reading_item",
  detail: ReadonlyMap<string, McqDetailItem>,
): McqReviewGroup {
  const reviewItems = items.map((item, index) => {
    const detailItem = detail.get(`${itemRefType}:${item.id}`);
    const selectedIndex = detailItem?.selectedIndex ?? null;
    const correctIndex = detailItem?.correctIndex ?? item.correctIndex;
    return {
      id: item.id,
      no: index + 1,
      stem: item.stem,
      options: item.options,
      status: detailItem?.answerStatus ?? "unanswered",
      statusLabel: detailItem?.answerStatusLabel ?? "Chưa làm",
      selectedLabel: selectedIndex == null ? null : OPTION_LABELS[selectedIndex] ?? null,
      correctLabel: OPTION_LABELS[correctIndex] ?? "—",
    };
  });

  return {
    id,
    label,
    contextLabel,
    contextBody,
    correct: reviewItems.filter((item) => item.status === "correct").length,
    total: reviewItems.length,
    items: reviewItems,
  };
}

function modeLabel(data: ResultData): string {
  if (data.session.isFullTest) return "Thi thử 4 kỹ năng";
  const skills = data.session.selectedSkills.map((skill) => SKILL_LABEL[skill] ?? skill).join(" + ");
  return skills ? `Thi thử ${skills}` : "Thi thử VSTEP";
}

function statusLabel(status: string): string {
  if (status === "ready" || status === "completed") return "Đã có kết quả";
  if (status === "pending" || status === "processing") return "Đang chấm điểm";
  if (status === "partial") return "Còn đang chấm";
  if (status === "failed") return "Lỗi chấm điểm";
  if (status === "not_submitted") return "Chưa nộp";
  if (status === "none") return "Chưa có dữ liệu";
  return "Không áp dụng";
}

function scoreText(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function skillColor(c: ReturnType<typeof useThemeColors>, skill: Skill): string {
  if (skill === "listening") return c.skillListening;
  if (skill === "reading") return c.skillReading;
  if (skill === "writing") return c.skillWriting;
  return c.coinDark;
}

function toneColor(c: ReturnType<typeof useThemeColors>, tone: "writing" | "speaking"): string {
  return tone === "writing" ? c.skillWriting : c.coinDark;
}

function speakingPromptText(content: Record<string, unknown>): string {
  const lines = Object.entries(content).flatMap(([key, value]) => formatPromptLine(humanizeKey(key), value));
  return lines.length > 0 ? lines.join("\n") : "Chưa có nội dung đề.";
}

function formatPromptLine(label: string, value: unknown): string[] {
  if (Array.isArray(value)) return [`${label}: ${value.map(formatPromptValue).join("; ")}`];
  if (isPlainObject(value)) return [`${label}:`, ...Object.entries(value).map(([key, entry]) => `- ${humanizeKey(key)}: ${formatPromptValue(entry)}`)];
  return [`${label}: ${formatPromptValue(value)}`];
}

function formatPromptValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map(formatPromptValue).join("; ");
  if (isPlainObject(value)) return Object.entries(value).map(([key, entry]) => `${humanizeKey(key)}: ${formatPromptValue(entry)}`).join("; ");
  return String(value);
}

function humanizeKey(key: string): string {
  return key.replaceAll("_", " ");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type FeedbackTextItem = string | { message?: string; explanation?: string };
type FeedbackRewriteItem = string | { original?: string; improved?: string; reason?: string };

function normalizeTextItems(items: FeedbackTextItem[] | undefined): string[] {
  return (items ?? []).map((item) => typeof item === "string" ? item : item.message ?? item.explanation ?? "").filter(Boolean);
}

function normalizeImprovementItems(items: FeedbackTextItem[] | undefined): { message: string; explanation: string }[] {
  return (items ?? [])
    .map((item) => typeof item === "string" ? { message: item, explanation: "" } : { message: item.message ?? item.explanation ?? "", explanation: item.explanation ?? "" })
    .filter((item) => item.message.length > 0);
}

function normalizeRewriteItems(items: FeedbackRewriteItem[] | undefined): { original: string; improved: string; reason: string }[] {
  return (items ?? [])
    .map((item) => typeof item === "string" ? { original: item, improved: item, reason: "" } : { original: item.original ?? "", improved: item.improved ?? "", reason: item.reason ?? "" })
    .filter((item) => item.original.length > 0 || item.improved.length > 0);
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 2 },
  headerTitle: { marginTop: 2, fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, lineHeight: 23 },
  headerMeta: { marginTop: 2, fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  scroll: { padding: spacing.lg, gap: spacing.md },
  summaryCard: { borderWidth: 2, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.md },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  summaryOutcome: { marginTop: spacing.xs, fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  statusPill: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusText: { fontSize: 11, fontFamily: fontFamily.extraBold },
  celebration: { marginHorizontal: spacing.lg, marginTop: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderRadius: radius.xl, padding: spacing.md },
  fireHalo: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  celebrationTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  celebrationSub: { marginTop: 2, fontSize: fontSize.xs, fontFamily: fontFamily.bold, lineHeight: 17 },
  celebrationCount: { minWidth: 28, textAlign: "right", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  bandBox: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg },
  bandLabel: { fontSize: 11, fontFamily: fontFamily.extraBold, letterSpacing: 1.4 },
  bandRow: { marginTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.md },
  bandValue: { fontSize: 48, fontFamily: fontFamily.extraBold, lineHeight: 54 },
  bandTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  bandSub: { marginTop: spacing.xs, fontSize: fontSize.xs, fontFamily: fontFamily.bold, lineHeight: 17 },
  metricGrid: { flexDirection: "row", gap: spacing.sm },
  metricPill: { flex: 1, minHeight: 72, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, justifyContent: "center" },
  metricLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  metricValue: { marginTop: spacing.xs, fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  noticeText: { flex: 1, fontSize: fontSize.xs, fontFamily: fontFamily.bold, lineHeight: 18 },
  skillCard: { borderWidth: 2, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md },
  skillHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillHint: { marginTop: spacing.xs, fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  countPill: { overflow: "hidden", borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  skillRail: { gap: spacing.sm, paddingRight: spacing.sm },
  skillChip: { width: 168, minHeight: 72, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  skillIcon: { width: 38, height: 38, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  skillName: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  skillMeta: { marginTop: 2, fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  issuePill: { overflow: "hidden", minWidth: 22, textAlign: "center", borderRadius: radius.full, paddingHorizontal: spacing.xs, fontSize: 10, fontFamily: fontFamily.extraBold },
  detailCard: { borderWidth: 2, borderRadius: radius["2xl"], padding: spacing.md, gap: spacing.md },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  panelOverline: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  panelTitle: { marginTop: 2, fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  scoreBadge: { overflow: "hidden", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  tabRail: { gap: spacing.sm, paddingBottom: spacing.sm },
  partTab: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  partTabText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  filterChip: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  contextBox: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  contextTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  contextText: { fontSize: fontSize.sm, lineHeight: 24, fontFamily: fontFamily.medium },
  questionCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  questionTop: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  questionNo: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  answerBadge: { overflow: "hidden", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 2, fontSize: 11, fontFamily: fontFamily.extraBold },
  selectedText: { marginLeft: "auto", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  questionStem: { fontSize: fontSize.sm, lineHeight: 22, fontFamily: fontFamily.medium },
  optionRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", borderLeftWidth: 3, borderRadius: radius.md, padding: spacing.sm },
  optionMarker: { overflow: "hidden", width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, textAlign: "center", lineHeight: 27, fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  optionText: { flex: 1, fontSize: fontSize.sm, lineHeight: 22, fontFamily: fontFamily.medium },
  productiveTab: { width: 168, minHeight: 52, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, justifyContent: "space-between" },
  productiveTabLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  productiveTabScore: { marginTop: spacing.xs, fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  productiveBody: { gap: spacing.md },
  productiveHeader: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md, borderBottomWidth: 1, paddingBottom: spacing.md, marginBottom: spacing.md },
  productiveTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  productiveMeta: { marginTop: spacing.xs, fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  productiveScore: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  detailSection: { borderBottomWidth: 1, paddingBottom: spacing.md, marginBottom: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1.2 },
  detailText: { fontSize: fontSize.sm, lineHeight: 23, fontFamily: fontFamily.medium },
  rubricTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rubricLabel: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  rubricScore: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  rubricTrack: { height: 9, borderRadius: radius.full, overflow: "hidden" },
  rubricFill: { height: "100%", borderRadius: radius.full },
  feedbackTitle: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  feedbackRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  bullet: { fontSize: fontSize.lg, lineHeight: 20, fontFamily: fontFamily.extraBold },
  feedbackMessage: { fontSize: fontSize.sm, lineHeight: 21, fontFamily: fontFamily.semiBold },
  feedbackExplanation: { marginTop: 2, fontSize: fontSize.xs, lineHeight: 18, fontFamily: fontFamily.medium },
  rewriteBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  rewriteText: { fontSize: fontSize.sm, lineHeight: 21, fontFamily: fontFamily.medium },
  pendingBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  audioButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  audioText: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  emptyBlock: { minHeight: 140, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.lg },
  emptyText: { textAlign: "center", fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
});
