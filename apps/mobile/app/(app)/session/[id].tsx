import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

// ─── Types & mock data ────────────────────────────────────────────

type McqItem = { id: string; question: string; options: string[] };
type WritingTask = { id: string; prompt: string; minWords: number };
type SpeakingPart = { id: string; title: string; prompt: string };

interface MockSession {
  listening: McqItem[];
  reading: McqItem[];
  writing: WritingTask[];
  speaking: SpeakingPart[];
  durationMinutes: number;
}

const MOCK_SESSION: MockSession = {
  listening: [
    { id: "l1", question: "What is the main topic of the announcement?", options: ["A. A new policy", "B. A schedule change", "C. A holiday event", "D. A staff meeting"] },
    { id: "l2", question: "When will the event take place?", options: ["A. Monday", "B. Tuesday", "C. Wednesday", "D. Thursday"] },
    { id: "l3", question: "Who is the speaker?", options: ["A. A teacher", "B. A manager", "C. A student", "D. A doctor"] },
  ],
  reading: [
    { id: "r1", question: "What is the passage mainly about?", options: ["A. Climate change", "B. Education reform", "C. Technology trends", "D. Health benefits"] },
    { id: "r2", question: "According to the passage, what is the main cause?", options: ["A. Population growth", "B. Industrial pollution", "C. Deforestation", "D. Urbanization"] },
    { id: "r3", question: "The word 'significant' in line 5 is closest in meaning to:", options: ["A. important", "B. small", "C. unusual", "D. temporary"] },
  ],
  writing: [
    { id: "w1", prompt: "Write a letter to your friend about your recent holiday. You should write at least 120 words.", minWords: 120 },
  ],
  speaking: [
    { id: "s1", title: "Phần 1", prompt: "Describe your hometown. What do you like most about it?" },
    { id: "s2", title: "Phần 2", prompt: "Discuss the advantages and disadvantages of working from home." },
  ],
  durationMinutes: 150,
};

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_VN: Record<Skill, string> = { listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói" };

// ─── Timer ────────────────────────────────────────────────────────

function useCountdown(minutes: number, started: boolean) {
  const [remaining, setRemaining] = useState(minutes * 60);
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [started]);
  return remaining;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Main ─────────────────────────────────────────────────────────

export default function FocusedExamRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = MOCK_SESSION;
  const activeSkills = SKILL_ORDER.filter((sk) => {
    if (sk === "listening") return session.listening.length > 0;
    if (sk === "reading") return session.reading.length > 0;
    if (sk === "writing") return session.writing.length > 0;
    if (sk === "speaking") return session.speaking.length > 0;
    return false;
  });

  const [deviceChecked, setDeviceChecked] = useState(false);
  const [skillIdx, setSkillIdx] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [writingTexts, setWritingTexts] = useState<Record<string, string>>({});
  const [speakingDone, setSpeakingDone] = useState<Set<string>>(new Set());

  const remaining = useCountdown(session.durationMinutes, deviceChecked);
  const currentSkill = activeSkills[skillIdx];
  const isLast = skillIdx >= activeSkills.length - 1;

  const totalItems = session.listening.length + session.reading.length + session.writing.length + session.speaking.length;
  const answeredCount = Object.keys(mcqAnswers).length + Object.values(writingTexts).filter((t) => t.trim().length > 0).length + speakingDone.size;

  const handleNext = useCallback(() => {
    const nextSkill = activeSkills[skillIdx + 1];
    Alert.alert(
      `Chuyển sang phần ${nextSkill ? SKILL_VN[nextSkill] : ""}?`,
      "Sau khi chuyển, bạn không thể quay lại phần trước.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Chuyển phần", onPress: () => setSkillIdx((i) => i + 1) },
      ],
    );
  }, [skillIdx, activeSkills]);

  const handleSubmit = useCallback(() => {
    Alert.alert(
      "Nộp bài?",
      answeredCount < totalItems
        ? `Bạn chưa trả lời hết (${totalItems - answeredCount} câu còn trống). Nộp bài ngay?`
        : "Sau khi nộp, bạn không thể chỉnh sửa.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Nộp bài", onPress: () => router.replace(`/(app)/exam-result/${id}`) },
      ],
    );
  }, [answeredCount, totalItems, router]);

  // ─── Device check ───────────────────────────────────────────────

  if (!deviceChecked) {
    return (
      <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <View style={styles.deviceCheck}>
          <Ionicons name="headset-outline" size={48} color={c.primary} />
          <Text style={[styles.dcTitle, { color: c.foreground }]}>Kiểm tra thiết bị</Text>
          <Text style={[styles.dcDesc, { color: c.mutedForeground }]}>
            Đảm bảo loa và micro hoạt động tốt trước khi bắt đầu.
          </Text>

          <View style={[styles.dcInfoCard, { backgroundColor: c.muted }]}>
            <Text style={[styles.dcInfoTitle, { color: c.foreground }]}>Thông tin đề thi</Text>
            <Text style={[styles.dcInfoRow, { color: c.mutedForeground }]}>⏱ {session.durationMinutes} phút</Text>
            <Text style={[styles.dcInfoRow, { color: c.mutedForeground }]}>{activeSkills.map((s) => SKILL_VN[s]).join(" · ")}</Text>
            <Text style={[styles.dcInfoRow, { color: c.mutedForeground }]}>{totalItems} câu hỏi</Text>
          </View>

          <HapticTouchable
            style={[styles.dcBtn, { backgroundColor: c.primary }]}
            onPress={() => setDeviceChecked(true)}
          >
            <Ionicons name="play" size={18} color={c.primaryForeground} />
            <Text style={[styles.dcBtnText, { color: c.primaryForeground }]}>Bắt đầu thi</Text>
          </HapticTouchable>

          <HapticTouchable onPress={() => router.back()}>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>← Quay lại</Text>
          </HapticTouchable>
        </View>
      </View>
    );
  }

  // ─── Exam room ──────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border, paddingTop: insets.top + 4 }]}>
        <View style={[styles.timerPill, remaining <= 300 ? { backgroundColor: c.destructive + "18" } : { backgroundColor: c.muted }]}>
          <Ionicons name="time-outline" size={14} color={remaining <= 300 ? c.destructive : c.foreground} />
          <Text style={[styles.timerText, { color: remaining <= 300 ? c.destructive : c.foreground }]}>{formatTime(remaining)}</Text>
        </View>

        <Text style={[styles.answeredText, { color: c.mutedForeground }]}>
          <Text style={{ fontFamily: fontFamily.bold, color: c.foreground }}>{answeredCount}</Text>/{totalItems} đã trả lời
        </Text>

        <HapticTouchable onPress={() => Alert.alert("Thoát?", "Bạn sẽ mất tiến trình.", [{ text: "Ở lại" }, { text: "Thoát", style: "destructive", onPress: () => router.replace("/(app)/(tabs)/exams") }])}>
          <Ionicons name="close" size={22} color={c.mutedForeground} />
        </HapticTouchable>
      </View>

      {/* Body */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {currentSkill === "listening" && <McqPanel items={session.listening} answers={mcqAnswers} onAnswer={(id, val) => setMcqAnswers((p) => ({ ...p, [id]: val }))} />}
        {currentSkill === "reading" && <McqPanel items={session.reading} answers={mcqAnswers} onAnswer={(id, val) => setMcqAnswers((p) => ({ ...p, [id]: val }))} />}
        {currentSkill === "writing" && <WritingPanel tasks={session.writing} texts={writingTexts} onChange={(id, val) => setWritingTexts((p) => ({ ...p, [id]: val }))} />}
        {currentSkill === "speaking" && <SpeakingPanel parts={session.speaking} done={speakingDone} onDone={(id) => setSpeakingDone((p) => new Set([...p, id]))} />}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={{ width: 80 }} />
        <View style={styles.footerCenter}>
          <Text style={[styles.footerSkill, { color: c.foreground }]}>{currentSkill ? SKILL_VN[currentSkill] : ""}</Text>
          <Text style={[styles.footerIdx, { color: c.mutedForeground }]}>({skillIdx + 1}/{activeSkills.length})</Text>
        </View>
        {isLast ? (
          <HapticTouchable style={[styles.footerBtn, { backgroundColor: c.primary }]} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={16} color={c.primaryForeground} />
            <Text style={[styles.footerBtnText, { color: c.primaryForeground }]}>Nộp bài</Text>
          </HapticTouchable>
        ) : (
          <HapticTouchable style={[styles.footerBtn, { borderWidth: 1, borderColor: c.border }]} onPress={handleNext}>
            <Text style={[styles.footerBtnText, { color: c.foreground }]}>Tiếp →</Text>
          </HapticTouchable>
        )}
      </View>
    </View>
  );
}

