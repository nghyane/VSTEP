import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { AudioTestPlayer, MicTest } from "@/components/DeviceTestWidgets";
import { SkillIcon } from "@/components/SkillIcon";
import { ConfirmModal, ResultScreen } from "@/components/exam/ConfirmModal";
import { ListeningPanel, ReadingPanel, WritingPanel } from "@/components/exam/ExamPanels";
import { SpeakingPanel } from "@/components/exam/SpeakingPanel";
import { useExam } from "@/hooks/use-exams";
import {
  useExamSession, useExamSessionState, useExamTimer,
  type SubmitSessionResult,
} from "@/hooks/use-exam-session";
import { useThemeColors, spacing, radius, fontSize, fontFamily, colors as themeColors } from "@/theme";
import type { ExamVersionMcqItem, Skill } from "@/types/api";

const SKILL_COLOR: Record<string, string> = {
  listening: themeColors.light.skillListening,
  reading: themeColors.light.skillReading,
  writing: themeColors.light.skillWriting,
  speaking: themeColors.light.skillSpeaking,
};
const SKILL_LABEL: Record<string, string> = {
  listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói",
};

function fmtTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function SessionScreen() {
  const { id, examId } = useLocalSearchParams<{ id: string; examId: string }>();
  const { data: sessionData, isLoading: sessionLoading } = useExamSession(id ?? "");
  const { data: examDetail, isLoading: examLoading } = useExam(examId ?? "");
  const [submitResult, setSubmitResult] = useState<SubmitSessionResult | null>(null);
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (sessionLoading || examLoading) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (!sessionData || !examDetail) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.destructive }}>Không tải được phiên thi.</Text>
        <DepthButton variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          Quay lại
        </DepthButton>
      </View>
    );
  }

  if (submitResult) {
    return (
      <ResultScreen
        result={submitResult}
        sessionId={sessionData.id}
        examTitle={examDetail.exam.title}
        onGoToResult={() => router.replace(`/(app)/exam-result/${sessionData.id}`)}
        onGoToExams={() => router.replace("/(app)/(tabs)/exams")}
      />
    );
  }

  return (
    <ExamRoom
      session={sessionData}
      examDetail={examDetail}
      onSubmitted={setSubmitResult}
      c={c}
      insets={insets}
      router={router}
    />
  );
}

interface ExamRoomProps {
  session: { id: string; serverDeadlineAt: string; selectedSkills: string[] };
  examDetail: { exam: { title: string }; version: { listeningSections: unknown[]; readingPassages: unknown[]; writingTasks: unknown[]; speakingParts: unknown[] } };
  onSubmitted: (result: SubmitSessionResult) => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { top: number; bottom: number; left: number; right: number };
  router: ReturnType<typeof useRouter>;
}

