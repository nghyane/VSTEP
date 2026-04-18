import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LessonComplete } from "@/components/LessonComplete";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SupportModeToggle } from "@/components/SupportModeToggle";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import type { Skill } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────

interface McqItem { id: string; question: string; options: [string, string, string, string]; correctIndex: number; explanation: string; }
interface Sentence { id: string; text: string; translation: string; }
interface ExerciseData {
  title: string; description: string; estimatedMinutes: number;
  transcript?: string; passage?: string; keywords?: string[];
  items: McqItem[];
  prompt?: string; minWords?: number;
  sentences?: Sentence[];
}

// ─── Mock data synced with frontend-v2 ────────────────────────────

const LISTENING_DATA: ExerciseData = {
  title: "Hỏi đường đến bưu điện", description: "Part 1 · Hội thoại ngắn", estimatedMinutes: 2,
  transcript: "Excuse me, could you tell me how to get to the nearest post office? Sure. Go straight for two blocks, then turn left at the traffic light. The post office is on your right, next to a bakery. Thank you so much! You're welcome.",
  keywords: ["post office", "two blocks", "turn left", "traffic light", "next to a bakery"],
  items: [
    { id: "l1-d-1", question: "Where is the post office located?", options: ["Next to a supermarket", "On the left side of the bakery", "Next to a bakery", "Across from the traffic light"], correctIndex: 2, explanation: "Người chỉ đường nói: 'on your right, next to a bakery'." },
    { id: "l1-d-2", question: "How many blocks should the person walk straight?", options: ["One block", "Two blocks", "Three blocks", "Four blocks"], correctIndex: 1, explanation: "'Go straight for two blocks'." },
  ],
};

const READING_DATA: ExerciseData = {
  title: "Thông báo nhà hàng", description: "Part 1 · Đọc hiểu ngắn", estimatedMinutes: 3,
  passage: "Welcome to The Green Leaf Restaurant!\n\nWe are pleased to announce our new summer menu, featuring fresh salads, grilled seafood, and tropical smoothies.\n\nOur opening hours have changed: we now open at 10 AM and close at 11 PM, seven days a week.\n\nReservations are recommended for weekend dinners. Please call us at 555-0123 or book online at www.greenleaf.com.",
  keywords: ["summer menu", "opening hours", "reservations", "weekend dinners"],
  items: [
    { id: "r1-m-1", question: "What is the restaurant announcing?", options: ["A new summer menu", "A price increase", "A new location", "Staff hiring"], correctIndex: 0, explanation: "Đoạn văn nói 'new summer menu'." },
    { id: "r1-m-2", question: "What time does the restaurant close?", options: ["10 PM", "11 PM", "9 PM", "Midnight"], correctIndex: 1, explanation: "'close at 11 PM'." },
    { id: "r1-m-3", question: "When are reservations recommended?", options: ["Weekday lunches", "Weekend dinners", "Every day", "Holidays only"], correctIndex: 1, explanation: "'recommended for weekend dinners'." },
  ],
};

const WRITING_DATA: ExerciseData = {
  title: "Viết thư xin lỗi", description: "Part 1 · Viết thư (~120 từ)", estimatedMinutes: 20,
  prompt: "You recently missed an important meeting at work. Write a letter to your manager to:\n- Apologize for missing the meeting\n- Explain the reason\n- Suggest how to make up for it\n\nWrite at least 120 words.",
  minWords: 120, items: [],
};

const SPEAKING_DATA: ExerciseData = {
  title: "Daily routine", description: "A2 · Sơ cấp", estimatedMinutes: 4,
  items: [],
  sentences: [
    { id: "s1", text: "I usually wake up at seven in the morning.", translation: "Tôi thường dậy lúc bảy giờ sáng." },
    { id: "s2", text: "After breakfast, I take the bus to work.", translation: "Sau bữa sáng, tôi bắt xe buýt đi làm." },
    { id: "s3", text: "I have lunch with my colleagues around noon.", translation: "Tôi ăn trưa với đồng nghiệp khoảng giữa trưa." },
    { id: "s4", text: "In the evening, I like to read or watch TV.", translation: "Buổi tối, tôi thích đọc sách hoặc xem TV." },
    { id: "s5", text: "I usually go to bed before eleven.", translation: "Tôi thường đi ngủ trước mười một giờ." },
  ],
};

