import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

import { DepthCard } from "@/components/DepthCard";
import { SkillIcon } from "@/components/SkillIcon";
import { api } from "@/lib/api";
import { useOverview } from "@/hooks/use-progress";
import { getTargetBand } from "@/lib/vstep";
import { useThemeColors, spacing, fontSize, fontFamily, radius, type ThemeColors } from "@/theme";
import type { ExamSessionResult, ScoreQuality, Skill } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const MAX_TESTS = 7;

const CHART_W = 600;
const CHART_H = 240;
const LEFT = 38;
const RIGHT = 584;
const TOP = 22;
const BASE = 176;
const PLOT_H = BASE - TOP;

const SKILL_META: Record<Skill, { vi: string }> = {
  listening: { vi: "Nghe" },
  reading: { vi: "Đọc" },
  writing: { vi: "Viết" },
  speaking: { vi: "Nói" },
};

type ScoredSession = ExamSessionResult & {
  scores: Record<Skill, number | null>;
  submittedAt: string;
};

function getSkillColor(skill: Skill, theme: ThemeColors): string {
  const map: Record<Skill, string> = {
    listening: theme.info,
    reading: theme.skillReading,
    writing: theme.primary,
    speaking: theme.coin,
  };
  return map[skill];
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function bandToY(value: number): number {
  return BASE - (Math.max(0, Math.min(10, value)) / 10) * PLOT_H;
}

function computeAvg(scores: Record<Skill, number | null>, visibleSkills: readonly Skill[]): number | null {
  const vals = visibleSkills.map((skill) => scores[skill]).filter((value): value is number => value !== null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((sum, value) => sum + value, 0) / vals.length) * 10) / 10;
}

function avgPoints(tests: ScoredSession[], centers: number[], visibleSkills: readonly Skill[]): string {
  return tests
    .map((test, index) => {
      const avg = computeAvg(test.scores, visibleSkills);
      return avg !== null ? `${centers[index]},${bandToY(avg)}` : null;
    })
    .filter((point): point is string => point !== null)
    .join(" ");
}

function outlierNotice(quality: ScoreQuality | undefined): string | null {
  if (!quality?.hasOutlier) return null;

  const outlierLabels = SKILLS.filter((skill) => quality.outlierSkills.includes(skill)).map((skill) => SKILL_META[skill].vi);
  const message = quality.status === "consecutive_low"
    ? "Điểm thấp đã xuất hiện ở ít nhất 2 lượt liên tiếp. Hệ thống đã bắt đầu cập nhật năng lực hiện tại theo xu hướng mới."
    : "Lượt thi mới nhất thấp bất thường so với phong độ gần đây. Hệ thống vẫn ghi nhận trong lịch sử, nhưng cần thêm 1 lượt xác nhận trước khi cập nhật năng lực hiện tại.";

  if (outlierLabels.length === 0) return message;
  return `${message} Kỹ năng bị ảnh hưởng: ${outlierLabels.join(", ")}.`;
}

