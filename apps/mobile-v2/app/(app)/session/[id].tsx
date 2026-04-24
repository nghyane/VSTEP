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

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { useExam } from "@/hooks/use-exams";
import {
  useExamSession, useExamSessionState, useExamTimer,
  type ExamSessionData, type SubmitSessionResult,
} from "@/hooks/use-exam-session";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { ExamVersionMcqItem } from "@/types/api";

const SKILL_COLOR: Record<string, string> = {
  listening: "#1CB0F6", reading: "#7850C8", writing: "#58CC02", speaking: "#FFC800",
};
const SKILL_LABEL: Record<string, string> = {
  listening: "Nghe", reading: "Doc", writing: "Viet", speaking: "Noi",
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
    return <ResultScreen result={submitResult} examTitle={examDetail.exam.title} onBack={() => router.replace("/(app)/(tabs)/exams" as any)} c={c} insets={insets} />;
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

  const es = useExamSessionState(session, listeningItems, readingItems, onSubmitted);
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
          <SpeakingPanel parts={version.speakingParts} done={es.state.speakingDone} onDone={es.markSpeakingDone} c={c} insets={insets} />
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
  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={[s.dcTitle, { color: c.foreground }]}>{exam.title}</Text>
      <Text style={[s.dcSub, { color: c.mutedForeground }]}>Kiểm tra thiết bị trước khi bắt đầu</Text>

      <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
        <Text style={[s.dcCardTitle, { color: c.subtle }]}>CẤU TRÚC BÀI THI</Text>
        {activeSkills.map((sk: string, i: number) => (
          <View key={sk} style={[s.dcSkillRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.borderLight }]}>
            <View style={[s.dcSkillDot, { backgroundColor: SKILL_COLOR[sk] }]} />
            <Text style={[s.dcSkillName, { color: c.foreground }]}>{SKILL_LABEL[sk]}</Text>
          </View>
        ))}
      </View>

      {(hasListening || hasSpeaking) && (
        <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
          <Text style={[s.dcCardTitle, { color: c.subtle }]}>KIỂM TRA ÂM THANH</Text>
          {hasListening && <Text style={[s.dcNote, { color: c.mutedForeground }]}>· Đảm bảo loa/tai nghe hoạt động tốt</Text>}
          {hasSpeaking && <Text style={[s.dcNote, { color: c.mutedForeground }]}>· Đảm bảo micro hoạt động và không bị chặn quyền</Text>}
        </View>
      )}

      <View style={[s.dcCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
        <Text style={[s.dcCardTitle, { color: c.subtle }]}>LƯU Ý</Text>
        {["Sau khi chuyển phần, không thể quay lại.", "Thoát sẽ tự động nộp bài.", "Nghe/Đọc chấm ngay. Viết/Nói AI chấm sau."].map((n) => (
          <Text key={n} style={[s.dcNote, { color: c.mutedForeground }]}>· {n}</Text>
        ))}
      </View>

      <DepthButton fullWidth size="lg" onPress={onStart}>Nhận đề & bắt đầu</DepthButton>
      <Text style={[s.dcTimerNote, { color: c.subtle }]}>Thời gian bắt đầu tính khi bạn bấm nút trên</Text>
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

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {sections.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {sections.map((sec: any, i: number) => (
            <TouchableOpacity key={sec.id} onPress={() => setSectionIdx(i)} style={[s.sectionTab, { borderBottomColor: i === sectionIdx ? "#1CB0F6" : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === sectionIdx ? "#1CB0F6" : c.mutedForeground }]}>Part {sec.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
        <Text style={[s.audioPartLabel, { color: "#1CB0F6" }]}>Part {section.part} · {section.partTitle}</Text>
        <TouchableOpacity onPress={togglePlay} disabled={!sound || !!audioError} style={[s.playBtn, { backgroundColor: audioError ? c.mutedForeground : "#1CB0F6" }]}>
          <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
          <Text style={s.playBtnText}>{playing ? "Tạm dừng" : "Phát audio"}</Text>
        </TouchableOpacity>
        {audioError && <Text style={[s.audioError, { color: c.destructive }]}>{audioError}</Text>}
      </View>
      {section.items.map((item: ExamVersionMcqItem, qi: number) => (
        <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx: number) => onAnswer(item.id, idx)} color="#1CB0F6" c={c} />
      ))}
    </ScrollView>
  );
}

// ── Reading Panel ──

function ReadingPanel({ passages, answers, onAnswer, c, insets }: any) {
  const [passageIdx, setPassageIdx] = useState(0);
  const [showPassage, setShowPassage] = useState(true);
  const passage = passages[passageIdx];
  return (
    <View style={{ flex: 1 }}>
      {passages.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {passages.map((p: any, i: number) => (
            <TouchableOpacity key={p.id} onPress={() => setPassageIdx(i)} style={[s.sectionTab, { borderBottomColor: i === passageIdx ? "#7850C8" : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === passageIdx ? "#7850C8" : c.mutedForeground }]}>Part {p.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.toggleRow, { borderBottomColor: c.borderLight }]}>
        <TouchableOpacity style={[s.toggleBtn, showPassage && { borderBottomColor: "#7850C8", borderBottomWidth: 2 }]} onPress={() => setShowPassage(true)}>
          <Text style={[s.toggleText, { color: showPassage ? "#7850C8" : c.mutedForeground }]}>Đoạn văn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, !showPassage && { borderBottomColor: "#7850C8", borderBottomWidth: 2 }]} onPress={() => setShowPassage(false)}>
          <Text style={[s.toggleText, { color: !showPassage ? "#7850C8" : c.mutedForeground }]}>Câu hỏi</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
        {showPassage ? (
          <View style={[s.passageCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
            <Text style={[s.passageTitle, { color: "#7850C8" }]}>Part {passage.part} · {passage.title}</Text>
            {passage.passage.split(/\n\n+/).map((para: string, i: number) => (
              <Text key={i} style={[s.passagePara, { color: c.foreground }]}>{para}</Text>
            ))}
          </View>
        ) : (
          passage.items.map((item: ExamVersionMcqItem, qi: number) => (
            <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx: number) => onAnswer(item.id, idx)} color="#7850C8" c={c} />
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
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {tasks.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {tasks.map((t: any, i: number) => (
            <TouchableOpacity key={t.id} onPress={() => setTaskIdx(i)} style={[s.sectionTab, { borderBottomColor: i === taskIdx ? "#58CC02" : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === taskIdx ? "#58CC02" : c.mutedForeground }]}>Task {t.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]} keyboardShouldPersistTaps="handled">
        <View style={[s.promptCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
          <Text style={[s.promptLabel, { color: "#58CC02" }]}>Task {task.part} · {task.taskType}</Text>
          <Text style={[s.promptText, { color: c.foreground }]}>{task.prompt}</Text>
          <Text style={[s.promptMeta, { color: c.subtle }]}>Tối thiểu {task.minWords} từ</Text>
        </View>
        <View style={[s.editorCard, { backgroundColor: c.card, borderColor: inRange ? "#58CC02" : c.border, borderBottomColor: inRange ? "#478700" : "#CACACA" }]}>
          <TextInput
            style={[s.editor, { color: c.foreground }]}
            value={text}
            onChangeText={(v) => onAnswer(task.id, v)}
            placeholder="Viết bài của bạn ở đây..."
            placeholderTextColor={c.placeholder}
            multiline
            textAlignVertical="top"
          />
          <Text style={[s.wcBadge, { color: inRange ? "#58CC02" : c.subtle }]}>{wc} / {task.minWords}+ từ</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Speaking Panel ──

function SpeakingPanel({ parts, done, onDone, c, insets }: any) {
  const [partIdx, setPartIdx] = useState(0);
  const part = parts[partIdx];
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRec, setIsRec] = useState(false);

  async function startRec() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec); setIsRec(true);
    } catch { /* permission denied */ }
  }

  async function stopRec() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    setAudioUri(recording.getURI());
    setIsRec(false); setRecording(null);
    onDone(part.id);
  }

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {parts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {parts.map((p: any, i: number) => (
            <TouchableOpacity key={p.id} onPress={() => { setPartIdx(i); setAudioUri(null); setIsRec(false); }}
              style={[s.sectionTab, { borderBottomColor: i === partIdx ? "#FFC800" : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === partIdx ? "#A07800" : c.mutedForeground }]}>Part {p.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.promptCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
        <Text style={[s.promptLabel, { color: "#A07800" }]}>Part {part.part} · {part.type}</Text>
        <Text style={[s.promptMeta, { color: c.mutedForeground }]}>{part.speakingSeconds}s · Ghi âm câu trả lời</Text>
      </View>
      <View style={[s.recCard, { backgroundColor: c.card, borderColor: isRec ? "#FFC800" : c.border, borderBottomColor: isRec ? "#DCAA00" : "#CACACA" }]}>
        <TouchableOpacity onPress={isRec ? stopRec : startRec} disabled={!!audioUri && !isRec}
          style={[s.micBtn, { backgroundColor: audioUri ? c.muted : "#FFC800" }]}>
          <Ionicons name={isRec ? "stop" : "mic"} size={28} color={audioUri ? c.mutedForeground : "#fff"} />
          <Text style={[s.micBtnText, { color: audioUri ? c.mutedForeground : "#fff" }]}>
            {isRec ? "Dừng ghi" : audioUri ? "Đã ghi xong" : "Bắt đầu nói"}
          </Text>
        </TouchableOpacity>
        {done.has(part.id) && (
          <View style={s.doneRow}>
            <Ionicons name="checkmark-circle" size={16} color="#58CC02" />
            <Text style={[s.doneText, { color: "#58CC02" }]}>Đã ghi âm</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── MCQ Card ──

function McqCard({ item, index, selected, onSelect, color, c }: any) {
  return (
    <View style={[s.qCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
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

function ResultScreen({ result, examTitle, onBack, c, insets }: any) {
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
      <DepthButton fullWidth onPress={onBack} style={{ marginTop: spacing.xl }}>Về danh sách đề thi</DepthButton>
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
  dcCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  dcCardTitle: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  dcSkillRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm },
  dcSkillDot: { width: 10, height: 10, borderRadius: 5 },
  dcSkillName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  dcNote: { fontSize: fontSize.xs, lineHeight: 18 },
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