const DATA_MAP: Record<Skill, ExerciseData> = { listening: LISTENING_DATA, reading: READING_DATA, writing: WRITING_DATA, speaking: SPEAKING_DATA };

// ─── TTS Hook ─────────────────────────────────────────────────────

function useTts() {
  const [playing, setPlaying] = useState(false);
  const speak = useCallback((text: string, rate = 0.9) => {
    Speech.stop();
    setPlaying(true);
    Speech.speak(text, { language: "en-US", rate, onDone: () => setPlaying(false), onError: () => setPlaying(false) });
  }, []);
  const stop = useCallback(() => { Speech.stop(); setPlaying(false); }, []);
  useEffect(() => () => { Speech.stop(); }, []);
  return { playing, speak, stop };
}

// ─── Mic Recorder Hook ───────────────────────────────────────────

function useRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const start = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
      setUri(null);
    } catch { /* permission denied or error */ }
  }, []);

  const stop = useCallback(async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      setUri(recording.getURI());
    } catch { /* ignore */ }
    setRecording(null);
    setIsRecording(false);
  }, [recording]);

  const playback = useCallback(async () => {
    if (!uri) return;
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
  }, [uri]);

  return { isRecording, uri, start, stop, playback };
}

// ─── Screen Router ────────────────────────────────────────────────

export default function SkillPracticeScreen() {
  const { skill: p } = useLocalSearchParams<{ skill: string }>();
  const skill = p as Skill;
  const data = DATA_MAP[skill];
  if (!data) return null;
  if (skill === "writing") return <WritingSession data={data} skill={skill} />;
  if (skill === "speaking") return <SpeakingSession data={data} skill={skill} />;
  return <McqSession data={data} skill={skill} />;
}

// ─── MCQ Session (Listening / Reading) ────────────────────────────