// ─── MCQ Panel ────────────────────────────────────────────────────

function McqPanel({ items, answers, onAnswer }: { items: McqItem[]; answers: Record<string, string>; onAnswer: (id: string, val: string) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.xl }}>
      {items.map((item, idx) => (
        <View key={item.id} style={{ gap: spacing.sm }}>
          <Text style={[styles.qNum, { color: c.foreground }]}>Câu {idx + 1}</Text>
          <Text style={[styles.qText, { color: c.foreground }]}>{item.question}</Text>
          {item.options.map((opt) => {
            const letter = opt.charAt(0);
            const selected = answers[item.id] === letter;
            return (
              <HapticTouchable
                key={opt}
                style={[styles.optionRow, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary + "0D" : c.card }]}
                onPress={() => onAnswer(item.id, letter)}
              >
                <View style={[styles.optionDot, selected ? { backgroundColor: c.primary, borderColor: c.primary } : { borderColor: c.border }]}>
                  {selected && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={[styles.optionText, { color: c.foreground }]}>{opt}</Text>
              </HapticTouchable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Writing Panel ────────────────────────────────────────────────

function WritingPanel({ tasks, texts, onChange }: { tasks: WritingTask[]; texts: Record<string, string>; onChange: (id: string, val: string) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.xl }}>
      {tasks.map((task) => {
        const text = texts[task.id] ?? "";
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        return (
          <View key={task.id} style={{ gap: spacing.md }}>
            <View style={[styles.promptCard, { backgroundColor: c.muted }]}>
              <Text style={[styles.promptLabel, { color: c.mutedForeground }]}>ĐỀ BÀI</Text>
              <Text style={[styles.promptText, { color: c.foreground }]}>{task.prompt}</Text>
            </View>
            <TextInput
              style={[styles.writingInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
              multiline
              placeholder="Viết bài tại đây..."
              placeholderTextColor={c.mutedForeground}
              value={text}
              onChangeText={(v) => onChange(task.id, v)}
              textAlignVertical="top"
            />
            <Text style={[styles.wordCount, { color: wordCount >= task.minWords ? c.success : c.mutedForeground }]}>
              {wordCount}/{task.minWords} từ
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Speaking Panel ───────────────────────────────────────────────

function SpeakingPanel({ parts, done, onDone }: { parts: SpeakingPart[]; done: Set<string>; onDone: (id: string) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.xl }}>
      {parts.map((part) => {
        const isDone = done.has(part.id);
        return (
          <View key={part.id} style={[styles.speakingCard, { borderColor: c.border, backgroundColor: c.card }]}>
            <Text style={[styles.speakingTitle, { color: c.foreground }]}>{part.title}</Text>
            <Text style={[styles.speakingPrompt, { color: c.mutedForeground }]}>{part.prompt}</Text>
            <HapticTouchable
              style={[styles.speakingBtn, isDone ? { backgroundColor: c.success } : { backgroundColor: c.primary }]}
              onPress={() => onDone(part.id)}
              disabled={isDone}
            >
              <Ionicons name={isDone ? "checkmark" : "mic"} size={16} color="#fff" />
              <Text style={styles.speakingBtnText}>{isDone ? "Đã hoàn thành" : "Bắt đầu nói"}</Text>
            </HapticTouchable>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Device check
  deviceCheck: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  dcTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  dcDesc: { fontSize: fontSize.sm, textAlign: "center", maxWidth: 280 },
  dcInfoCard: { width: "100%", borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.base },
  dcInfoTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  dcInfoRow: { fontSize: fontSize.sm },
  dcBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing["2xl"], borderRadius: radius.lg, marginTop: spacing.base },
  dcBtnText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingBottom: 8, borderBottomWidth: 2 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  timerText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, fontVariant: ["tabular-nums"] },
  answeredText: { fontSize: fontSize.sm },
  // Body
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl, paddingBottom: 100 },
  // Footer
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingTop: 8, borderTopWidth: 2 },
  footerCenter: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerSkill: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  footerIdx: { fontSize: fontSize.xs },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.sm },
  footerBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  // MCQ
  qNum: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  qText: { fontSize: fontSize.base, fontFamily: fontFamily.medium },
  optionRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  optionDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1, fontSize: fontSize.sm },
  // Writing
  promptCard: { borderRadius: radius.xl, padding: spacing.lg },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm },
  promptText: { fontSize: fontSize.sm, lineHeight: 22 },
  writingInput: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, minHeight: 200, fontSize: fontSize.sm, lineHeight: 22 },
  wordCount: { fontSize: fontSize.xs, textAlign: "right" },
  // Speaking
  speakingCard: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  speakingTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  speakingPrompt: { fontSize: fontSize.sm, lineHeight: 20 },
  speakingBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.sm },
  speakingBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
});