function ExamRoom({ session, examDetail, onSubmitted, c, insets, router }: ExamRoomProps) {
  const { version, exam } = examDetail;
  const listeningItems: ExamVersionMcqItem[] = (version.listeningSections as { items: ExamVersionMcqItem[] }[]).flatMap((s) => s.items);
  const readingItems: ExamVersionMcqItem[] = (version.readingPassages as { items: ExamVersionMcqItem[] }[]).flatMap((p) => p.items);

  const es = useExamSessionState(
    session as Parameters<typeof useExamSessionState>[0],
    listeningItems,
    readingItems,
    version.writingTasks as Parameters<typeof useExamSessionState>[3],
    version.speakingParts as Parameters<typeof useExamSessionState>[4],
    onSubmitted,
  );
  const remaining = useExamTimer(session.serverDeadlineAt);
  const [speakingBusy, setSpeakingBusy] = useState(false);

  const guardSpeakingBusy = useCallback(() => {
    if (!speakingBusy) return false;
    Alert.alert(
      "Đang xử lý ghi âm",
      "Hãy dừng ghi âm hoặc đợi tải lên xong trước khi chuyển phần hoặc nộp bài.",
    );
    return true;
  }, [speakingBusy]);

  const guardedSubmit = useCallback(() => {
    if (guardSpeakingBusy()) return;
    es.submit();
  }, [es, guardSpeakingBusy]);

  const guardedNext = useCallback(() => {
    if (guardSpeakingBusy()) return;
    es.showConfirmNext();
  }, [es, guardSpeakingBusy]);

  const guardedExitSubmit = useCallback(() => {
    if (guardSpeakingBusy()) return;
    Alert.alert("Thoát phòng thi?", "Thoát sẽ tự động nộp bài ngay.", [
      { text: "Ở lại", style: "cancel" },
      { text: "Thoát & nộp", style: "destructive", onPress: guardedSubmit },
    ]);
  }, [guardSpeakingBusy, guardedSubmit]);

  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (remaining === 0 && !autoSubmitted.current && es.state.phase === "active" && !speakingBusy) {
      autoSubmitted.current = true;
      guardedSubmit();
    }
  }, [remaining, es.state.phase, speakingBusy, guardedSubmit]);

  useEffect(() => {
    if (es.state.phase !== "active") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      guardedExitSubmit();
      return true;
    });
    return () => subscription.remove();
  }, [es.state.phase, guardedExitSubmit]);

  if (es.state.phase === "device-check") {
    return (
      <DeviceCheck
        exam={exam}
        version={version}
        activeSkills={es.activeSkills}
        onStart={es.start}
        c={c}
        insets={insets}
      />
    );
  }

  const isWarning = remaining <= 300;
  const isUrgent = remaining <= 60;
  const timerColor = isUrgent ? c.destructive : isWarning ? c.warning : c.foreground;
  const timerBg = isUrgent ? c.destructiveTint : isWarning ? c.warningTint : c.muted;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable
          style={[s.timerPill, { backgroundColor: timerBg }]}
          onPress={() => {}}
        >
          <Ionicons name="time-outline" size={14} color={timerColor} />
          <Text style={[s.timerText, { color: timerColor }]}>{fmtTime(remaining)}</Text>
        </HapticTouchable>

        <Text style={[s.mcqProgress, { color: c.mutedForeground }]}>
          {es.answeredMcq}/{es.totalMcq} câu
        </Text>

        <HapticTouchable
          style={s.exitBtn}
          onPress={guardedExitSubmit}
        >
          <Ionicons name="exit-outline" size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>

      <View style={{ flex: 1 }}>
        {es.currentSkill === "listening" && (
          <ListeningPanel
            sections={version.listeningSections as Parameters<typeof ListeningPanel>[0]["sections"]}
            sessionId={session.id}
            answers={es.state.mcqAnswers}
            onAnswer={es.answerMcq}
            c={c}
            insets={insets}
          />
        )}
        {es.currentSkill === "reading" && (
          <ReadingPanel
            passages={version.readingPassages as Parameters<typeof ReadingPanel>[0]["passages"]}
            answers={es.state.mcqAnswers}
            onAnswer={es.answerMcq}
            c={c}
            insets={insets}
          />
        )}
        {es.currentSkill === "writing" && (
          <WritingPanel
            tasks={version.writingTasks as Parameters<typeof WritingPanel>[0]["tasks"]}
            answers={es.state.writingAnswers}
            onAnswer={es.answerWriting}
            c={c}
            insets={insets}
          />
        )}
        {es.currentSkill === "speaking" && (
          <SpeakingPanel
            parts={version.speakingParts as Parameters<typeof SpeakingPanel>[0]["parts"]}
            done={es.state.speakingDone}
            onDone={es.markSpeakingDone}
            onSetSpeakingAnswer={es.setSpeakingAnswer}
            onClearSpeakingAnswer={es.clearSpeakingAnswer}
            onBusyChange={setSpeakingBusy}
            c={c}
            insets={insets}
          />
        )}
      </View>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + spacing.sm, borderTopColor: c.borderLight }]}>
        <View style={s.skillIndicator}>
          <Text style={[s.skillLabel, { color: SKILL_COLOR[es.currentSkill] }]}>
            {SKILL_LABEL[es.currentSkill]}
          </Text>
          <Text style={[s.skillProgress, { color: c.subtle }]}>
            {es.state.skillIdx + 1}/{es.activeSkills.length}
          </Text>
        </View>
        {es.isLastSkill ? (
          <DepthButton
            disabled={es.isSubmitting || es.state.phase === "submitting" || speakingBusy}
            onPress={es.showConfirmSubmit}
            style={{ minWidth: 120 }}
          >
            {speakingBusy ? "Đang lưu..." : es.isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </DepthButton>
        ) : (
          <DepthButton variant="secondary" disabled={speakingBusy} onPress={guardedNext} style={{ minWidth: 120 }}>
            {speakingBusy ? "Đang lưu..." : "Phần tiếp"}
          </DepthButton>
        )}
      </View>

      <ConfirmModal
        visible={es.state.confirmSubmit}
        title="Nộp bài?"
        message="Sau khi nộp, bạn không thể chỉnh sửa câu trả lời."
        warning={es.answeredMcq < es.totalMcq ? `Còn ${es.totalMcq - es.answeredMcq} câu chưa trả lời` : undefined}
        confirmLabel={es.isSubmitting ? "Đang nộp..." : "Nộp bài"}
        onConfirm={guardedSubmit}
        onCancel={es.hideConfirmSubmit}
      />

      <ConfirmModal
        visible={es.state.confirmNextSkill}
        title={`Chuyển sang ${es.nextSkill ? SKILL_LABEL[es.nextSkill] : "phần tiếp"}?`}
        message="Sau khi chuyển, bạn không thể quay lại phần này để chỉnh sửa."
        confirmLabel="Chuyển"
        onConfirm={() => {
          if (guardSpeakingBusy()) return;
          es.nextSkillAction();
        }}
        onCancel={es.hideConfirmNext}
      />
    </View>
  );
}