export function ScoreTrend() {
  const c = useThemeColors();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(SKILLS);
  const { data: overview } = useOverview();
  const { data, isLoading } = useQuery({
    queryKey: ["exam-sessions"],
    queryFn: () => api.get<ExamSessionResult[]>("/api/v1/exam-sessions"),
  });

  const tests = useMemo(() => {
    return (data ?? [])
      .filter((session): session is ScoredSession => session.submittedAt !== null && session.scores !== null)
      .slice(0, MAX_TESTS)
      .reverse();
  }, [data]);

  if (isLoading || !overview) {
    return (
      <DepthCard style={styles.root}>
        <ActivityIndicator color={c.primary} />
      </DepthCard>
    );
  }

  if (tests.length === 0) {
    return (
      <DepthCard style={styles.root}>
        <Text style={[styles.title, { color: c.foreground }]}>Điểm qua các lần thi</Text>
        <Text style={[styles.subtitle, { color: c.subtle }]}>Chưa có bài thi thử nào</Text>
      </DepthCard>
    );
  }

  const targetLevel = overview.profile.targetLevel ?? "B2";
  const targetBand = getTargetBand(targetLevel);
  const visibleSkills = SKILLS.filter((skill) => selectedSkills.includes(skill));
  const activeTest = activeIdx !== null ? tests[activeIdx] : null;
  const activeAvg = activeTest ? computeAvg(activeTest.scores, visibleSkills) : null;
  const notice = outlierNotice(overview.scores.quality);

  function toggleSkill(skill: Skill) {
    setSelectedSkills((current) => {
      if (!current.includes(skill)) return [...current, skill];
      if (current.length === 1) return current;
      return current.filter((item) => item !== skill);
    });
  }

  return (
    <DepthCard style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: c.foreground }]}>Điểm qua các lần thi</Text>
          <Text style={[styles.subtitle, { color: c.subtle }]}>{tests.length} bài thi gần nhất</Text>
        </View>
        <View style={[styles.targetBadge, { backgroundColor: c.destructiveTint }]}>
          <Text style={[styles.targetBadgeText, { color: c.destructive }]}> 
            {targetLevel} ≥ {targetBand}
          </Text>
        </View>
      </View>

      <ScoreLegend
        colors={c}
        selectedSkills={selectedSkills}
        onToggleSkill={toggleSkill}
        onShowAll={() => setSelectedSkills(SKILLS)}
      />

      {notice ? (
        <View style={[styles.notice, { backgroundColor: c.warningTint, borderColor: c.warning + "35" }]}> 
          <Text style={[styles.noticeText, { color: c.warning }]}>{notice}</Text>
        </View>
      ) : null}

      <Pressable style={styles.chartTapArea} onPress={() => setZoomOpen(true)}>
        <ScoreTrendChart
          tests={tests}
          targetBand={targetBand}
          activeIdx={activeIdx}
          onSelect={(index) => setActiveIdx(activeIdx === index ? null : index)}
          colors={c}
          visibleSkills={visibleSkills}
          width="100%"
          height={244}
        />
      </Pressable>

      {activeTest ? (
        <View style={[styles.detailPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View>
            <Text style={[styles.detailDate, { color: c.foreground }]}>{formatShortDate(activeTest.submittedAt)}</Text>
            <Text style={[styles.detailAvg, { color: c.primaryDark }]}>TB có điểm {activeAvg?.toFixed(1) ?? "—"}</Text>
          </View>
          <ScoreBreakdown test={activeTest} colors={c} visibleSkills={visibleSkills} />
        </View>
      ) : (
        <Text style={[styles.tapHint, { color: c.subtle }]}>Chạm biểu đồ để phóng to. Chạm cột để xem chi tiết.</Text>
      )}

      <ScoreTrendZoomModal
        visible={zoomOpen}
        tests={tests}
        targetBand={targetBand}
        activeIdx={activeIdx}
        onSelect={(index) => setActiveIdx(activeIdx === index ? null : index)}
        onClose={() => setZoomOpen(false)}
        colors={c}
        visibleSkills={visibleSkills}
      />
    </DepthCard>
  );
}

function ScoreLegend({
  colors,
  selectedSkills,
  onToggleSkill,
  onShowAll,
}: {
  colors: ThemeColors;
  selectedSkills: readonly Skill[];
  onToggleSkill: (skill: Skill) => void;
  onShowAll: () => void;
}) {
  return (
    <View style={styles.legend}>
      {SKILLS.map((skill) => {
        const selected = selectedSkills.includes(skill);
        return (
          <Pressable
            key={skill}
            onPress={() => onToggleSkill(skill)}
            style={[
              styles.legendButton,
              { borderColor: selected ? getSkillColor(skill, colors) : colors.border, backgroundColor: selected ? colors.surface : colors.muted },
              !selected && styles.legendButtonOff,
            ]}
          >
            <SkillIcon skill={skill} size={14} bare />
            <Text style={[styles.legendText, { color: getSkillColor(skill, colors) }]}>{SKILL_META[skill].vi}</Text>
          </Pressable>
        );
      })}
      <Pressable style={[styles.legendButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={onShowAll}>
        <Text style={[styles.legendText, { color: colors.subtle }]}>Tất cả</Text>
      </Pressable>
      <View style={styles.legendItem}>
        <View style={[styles.avgLegend, { backgroundColor: colors.primaryDark }]} />
        <Text style={[styles.legendText, { color: colors.primaryDark }]}>TB kỹ năng có điểm</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.targetLegend, { borderTopColor: colors.destructive }]} />
        <Text style={[styles.legendText, { color: colors.destructive }]}>Mục tiêu</Text>
      </View>
    </View>
  );
}

