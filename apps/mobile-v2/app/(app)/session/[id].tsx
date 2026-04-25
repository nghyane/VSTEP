import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { resolveAssetUrl } from "@/lib/asset-url";
import { presignUpload } from "@/hooks/use-practice";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { AudioTestPlayer, MicTest } from "@/components/DeviceTestWidgets";
import { HighlightablePassage } from "@/components/HighlightablePassage";
import { useExam } from "@/hooks/use-exams";
import {
  useExamSession, useExamSessionState, useExamTimer,
  type ExamSessionData, type SubmitSessionResult,
} from "@/hooks/use-exam-session";
import { useThemeColors, spacing, radius, fontSize, fontFamily, colors as themeColors } from "@/theme";
import type { ExamVersionMcqItem } from "@/types/api";

const SKILL_COLOR: Record<string, string> = {
  listening: themeColors.light.skillListening,
  reading: themeColors.light.skillReading,
  writing: themeColors.light.skillWriting,
  speaking: themeColors.light.skillSpeaking,
};
const SKILL_LABEL: Record<string, string> = {
  listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói",
};

// ── Helpers ──

function fmtTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function countWords(t: string) {
  return t.trim() === "" ? 0 : t.trim().split(/\s+/).length;
}

// ── Root screen ──

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
    return <ResultScreen result={submitResult} sessionId={sessionData.id} examTitle={examDetail.exam.title} c={c} insets={insets} />;
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

// ── ExamRoom ──

function ExamRoom({ session, examDetail, onSubmitted, c, insets, router }: any) {
  const { version, exam } = examDetail;
  const listeningItems: ExamVersionMcqItem[] = version.listeningSections.flatMap((s: any) => s.items);
  const readingItems: ExamVersionMcqItem[] = version.readingPassages.flatMap((p: any) => p.items);

  const es = useExamSessionState(session, listeningItems, readingItems, version.writingTasks, version.speakingParts, onSubmitted);
  const remaining = useExamTimer(session.serverDeadlineAt);

  // Auto-submit khi hết giờ
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (remaining === 0 && !autoSubmitted.current && es.state.phase === "active") {
      autoSubmitted.current = true;
      es.submit();
    }
  }, [remaining, es.state.phase]);

  // Back intercept
  useEffect(() => {
    if (es.state.phase !== "active") return;
    const handler = () => {
      Alert.alert(
        "Thoát phòng thi?",
        "Thoát sẽ tự động nộp bài ngay. Tiếp tục?",
        [
          { text: "Ở lại", style: "cancel" },
          { text: "Thoát & nộp bài", style: "destructive", onPress: () => es.submit() },
        ],
      );
      return true;
    };
    return () => {};
  }, [es.state.phase]);

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
      {/* Top bar */}
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
          onPress={() => {
            Alert.alert("Thoát phòng thi?", "Thoát sẽ tự động nộp bài ngay.", [
              { text: "Ở lại", style: "cancel" },
              { text: "Thoát & nộp", style: "destructive", onPress: () => es.submit() },
            ]);
          }}
        >
          <Ionicons name="exit-outline" size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>

      {/* Skill panel */}
      <View style={{ flex: 1 }}>
        {es.currentSkill === "listening" && (
          <ListeningPanel sections={version.listeningSections} sessionId={session.id} answers={es.state.mcqAnswers} onAnswer={es.answerMcq} c={c} insets={insets} />
        )}
        {es.currentSkill === "reading" && (
          <ReadingPanel passages={version.readingPassages} answers={es.state.mcqAnswers} onAnswer={es.answerMcq} c={c} insets={insets} />
        )}
        {es.currentSkill === "writing" && (
          <WritingPanel tasks={version.writingTasks} answers={es.state.writingAnswers} onAnswer={es.answerWriting} c={c} insets={insets} />
        )}
        {es.currentSkill === "speaking" && (
          <SpeakingPanel parts={version.speakingParts} done={es.state.speakingDone} onDone={es.markSpeakingDone} onSetSpeakingAnswer={es.setSpeakingAnswer} c={c} insets={insets} />
        )}
      </View>

      {/* Bottom action bar */}
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
            disabled={es.isSubmitting || es.state.phase === "submitting"}
            onPress={es.showConfirmSubmit}
            style={{ minWidth: 120 }}
          >
            {es.isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </DepthButton>
        ) : (
          <DepthButton variant="secondary" onPress={es.showConfirmNext} style={{ minWidth: 120 }}>
            Phần tiếp
          </DepthButton>
        )}
      </View>

      {/* Confirm submit dialog */}
      <ConfirmModal
        visible={es.state.confirmSubmit}
        title="Nộp bài?"
        message="Sau khi nộp, bạn không thể chỉnh sửa câu trả lời."
        warning={es.answeredMcq < es.totalMcq ? `Còn ${es.totalMcq - es.answeredMcq} câu chưa trả lời` : undefined}
        confirmLabel={es.isSubmitting ? "Đang nộp..." : "Nộp bài"}
        onConfirm={es.submit}
        onCancel={es.hideConfirmSubmit}
        c={c}
      />

      {/* Confirm next skill dialog */}
      <ConfirmModal
        visible={es.state.confirmNextSkill}
        title={`Chuyển sang ${es.nextSkill ? SKILL_LABEL[es.nextSkill] : "phần tiếp"}?`}
        message="Sau khi chuyển, bạn không thể quay lại phần này để chỉnh sửa."
        confirmLabel="Chuyển"
        onConfirm={es.nextSkillAction}
        onCancel={es.hideConfirmNext}
        c={c}
      />
    </View>
  );
}