interface DeviceCheckProps {
  exam: { title: string };
  version: {
    listeningSections: unknown[];
    readingPassages: unknown[];
    writingTasks: unknown[];
    speakingParts: unknown[];
  };
  activeSkills: string[];
  onStart: () => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { top: number; bottom: number };
}

function DeviceCheck({ exam, version, activeSkills, onStart, c, insets }: DeviceCheckProps) {
  const hasListening = activeSkills.includes("listening");
  const hasSpeaking = activeSkills.includes("speaking");
  const skillByKey: Record<string, { label: string; minutes: number }> = {
    listening: { label: "Nghe", minutes: (version.listeningSections as { durationMinutes: number }[]).reduce((a, s) => a + s.durationMinutes, 0) },
    reading: { label: "Đọc", minutes: (version.readingPassages as { durationMinutes: number }[]).reduce((a, p) => a + p.durationMinutes, 0) },
    writing: { label: "Viết", minutes: (version.writingTasks as { durationMinutes: number }[]).reduce((a, t) => a + t.durationMinutes, 0) },
    speaking: { label: "Nói", minutes: (version.speakingParts as { durationMinutes: number }[]).reduce((a, p) => a + p.durationMinutes, 0) },
  };
  const totalMinutes = activeSkills.reduce((a, sk) => a + (skillByKey[sk]?.minutes ?? 0), 0);

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={[s.dcTitle, { color: c.foreground }]}>{exam.title}</Text>
      <Text style={[s.dcSub, { color: c.mutedForeground }]}>Kiểm tra thiết bị trước khi bắt đầu</Text>

      <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={s.dcCardHeader}>
          <View style={[s.dcNumBadge, { backgroundColor: c.primary }]}>
            <Text style={s.dcNumText}>1</Text>
          </View>
          <Text style={[s.dcCardTitle, { color: c.foreground }]}>Cấu trúc bài thi</Text>
        </View>
        {activeSkills.map((sk, i) => (
          <View key={sk} style={[s.dcSkillRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }]}>
            <View style={[s.dcSkillDot, { backgroundColor: c.muted }]}>
              <Text style={[s.dcSkillDotText, { color: c.mutedForeground }]}>{i + 1}</Text>
            </View>
            <SkillIcon skill={sk as Skill} size={15} />
            <Text style={{ color: c.foreground }}>
              <Text style={[s.dcSkillName, { color: c.foreground }]}>{skillByKey[sk].label.toUpperCase()}</Text>
              <Text style={[s.dcSkillTime, { color: c.mutedForeground }]}> – {skillByKey[sk].minutes} phút</Text>
            </Text>
          </View>
        ))}
        <View style={[s.dcTotalRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ color: c.mutedForeground }}>Tổng thời gian: </Text>
          <Text style={[s.dcTotalText, { color: c.foreground }]}>{totalMinutes} phút</Text>
        </View>
      </View>

      {(hasListening || hasSpeaking) && (
        <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.dcCardHeader}>
            <View style={[s.dcNumBadge, { backgroundColor: c.primary }]}>
              <Text style={s.dcNumText}>2</Text>
            </View>
            <Text style={[s.dcCardTitle, { color: c.foreground }]}>Kiểm tra âm thanh</Text>
          </View>

          {hasListening && (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Ionicons name="volume-high" size={14} color={c.subtle} />
                <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, color: c.mutedForeground }}>Bước 1: Nghe đoạn audio</Text>
              </View>
              <AudioTestPlayer />
            </View>
          )}

          {hasSpeaking && (
            <View style={[hasListening && { borderTopWidth: 1, borderTopColor: c.borderLight, paddingTop: spacing.md }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm }}>
                <Ionicons name="mic" size={14} color={c.subtle} />
                <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, color: c.mutedForeground }}>
                  Bước {hasListening ? 2 : 1}: Thu âm thử → Nghe lại
                </Text>
              </View>
              <MicTest />
            </View>
          )}
        </View>
      )}

      {!hasListening && !hasSpeaking && (
        <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[s.dcNote, { color: c.mutedForeground }]}>Bài thi này không yêu cầu kiểm tra âm thanh.</Text>
        </View>
      )}

      <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={s.dcCardHeader}>
          <View style={[s.dcNumBadge, { backgroundColor: c.primary }]}>
            <Text style={s.dcNumText}>3</Text>
          </View>
          <Text style={[s.dcCardTitle, { color: c.foreground }]}>Lưu ý</Text>
        </View>
        {[
          "Sau khi chuyển phần, không thể quay lại phần trước.",
          "Câu trả lời được tự động lưu trong quá trình làm bài.",
          'Bấm "Phần tiếp" để sang kỹ năng kế tiếp.',
          'Bấm "Nộp bài" khi đã hoàn thành tất cả phần.',
        ].map((note) => (
          <View key={note} style={s.dcNoteRow}>
            <Text style={[s.dcNoteDot, { color: c.primary }]}>·</Text>
            <Text style={[s.dcNote, { color: c.mutedForeground }]}>{note}</Text>
          </View>
        ))}
      </View>

      <DepthButton fullWidth size="lg" onPress={onStart}>Nhận đề & bắt đầu</DepthButton>
      <Text style={[s.dcTimerNote, { color: c.subtle }]}>Thời gian sẽ bắt đầu tính khi bạn bấm nút trên</Text>
      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.md, borderBottomWidth: 1 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  timerText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  mcqProgress: { flex: 1, textAlign: "center", fontSize: fontSize.sm },
  exitBtn: { padding: 4 },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1 },
  skillIndicator: { gap: 2 },
  skillLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  skillProgress: { fontSize: fontSize.xs },
  dcTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  dcSub: { fontSize: fontSize.sm, textAlign: "center" },
  dcCard: { borderWidth: 2, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  dcCardTitle: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  dcSkillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm },
  dcSkillDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dcSkillName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  dcNote: { fontSize: fontSize.xs, lineHeight: 18 },
  dcCardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dcNumBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dcNumText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, color: "#fff" },
  dcSkillDotText: { fontSize: 10, fontFamily: fontFamily.bold, color: "#fff" },
  dcSkillTime: { fontSize: fontSize.xs },
  dcTotalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 2, marginTop: spacing.sm },
  dcTotalText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  dcNoteRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  dcNoteDot: { fontSize: fontSize.xs, lineHeight: 18 },
  dcTimerNote: { fontSize: fontSize.xs, textAlign: "center" },
});