function ScoreTrendChart({
  tests,
  targetBand,
  activeIdx,
  onSelect,
  colors,
  visibleSkills,
  width,
  height,
}: {
  tests: ScoredSession[];
  targetBand: number;
  activeIdx: number | null;
  onSelect: (index: number) => void;
  colors: ThemeColors;
  visibleSkills: readonly Skill[];
  width: number | `${number}%`;
  height: number;
}) {
  const spacingX = tests.length > 1 ? (RIGHT - LEFT - 24) / (tests.length - 1) : 0;
  const centers = tests.map((_, index) => (tests.length === 1 ? (LEFT + RIGHT) / 2 : LEFT + 12 + index * spacingX));
  const averagePoints = avgPoints(tests, centers, visibleSkills);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      <G>
        {[0, 2.5, 5, 7.5, 10].map((value) => {
          const y = bandToY(value);
          return (
            <G key={value}>
              <Line
                x1={LEFT}
                y1={y}
                x2={RIGHT}
                y2={y}
                stroke={value === 0 ? colors.border : colors.borderLight}
                strokeWidth={value === 0 ? 1.4 : 1}
              />
              <SvgText x={LEFT - 10} y={y + 4} textAnchor="end" fontSize="10" fill={colors.placeholder}>
                {value}
              </SvgText>
            </G>
          );
        })}
      </G>

      {tests.map((test, testIndex) => {
        const cx = centers[testIndex];
        const isActive = activeIdx === testIndex;
        const barW = 9;
        const barGap = 2;
        const groupW = visibleSkills.length * barW + (visibleSkills.length - 1) * barGap;
        return (
          <G key={test.id}>
            {visibleSkills.map((skill, skillIndex) => {
              const value = test.scores[skill];
              if (value === null) return null;
              const y = bandToY(value);
              return (
                <Rect
                  key={skill}
                  x={cx - groupW / 2 + skillIndex * (barW + barGap)}
                  y={y}
                  width={barW}
                  height={Math.max(0, BASE - y)}
                  rx={3}
                  fill={getSkillColor(skill, colors)}
                  opacity={isActive || activeIdx === null ? 0.82 : 0.42}
                />
              );
            })}
            <SvgText x={cx} y={216} textAnchor="middle" fontSize="10" fontWeight="700" fill={colors.subtle}>
              {formatShortDate(test.submittedAt)}
            </SvgText>
            <Rect
              x={cx - 28}
              y={TOP}
              width={56}
              height={BASE - TOP + 34}
              fill="transparent"
              onPress={() => onSelect(testIndex)}
            />
          </G>
        );
      })}

      <Line
        x1={LEFT}
        y1={bandToY(targetBand)}
        x2={RIGHT}
        y2={bandToY(targetBand)}
        stroke={colors.destructive}
        strokeWidth={1.6}
        strokeDasharray="6 6"
      />
      <Polyline
        points={averagePoints}
        fill="none"
        stroke={colors.primaryDark}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {tests.map((test, index) => {
        const avg = computeAvg(test.scores, visibleSkills);
        if (avg === null) return null;
        const x = centers[index];
        const y = bandToY(avg);
        const isActive = activeIdx === index;
        return (
          <G key={`avg-${test.id}`}>
            <Circle cx={x} cy={y} r={5} fill={colors.card} stroke={colors.primaryDark} strokeWidth={3} />
            {isActive ? (
              <SvgText x={x} y={y + 20} textAnchor="middle" fontSize="11" fontWeight="800" fill={colors.mutedForeground}>
                {avg.toFixed(1)}
              </SvgText>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}

function ScoreTrendZoomModal({
  visible,
  tests,
  targetBand,
  activeIdx,
  onSelect,
  onClose,
  colors,
  visibleSkills,
}: {
  visible: boolean;
  tests: ScoredSession[];
  targetBand: number;
  activeIdx: number | null;
  onSelect: (index: number) => void;
  onClose: () => void;
  colors: ThemeColors;
  visibleSkills: readonly Skill[];
}) {
  const activeTest = activeIdx !== null ? tests[activeIdx] : null;
  const activeAvg = activeTest ? computeAvg(activeTest.scores, visibleSkills) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.zoomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.zoomHeader}>
            <View style={styles.headerCopy}>
              <Text style={[styles.zoomTitle, { color: colors.foreground }]}>Điểm qua các lần thi</Text>
              <Text style={[styles.zoomSub, { color: colors.subtle }]}>Kéo ngang để xem rõ hơn</Text>
            </View>
            <Pressable style={[styles.closePill, { backgroundColor: colors.surface }]} onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.foreground }]}>Đóng</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.zoomScroll}>
            <View style={styles.zoomChartCanvas}>
              <ScoreTrendChart
                tests={tests}
                targetBand={targetBand}
                activeIdx={activeIdx}
                onSelect={onSelect}
                colors={colors}
                visibleSkills={visibleSkills}
                width={920}
                height={368}
              />
            </View>
          </ScrollView>

          {activeTest ? (
            <View style={[styles.detailPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.detailDate, { color: colors.foreground }]}>{formatShortDate(activeTest.submittedAt)}</Text>
                <Text style={[styles.detailAvg, { color: colors.primaryDark }]}>TB có điểm {activeAvg?.toFixed(1) ?? "—"}</Text>
              </View>
              <ScoreBreakdown test={activeTest} colors={colors} visibleSkills={visibleSkills} />
            </View>
          ) : (
            <Text style={[styles.tapHint, { color: colors.subtle }]}>Chạm vào một cụm cột để xem chi tiết.</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ScoreBreakdown({ test, colors, visibleSkills }: { test: ScoredSession; colors: ThemeColors; visibleSkills: readonly Skill[] }) {
  return (
    <View style={styles.detailScores}>
      {visibleSkills.map((skill) => (
        <View key={skill} style={styles.detailScore}>
          <Text style={[styles.detailSkill, { color: getSkillColor(skill, colors) }]}>{SKILL_META[skill].vi}</Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {test.scores[skill]?.toFixed(1) ?? "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  targetBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  targetBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.extraBold,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  legendButtonOff: {
    opacity: 0.55,
  },
  legendText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  avgLegend: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  targetLegend: {
    width: 14,
    height: 1,
    borderTopWidth: 2,
    borderStyle: "dashed",
  },
  chartTapArea: {
    borderRadius: radius.lg,
  },
  notice: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  noticeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    lineHeight: 18,
  },
  detailPanel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  detailDate: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.extraBold,
  },
  detailAvg: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    marginTop: 2,
  },
  detailScores: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detailScore: {
    minWidth: 58,
  },
  detailSkill: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.extraBold,
  },
  tapHint: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 24, 0.45)",
    justifyContent: "center",
    padding: spacing.base,
  },
  zoomSheet: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
    maxHeight: "84%",
  },
  zoomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  zoomTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  zoomSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  closePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  closeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.extraBold,
  },
  zoomScroll: {
    paddingVertical: spacing.xs,
  },
  zoomChartCanvas: {
    width: 920,
  },
});