// ── Device Check ──

function DeviceCheck({ exam, version, activeSkills, onStart, c, insets }: any) {
  const hasListening = activeSkills.includes("listening");
  const hasSpeaking = activeSkills.includes("speaking");
  const skillByKey: Record<string, { label: string; minutes: number }> = {
    listening: { label: "Nghe", minutes: version.listeningSections.reduce((a: number, s: any) => a + s.durationMinutes, 0) },
    reading: { label: "Đọc", minutes: version.readingPassages.reduce((a: number, p: any) => a + p.durationMinutes, 0) },
    writing: { label: "Viết", minutes: version.writingTasks.reduce((a: number, t: any) => a + t.durationMinutes, 0) },
    speaking: { label: "Nói", minutes: version.speakingParts.reduce((a: number, p: any) => a + p.durationMinutes, 0) },
  };
  const totalMinutes = activeSkills.reduce((a: number, sk: string) => a + (skillByKey[sk]?.minutes ?? 0), 0);

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={[s.dcTitle, { color: c.foreground }]}>{exam.title}</Text>
      <Text style={[s.dcSub, { color: c.mutedForeground }]}>Kiểm tra thiết bị trước khi bắt đầu</Text>

      {/* Card 1: Exam structure */}
      <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={s.dcCardHeader}>
          <View style={[s.dcNumBadge, { backgroundColor: c.primary }]}>
            <Text style={s.dcNumText}>1</Text>
          </View>
          <Text style={[s.dcCardTitle, { color: c.foreground }]}>Cấu trúc bài thi</Text>
        </View>
        {activeSkills.map((sk: string, i: number) => (
          <View key={sk} style={[s.dcSkillRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }]}>
            <View style={[s.dcSkillDot, { backgroundColor: c.muted }]}>
              <Text style={[s.dcSkillDotText, { color: c.mutedForeground }]}>{i + 1}</Text>
            </View>
            <View style={[s.dcSkillIcon, { backgroundColor: SKILL_COLOR[sk] + "20" }]}>
              <Text style={{ fontSize: 10 }}>{sk === "listening" ? "🎧" : sk === "reading" ? "📖" : sk === "writing" ? "✍️" : "🎤"}</Text>
            </View>
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

      {/* Card 2: Audio & Mic check */}
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

      {/* Card 3: Notes */}
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

// ── Listening Panel ──

function ListeningPanel({ sections, sessionId, answers, onAnswer, c, insets }: any) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const section = sections[sectionIdx];
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    if (!section?.audioUrl) return;
    setAudioError(null);
    const audioUrl = resolveAssetUrl(section.audioUrl);
    let snd: Audio.Sound | null = null;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: loaded } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: false }, (st) => {
          if (st.isLoaded) setPlaying(st.isPlaying);
        });
        snd = loaded;
        setSound(loaded);
      } catch {
        setSound(null);
        setPlaying(false);
        setAudioError("Không tải được audio. Vui lòng thử lại sau.");
      }
    })();
    return () => { snd?.unloadAsync().catch(() => undefined); };
  }, [section?.id]);

  async function togglePlay() {
    if (!sound) return;
    try {
      if (playing) await sound.pauseAsync(); else await sound.playAsync();
    } catch {
      setPlaying(false);
      setAudioError("Không phát được audio. Vui lòng thử lại sau.");
    }
  }

  const color = themeColors.light.skillListening;

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {sections.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {sections.map((sec: any, i: number) => (
            <TouchableOpacity key={sec.id} onPress={() => setSectionIdx(i)} style={[s.sectionTab, { borderBottomColor: i === sectionIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === sectionIdx ? color : c.mutedForeground }]}>Part {sec.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.audioPartLabel, { color }]}>Part {section.part} · {section.partTitle}</Text>
        <TouchableOpacity onPress={togglePlay} disabled={!sound || !!audioError} style={[s.playBtn, { backgroundColor: audioError ? c.mutedForeground : color }]}>
          <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
          <Text style={s.playBtnText}>{playing ? "Tạm dừng" : "Phát audio"}</Text>
        </TouchableOpacity>
        {audioError && <Text style={[s.audioError, { color: c.destructive }]}>{audioError}</Text>}
      </View>
      {section.items.map((item: ExamVersionMcqItem, qi: number) => (
        <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx: number) => onAnswer(item.id, idx)} color={color} c={c} />
      ))}
    </ScrollView>
  );
}