function McqSession({ data, skill }: { data: ExerciseData; skill: Skill }) {
  const c = useThemeColors();
  const router = useRouter();
  const color = useSkillColor(skill);
  const tts = useTts();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const startTime = useRef(Date.now());
  const score = submitted ? data.items.filter((i) => answers[i.id] === i.correctIndex).length : 0;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={data.title} />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.metaRow}>
          <Text style={[s.skillLabel, { color }]}>{data.description}</Text>
          <Text style={[s.metaText, { color: c.mutedForeground }]}>{data.items.length} câu · {data.estimatedMinutes} phút</Text>
        </View>

        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
          <View style={[s.progressFill, { backgroundColor: color, width: `${Math.round((Object.keys(answers).length / data.items.length) * 100)}%` }]} />
        </View>
        <Text style={[s.progressText, { color: c.mutedForeground }]}>{Object.keys(answers).length}/{data.items.length} câu đã trả lời</Text>

        {/* Audio player for listening */}
        {skill === "listening" && data.transcript && (
          <View style={[s.audioBox, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.audioHeader}>
              <Ionicons name="volume-high" size={16} color={c.foreground} />
              <Text style={[s.audioLabel, { color: c.foreground }]}>Nghe bài</Text>
            </View>
            <HapticTouchable style={[s.playBtn, { backgroundColor: color }]} onPress={() => tts.playing ? tts.stop() : tts.speak(data.transcript!)}>
              <Ionicons name={tts.playing ? "pause" : "play"} size={20} color="#fff" />
            </HapticTouchable>
            {supportMode && <Text style={[s.transcriptText, { color: c.mutedForeground }]}>{data.transcript}</Text>}
          </View>
        )}

        {/* Passage for reading */}
        {skill === "reading" && data.passage && (
          <View style={[s.passageBox, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.passageText, { color: c.foreground }]}>{data.passage}</Text>
          </View>
        )}

        <View style={s.supportRow}>
          <SupportModeToggle enabled={supportMode} onToggle={setSupportMode} />
        </View>

        {supportMode && data.keywords && (
          <View style={s.kwRow}>
            {data.keywords.map((kw) => (
              <View key={kw} style={[s.kwChip, { backgroundColor: color + "15" }]}>
                <Text style={[s.kwText, { color }]}>{kw}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Questions */}
        {data.items.map((item, idx) => (
          <View key={item.id} style={s.qBlock}>
            <Text style={[s.qNum, { color }]}>{idx + 1}.</Text>
            <Text style={[s.qText, { color: c.foreground }]}>{item.question}</Text>
            {item.options.map((opt, i) => {
              const sel = answers[item.id] === i;
              const ok = submitted && i === item.correctIndex;
              const bad = submitted && sel && i !== item.correctIndex;
              return (
                <HapticTouchable key={opt} style={[s.opt, { borderColor: ok ? c.success : bad ? c.destructive : sel ? color : c.border }]} onPress={() => !submitted && setAnswers((p) => ({ ...p, [item.id]: i }))} disabled={submitted}>
                  <View style={[s.optDot, { backgroundColor: ok ? c.success : bad ? c.destructive : sel ? color : c.muted }]}>
                    <Text style={{ color: (sel || ok || bad) ? "#fff" : c.mutedForeground, fontSize: 11, fontFamily: fontFamily.bold }}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[s.optLabel, { color: c.foreground }]}>{opt}</Text>
                </HapticTouchable>
              );
            })}
            {submitted && <View style={[s.expl, { backgroundColor: answers[item.id] === item.correctIndex ? c.success + "0D" : c.destructive + "0D" }]}><Text style={[s.explT, { color: c.foreground }]}>{item.explanation}</Text></View>}
          </View>
        ))}

        {submitted ? (
          <LessonComplete
            score={score}
            total={data.items.length}
            durationSeconds={Math.floor((Date.now() - startTime.current) / 1000)}
            onNext={() => router.back()}
            nextLabel="Quay lại"
          />
        ) : (
          <HapticTouchable style={[s.actionBtn, { backgroundColor: color }]} onPress={() => setSubmitted(true)}>
            <Text style={s.actionBtnT}>Nộp bài</Text>
          </HapticTouchable>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Writing Session ──────────────────────────────────────────────

function WritingSession({ data, skill }: { data: ExerciseData; skill: Skill }) {
  const c = useThemeColors();
  const router = useRouter();
  const color = useSkillColor(skill);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"write" | "study">("write");
  const [supportLevel, setSupportLevel] = useState<"off" | "hints" | "outline" | "template">("off");
  const startTime = useRef(Date.now());
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const minW = data.minWords ?? 100;

  const SUPPORT_LEVELS = [
    { key: "off" as const, label: "Tắt", desc: "Tự viết hoàn toàn" },
    { key: "hints" as const, label: "Gợi ý", desc: "Từ khóa + câu mở đầu" },
    { key: "outline" as const, label: "Dàn ý", desc: "Dàn ý 3 đoạn + bài mẫu" },
    { key: "template" as const, label: "Mẫu", desc: "Khung bài có sẵn" },
  ];

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={data.title} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[s.skillLabel, { color }]}>{data.description}</Text>
        <View style={[s.passageBox, { backgroundColor: c.muted, borderColor: c.border }]}>
          <Text style={[s.promptLabel, { color: c.mutedForeground }]}>ĐỀ BÀI</Text>
          <Text style={[s.passageText, { color: c.foreground }]}>{data.prompt}</Text>
        </View>

        {/* Support level picker */}
        <View style={s.supportRow}>
          <HapticTouchable
            style={[s.supportBtn, { borderColor: supportLevel !== "off" ? color + "4D" : c.border, backgroundColor: supportLevel !== "off" ? color + "0D" : "transparent" }]}
            onPress={() => {
              const keys = SUPPORT_LEVELS.map((l) => l.key);
              const idx = keys.indexOf(supportLevel);
              setSupportLevel(keys[(idx + 1) % keys.length]);
            }}
          >
            <Ionicons name="bulb-outline" size={14} color={supportLevel !== "off" ? color : c.mutedForeground} />
            <Text style={{ color: supportLevel !== "off" ? color : c.mutedForeground, fontSize: fontSize.xs, fontFamily: fontFamily.medium }}>
              {SUPPORT_LEVELS.find((l) => l.key === supportLevel)?.label ?? "Tắt"}
            </Text>
          </HapticTouchable>
        </View>

        {/* Support content */}
        {supportLevel === "hints" && (
          <View style={[s.supportCard, { borderColor: c.border }]}>
            <Text style={[s.supportCardTitle, { color: c.foreground }]}>Từ khóa gợi ý</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>apologize, explain, make up for, sincerely, inconvenience</Text>
            <Text style={[s.supportCardTitle, { color: c.foreground, marginTop: spacing.sm }]}>Câu mở đầu</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>• I am writing to apologize for...</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>• The reason for my absence was...</Text>
          </View>
        )}
        {supportLevel === "outline" && (
          <View style={[s.supportCard, { borderColor: c.border }]}>
            <Text style={[s.supportCardTitle, { color: c.foreground }]}>Dàn ý</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>1. Mở đầu: Lý do viết thư, xin lỗi</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>2. Nội dung: Giải thích lý do, hậu quả</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>3. Kết: Đề xuất khắc phục, mong được thông cảm</Text>
          </View>
        )}
        {supportLevel === "template" && (
          <View style={[s.supportCard, { borderColor: c.border }]}>
            <Text style={[s.supportCardTitle, { color: c.foreground }]}>Khung bài mẫu</Text>
            <Text style={[s.supportCardText, { color: c.mutedForeground }]}>Dear [name],{"\n\n"}I am writing to sincerely apologize for [reason].{"\n\n"}The reason was [explanation]. I understand this caused [consequence].{"\n\n"}To make up for this, I would like to [suggestion].{"\n\n"}Yours sincerely,{"\n"}[Your name]</Text>
          </View>
        )}

        {!submitted ? (
          <>
            {/* Write / Study toggle */}
            <View style={s.modeToggle}>
              <HapticTouchable style={[s.modeBtn, mode === "write" && { backgroundColor: color + "15" }]} onPress={() => setMode("write")}>
                <Ionicons name="create-outline" size={16} color={mode === "write" ? color : c.mutedForeground} />
                <Text style={[s.modeBtnText, { color: mode === "write" ? color : c.mutedForeground }]}>Viết bài</Text>
              </HapticTouchable>
              <HapticTouchable style={[s.modeBtn, mode === "study" && { backgroundColor: color + "15" }]} onPress={() => setMode("study")}>
                <Ionicons name="book-outline" size={16} color={mode === "study" ? color : c.mutedForeground} />
                <Text style={[s.modeBtnText, { color: mode === "study" ? color : c.mutedForeground }]}>Bài mẫu</Text>
              </HapticTouchable>
            </View>

            {mode === "write" ? (
              <>
                <TextInput style={[s.writingInput, { borderColor: c.border, color: c.foreground, backgroundColor: c.card }]} multiline placeholder="Viết bài tại đây..." placeholderTextColor={c.mutedForeground} value={text} onChangeText={setText} textAlignVertical="top" />
                {/* Word count milestones */}
                <View style={s.wcBar}>
                  <View style={[s.wcTrack, { backgroundColor: c.muted }]}>
                    <View style={[s.wcFill, { backgroundColor: wc >= minW ? c.success : color, width: `${Math.min(100, (wc / (minW * 1.4)) * 100)}%` }]} />
                  </View>
                  <View style={s.wcMarkers}>
                    <Text style={[s.wcMarker, { color: wc >= minW ? c.success : c.mutedForeground }]}>{minW} từ (tối thiểu)</Text>
                    <Text style={[s.wcCurrent, { color: wc >= minW ? c.success : c.foreground }]}>{wc} từ</Text>
                  </View>
                </View>
                <HapticTouchable style={[s.actionBtn, { backgroundColor: color, opacity: wc > 0 ? 1 : 0.5 }]} onPress={() => setSubmitted(true)} disabled={wc === 0}>
                  <Text style={s.actionBtnT}>Nộp bài</Text>
                </HapticTouchable>
              </>
            ) : (
              <View style={[s.sampleCard, { backgroundColor: c.muted + "50" }]}>
                <Text style={[s.sampleLabel, { color: c.mutedForeground }]}>BÀI MẪU THAM KHẢO</Text>
                <Text style={[s.sampleText, { color: c.foreground }]}>Dear Minh,{"\n"}{"\n"}I am writing to sincerely apologize for not being able to attend your birthday party last Saturday. I feel terrible about missing such an important occasion.{"\n"}{"\n"}The reason for my absence was a family emergency. My grandmother was suddenly taken to the hospital, and I had to accompany my parents to take care of her. It all happened so quickly that I did not have time to inform you beforehand.{"\n"}{"\n"}To make it up to you, I would like to invite you to dinner at your favorite restaurant this weekend. It would be my treat, and we can celebrate your birthday together.{"\n"}{"\n"}Once again, I am truly sorry for missing your party. I hope you had a wonderful time with everyone.{"\n"}{"\n"}Best wishes,{"\n"}[Your name]</Text>
              </View>
            )}
          </>
        ) : (
          <LessonComplete
            score={wc}
            total={minW}
            durationSeconds={Math.floor((Date.now() - startTime.current) / 1000)}
            onNext={() => router.back()}
            nextLabel="Quay lại"
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Speaking Session (Shadowing with TTS + Mic) ──────────────────

function SpeakingSession({ data, skill }: { data: ExerciseData; skill: Skill }) {
  const c = useThemeColors();
  const router = useRouter();
  const color = useSkillColor(skill);
  const tts = useTts();
  const recorder = useRecorder();
  const sentences = data.sentences ?? [];
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const current = sentences[idx];
  const allDone = done.size >= sentences.length;

  const handleRecord = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
      if (current) setDone((p) => new Set([...p, current.id]));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await recorder.start();
    }
  }, [recorder, current]);

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={data.title} />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.metaRow}>
          <Text style={[s.skillLabel, { color }]}>{data.description}</Text>
          <Text style={[s.metaText, { color: c.mutedForeground }]}>{sentences.length} câu · {data.estimatedMinutes} phút</Text>
        </View>

        {!allDone && current ? (
          <View style={{ gap: spacing.lg }}>
            <Text style={[s.counter, { color: c.mutedForeground }]}>CÂU {idx + 1} / {sentences.length}</Text>

            {/* Model sentence */}
            <View style={[s.sentenceBox, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[s.promptLabel, { color: c.mutedForeground }]}>CÂU MẪU</Text>
              <Text style={[s.sentenceText, { color: c.foreground }]}>{current.text}</Text>
              <Text style={[s.sentenceTrans, { color: c.mutedForeground }]}>{current.translation}</Text>
            </View>

            {/* Listen button */}
            <View style={[s.audioBox, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={s.audioHeader}>
                <Ionicons name="volume-high" size={16} color={c.foreground} />
                <Text style={[s.audioLabel, { color: c.foreground }]}>Nghe câu</Text>
              </View>
              <HapticTouchable style={[s.playBtn, { backgroundColor: color }]} onPress={() => tts.playing ? tts.stop() : tts.speak(current.text)}>
                <Ionicons name={tts.playing ? "pause" : "play"} size={20} color="#fff" />
              </HapticTouchable>
            </View>

            {/* Record button */}
            <HapticTouchable style={[s.recordBtn, { backgroundColor: recorder.isRecording ? c.destructive : color }]} onPress={handleRecord}>
              <Ionicons name={recorder.isRecording ? "stop" : "mic"} size={22} color="#fff" />
              <Text style={s.recordBtnT}>{recorder.isRecording ? "Dừng ghi" : "Bắt đầu nhại"}</Text>
            </HapticTouchable>
            <Text style={[s.recordHint, { color: c.mutedForeground }]}>Nghe mẫu vài lần, sau đó bấm để nhại theo</Text>

            {/* Playback */}
            {recorder.uri && !recorder.isRecording && (
              <View style={[s.playbackRow, { borderColor: c.border }]}>
                <Text style={[s.playbackLabel, { color: c.foreground }]}>Bản ghi của bạn</Text>
                <HapticTouchable style={[s.playbackBtn, { backgroundColor: c.muted }]} onPress={recorder.playback}>
                  <Ionicons name="play" size={16} color={color} />
                  <Text style={[s.playbackBtnT, { color }]}>Nghe lại</Text>
                </HapticTouchable>
              </View>
            )}

            {/* Nav pills */}
            <View style={s.navRow}>
              {sentences.map((_, i) => (
                <HapticTouchable key={i} style={[s.navPill, { backgroundColor: i === idx ? color : done.has(sentences[i].id) ? c.success : c.muted }]} onPress={() => setIdx(i)}>
                  <Text style={{ color: i === idx || done.has(sentences[i].id) ? "#fff" : c.mutedForeground, fontSize: 12, fontFamily: fontFamily.bold }}>{i + 1}</Text>
                </HapticTouchable>
              ))}
            </View>
          </View>
        ) : (
          <LessonComplete
            score={done.size}
            total={sentences.length}
            durationSeconds={0}
            onNext={() => router.back()}
            nextLabel="Quay lại"
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.xl },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, textTransform: "uppercase", letterSpacing: 1 },
  metaText: { fontSize: fontSize.xs },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: spacing.md },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, marginTop: 4, textAlign: "right" },
  supportRow: { flexDirection: "row", justifyContent: "flex-end", marginVertical: spacing.sm },
  supportBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  supportCard: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.base, gap: spacing.xs, marginBottom: spacing.sm },
  supportCardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  supportCardText: { fontSize: fontSize.xs, lineHeight: 18 },
  // Audio
  audioBox: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, marginTop: spacing.base },
  audioHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  audioLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  transcriptText: { fontSize: fontSize.sm, lineHeight: 22, marginTop: spacing.sm },
  // Passage
  passageBox: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.base },
  passageText: { fontSize: fontSize.sm, lineHeight: 22 },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm, },
  // Keywords
  kwRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  kwChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  kwText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  // MCQ
  qBlock: { marginTop: spacing.xl, gap: spacing.sm },
  qNum: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  qText: { fontSize: fontSize.base, fontFamily: fontFamily.medium },
  opt: { flexDirection: "row", alignItems: "center", gap: spacing.md, ...depthNeutral, borderRadius: radius.lg, padding: spacing.md },
  optDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  optLabel: { flex: 1, fontSize: fontSize.sm },
  expl: { padding: spacing.md, borderRadius: radius.lg },
  explT: { fontSize: fontSize.sm, lineHeight: 20 },
  resultCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xl },
  resultScore: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  resultPct: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  // Writing
  writingInput: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.base, minHeight: 200, fontSize: fontSize.sm, lineHeight: 22, marginTop: spacing.base },
  modeToggle: { flexDirection: "row", gap: 8, marginVertical: 8 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  modeBtnText: { fontSize: 14, fontFamily: "Nunito-SemiBold" },
  wcBar: { marginTop: 8 },
  wcTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  wcFill: { height: "100%", borderRadius: 3 },
  wcMarkers: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  wcMarker: { fontSize: 11 },
  wcCurrent: { fontSize: 11, fontFamily: "Nunito-Bold" },
  sampleCard: { borderRadius: 16, padding: 16, marginTop: 8 },
  sampleLabel: { fontSize: 11, fontFamily: "Nunito-Bold", letterSpacing: 1, marginBottom: 8 },
  sampleText: { fontSize: 14, lineHeight: 22 },
  wcText: { fontSize: fontSize.xs, textAlign: "right", marginTop: spacing.xs },
  // Speaking
  counter: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, letterSpacing: 1 },
  sentenceBox: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  sentenceText: { fontSize: fontSize.lg, fontFamily: fontFamily.medium },
  sentenceTrans: { fontSize: fontSize.sm, fontStyle: "italic" },
  recordBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.base, borderRadius: radius.full },
  recordBtnT: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
  recordHint: { fontSize: fontSize.xs, textAlign: "center" },
  playbackRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.md },
  playbackLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  playbackBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.lg },
  playbackBtnT: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  navRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  navPill: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  // Shared
  actionBtn: { alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.xl },
  actionBtnT: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
  doneWrap: { alignItems: "center", paddingVertical: spacing["2xl"], gap: spacing.md },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
});