// ── Reading Panel ──

function ReadingPanel({ passages, answers, onAnswer, c, insets }: any) {
  const [passageIdx, setPassageIdx] = useState(0);
  const [showPassage, setShowPassage] = useState(true);
  const passage = passages[passageIdx];
  const color = themeColors.light.skillReading;

  return (
    <View style={{ flex: 1 }}>
      {passages.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {passages.map((p: any, i: number) => (
            <TouchableOpacity key={p.id} onPress={() => setPassageIdx(i)} style={[s.sectionTab, { borderBottomColor: i === passageIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === passageIdx ? color : c.mutedForeground }]}>Part {p.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.toggleRow, { borderBottomColor: c.borderLight }]}>
        <TouchableOpacity style={[s.toggleBtn, showPassage && { borderBottomColor: color, borderBottomWidth: 2 }]} onPress={() => setShowPassage(true)}>
          <Text style={[s.toggleText, { color: showPassage ? color : c.mutedForeground }]}>Đoạn văn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, !showPassage && { borderBottomColor: color, borderBottomWidth: 2 }]} onPress={() => setShowPassage(false)}>
          <Text style={[s.toggleText, { color: !showPassage ? color : c.mutedForeground }]}>Câu hỏi</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
        {showPassage ? (
          <View style={[s.passageCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.passageTitle, { color }]}>Part {passage.part} · {passage.title}</Text>
            <HighlightablePassage text={passage.passage} passageId={passage.id} />
          </View>
        ) : (
          passage.items.map((item: ExamVersionMcqItem, qi: number) => (
            <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx: number) => onAnswer(item.id, idx)} color={color} c={c} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Writing Panel ──

function WritingPanel({ tasks, answers, onAnswer, c, insets }: any) {
  const [taskIdx, setTaskIdx] = useState(0);
  const task = tasks[taskIdx];
  const text = answers.get(task.id) ?? "";
  const wc = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const inRange = wc >= task.minWords;
  const color = themeColors.light.skillWriting;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {tasks.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {tasks.map((t: any, i: number) => (
            <TouchableOpacity key={t.id} onPress={() => setTaskIdx(i)} style={[s.sectionTab, { borderBottomColor: i === taskIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === taskIdx ? color : c.mutedForeground }]}>Task {t.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]} keyboardShouldPersistTaps="handled">
        <View style={[s.promptCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[s.promptLabel, { color }]}>Task {task.part} · {task.taskType}</Text>
          <Text style={[s.promptText, { color: c.foreground }]}>{task.prompt}</Text>
          <Text style={[s.promptMeta, { color: c.subtle }]}>Tối thiểu {task.minWords} từ</Text>
        </View>
        <View style={[s.editorCard, { backgroundColor: c.card, borderColor: inRange ? color : c.border }]}>
          <TextInput
            style={[s.editor, { color: c.foreground }]}
            value={text}
            onChangeText={(v) => onAnswer(task.id, v)}
            placeholder="Viết bài của bạn ở đây..."
            placeholderTextColor={c.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={[s.wcBadge, { color: inRange ? color : c.subtle }]}>{wc} / {task.minWords}+ từ</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Speaking Panel ──

interface SpeakingAnswer {
  partId: string;
  audioUrl: string | null;
  durationSeconds: number;
}

function SpeakingPanel({ parts, done, onDone, onSetSpeakingAnswer, c, insets }: {
  parts: { id: string; part: number; type: string; speakingSeconds: number }[];
  done: Set<string>;
  onDone: (partId: string) => void;
  onSetSpeakingAnswer: (partId: string, answer: SpeakingAnswer) => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { top: number; bottom: number; left: number; right: number };
}) {
  const [partIdx, setPartIdx] = useState(0);
  const part = parts[partIdx];
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRec, setIsRec] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const accentColor = themeColors.light.skillSpeaking;
  const accentDark = themeColors.light.skillSpeaking + "CC";

  // Reset playback state when switching parts
  useEffect(() => {
    setAudioUri(null);
    setIsRec(false);
    setRecording(null);
    sound?.unloadAsync().catch(() => undefined);
    setSound(null);
    setIsPlaying(false);
  }, [partIdx]);

  async function startRec() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRec(true);
    } catch {
      // permission denied
    }
  }

  async function stopRec() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setAudioUri(uri);
    setIsRec(false);
    setRecording(null);
  }

  async function uploadAudio(): Promise<string | null> {
    if (!audioUri) return null;
    setUploading(true);
    try {
      const presign = await presignUpload("exam_speaking");
      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      await fetch(presign.uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: { "Content-Type": "audio/webm" },
      });
      return presign.audioKey;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmRecord() {
    const audioKey = await uploadAudio();
    if (!audioKey) return;
    const duration = part.speakingSeconds;
    const answer: SpeakingAnswer = { partId: part.id, audioUrl: audioKey, durationSeconds: duration };
    onSetSpeakingAnswer(part.id, answer);
    onDone(part.id);
  }

  async function handlePlayback() {
    if (!audioUri) return;
    try {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, {}, (status) => {
        if (status.isLoaded) setIsPlaying(status.isPlaying);
      });
      setSound(newSound);
    } catch {
      // playback error
    }
  }

  function handleRerecord() {
    sound?.unloadAsync().catch(() => undefined);
    setSound(null);
    setIsPlaying(false);
    setAudioUri(null);
    onSetSpeakingAnswer(part.id, { partId: part.id, audioUrl: null, durationSeconds: 0 });
    done.delete(part.id);
  }

  const hasRecording = done.has(part.id);

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {parts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {parts.map((p, i: number) => (
            <TouchableOpacity key={p.id} onPress={() => setPartIdx(i)}
              style={[s.sectionTab, { borderBottomColor: i === partIdx ? accentColor : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === partIdx ? accentDark : c.mutedForeground }]}>Part {p.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.promptCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.promptLabel, { color: accentDark }]}>Part {part.part} · {part.type}</Text>
        <Text style={[s.promptMeta, { color: c.mutedForeground }]}>{part.speakingSeconds}s · Ghi âm câu trả lời</Text>
      </View>
      <View style={[s.recCard, { backgroundColor: c.card, borderColor: isRec ? accentColor : c.border }]}>
        {!audioUri && !hasRecording && (
          <DepthButton onPress={isRec ? stopRec : startRec} disabled={isRec}>
            {isRec ? "Dừng ghi âm" : "Bắt đầu nói"}
          </DepthButton>
        )}
        {audioUri && !hasRecording && (
          <>
            <DepthButton variant="secondary" onPress={handlePlayback} disabled={isPlaying || uploading}>
              {isPlaying ? "Đang phát..." : "Nghe lại"}
            </DepthButton>
            <DepthButton variant="secondary" onPress={handleRerecord} disabled={uploading}>
              Ghi âm lại
            </DepthButton>
            <DepthButton onPress={handleConfirmRecord} disabled={uploading}>
              {uploading ? "Đang tải lên..." : "Xác nhận & tiếp"}
            </DepthButton>
          </>
        )}
        {hasRecording && (
          <View style={s.doneRow}>
            <Ionicons name="checkmark-circle" size={16} color={themeColors.light.skillWriting} />
            <Text style={[s.doneText, { color: themeColors.light.skillWriting }]}>Đã ghi âm</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── MCQ Card ──

function McqCard({ item, index, selected, onSelect, color, c }: any) {
  return (
    <View style={[s.qCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[s.qNum, { color }]}>Câu {index + 1}</Text>
      <Text style={[s.qStem, { color: c.foreground }]}>{item.stem}</Text>
      <View style={s.options}>
        {item.options.map((opt: string, i: number) => {
          const sel = selected === i;
          return (
            <TouchableOpacity key={i} onPress={() => onSelect(i)}
              style={[s.option, { borderColor: sel ? color : c.border, backgroundColor: sel ? color + "18" : c.card }]}>
              <View style={[s.optDot, { borderColor: sel ? color : c.border, backgroundColor: sel ? color : "transparent" }]}>
                {sel && <View style={s.optDotInner} />}
              </View>
              <Text style={[s.optText, { color: sel ? color : c.foreground }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Confirm Modal ──

function ConfirmModal({ visible, title, message, warning, confirmLabel, onConfirm, onCancel, c }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[s.modalIcon, { backgroundColor: c.warningTint }]}>
            <Ionicons name="warning-outline" size={24} color={c.warning} />
          </View>
          <Text style={[s.modalTitle, { color: c.foreground }]}>{title}</Text>
          <Text style={[s.modalMsg, { color: c.mutedForeground }]}>{message}</Text>
          {warning && (
            <View style={[s.modalWarning, { backgroundColor: c.warningTint }]}>
              <Text style={[s.modalWarningText, { color: c.warning }]}>{warning}</Text>
            </View>
          )}
          <View style={s.modalBtns}>
            <DepthButton variant="secondary" onPress={onCancel} style={{ flex: 1 }}>Ở lại</DepthButton>
            <DepthButton onPress={onConfirm} style={{ flex: 1 }}>{confirmLabel}</DepthButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Result Screen ──

function ResultScreen({ result, sessionId, examTitle, c, insets }: { result: SubmitSessionResult; sessionId: string; examTitle: string; c: ReturnType<typeof useThemeColors>; insets: { bottom: number } }) {
  const router = useRouter();
  const pct = result.mcqTotal > 0 ? Math.round((result.mcqScore / result.mcqTotal) * 100) : 0;
  return (
    <View style={[s.center, { backgroundColor: c.background, paddingHorizontal: spacing.xl }]}>
      <View style={[s.resultIcon, { backgroundColor: c.primaryTint }]}>
        <Ionicons name="checkmark" size={40} color={c.primary} />
      </View>
      <Text style={[s.resultTitle, { color: c.foreground }]}>Nộp bài thành công!</Text>
      <Text style={[s.resultExam, { color: c.mutedForeground }]}>{examTitle}</Text>
      <View style={[s.resultCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
        <Text style={[s.resultScoreLabel, { color: c.mutedForeground }]}>Điểm MCQ (Nghe + Đọc)</Text>
        <Text style={[s.resultScore, { color: c.primary }]}>{result.mcqScore}<Text style={[s.resultTotal, { color: c.subtle }]}>/{result.mcqTotal}</Text></Text>
        <View style={[s.resultBar, { backgroundColor: c.muted }]}>
          <View style={[s.resultFill, { backgroundColor: c.primary, width: `${pct}%` as any }]} />
        </View>
        <Text style={[s.resultAiNote, { color: c.subtle }]}>Writing và Speaking đang được AI chấm điểm</Text>
      </View>
      <DepthButton fullWidth onPress={() => router.replace(`/(app)/exam-result/${sessionId}`)} style={{ marginTop: spacing.xl }}>Xem chi tiết kết quả</DepthButton>
      <DepthButton variant="secondary" fullWidth onPress={() => router.replace("/(app)/(tabs)/exams")} style={{ marginTop: spacing.sm }}>Về danh sách đề thi</DepthButton>
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  // Top bar
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.md, borderBottomWidth: 1 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  timerText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  mcqProgress: { flex: 1, textAlign: "center", fontSize: fontSize.sm },
  exitBtn: { padding: 4 },
  // Bottom bar
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1 },
  skillIndicator: { gap: 2 },
  skillLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  skillProgress: { fontSize: fontSize.xs },
  // Device check
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
  dcSkillIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  dcSkillTime: { fontSize: fontSize.xs },
  dcTotalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 2, marginTop: spacing.sm },
  dcTotalText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  dcNoteRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  dcNoteDot: { fontSize: fontSize.xs, lineHeight: 18 },
  dcTimerNote: { fontSize: fontSize.xs, textAlign: "center" },
  // Panels
  panelScroll: { padding: spacing.xl, gap: spacing.lg },
  sectionTabs: { borderBottomWidth: 1, flexGrow: 0 },
  sectionTab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 2 },
  sectionTabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  toggleRow: { flexDirection: "row", borderBottomWidth: 1 },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  toggleText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  // Audio
  audioCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  audioPartLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  playBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full, alignSelf: "flex-start" },
  playBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  audioError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  // Passage
  passageCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  passageTitle: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  passagePara: { fontSize: fontSize.sm, lineHeight: 22 },
  // Prompt / Writing
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  promptText: { fontSize: fontSize.sm, lineHeight: 22 },
  promptMeta: { fontSize: fontSize.xs },
  editorCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, minHeight: 240 },
  editor: { fontSize: fontSize.sm, lineHeight: 22, minHeight: 200 },
  wcBadge: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textAlign: "right", marginTop: spacing.sm },
  // Speaking
  recCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.lg },
  micBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, borderRadius: radius.full },
  micBtnText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  doneRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  doneText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  // MCQ
  qCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  qNum: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  qStem: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 24 },
  options: { gap: spacing.sm },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  optDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalBox: { width: "100%", borderWidth: 2, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  modalIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  modalTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, textAlign: "center" },
  modalMsg: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  modalWarning: { borderRadius: radius.md, padding: spacing.sm },
  modalWarningText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  modalBtns: { flexDirection: "row", gap: spacing.md },
  // Result
  resultIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  resultTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  resultExam: { fontSize: fontSize.sm, marginTop: spacing.xs },
  resultCard: { width: "100%", borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.md, marginTop: spacing.xl },
  resultScoreLabel: { fontSize: fontSize.sm },
  resultScore: { fontSize: 56, fontFamily: fontFamily.extraBold },
  resultTotal: { fontSize: fontSize.xl },
  resultBar: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  resultFill: { height: "100%", borderRadius: 4 },
  resultAiNote: { fontSize: fontSize.xs, textAlign: "center" },
});