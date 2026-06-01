import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";

// ─── Mock data ────────────────────────────────────────────────────

interface Example { en: string; vi: string; note?: string; }
interface Mistake { wrong: string; correct: string; explanation: string; }
interface McqEx { kind: "mcq"; id: string; prompt: string; options: string[]; correctIndex: number; explanation: string; }
interface FillEx { kind: "fill-blank"; id: string; template: string; acceptedAnswers: string[]; explanation: string; }
interface ErrorCorrectionEx { kind: "error-correction"; id: string; sentence: string; correction: string; explanation: string; }
interface RewriteEx { kind: "rewrite"; id: string; instruction: string; original: string; acceptedAnswers: string[]; explanation: string; }
type Exercise = McqEx | FillEx | ErrorCorrectionEx | RewriteEx;

interface VstepTip { task: string; tip: string; example: string; }

interface PointData {
  name: string; vietnameseName: string; summary: string;
  whenToUse: string; structures: string[]; examples: Example[];
  commonMistakes: Mistake[]; exercises: Exercise[]; vstepTips: VstepTip[];
}

const ALL_POINTS: Record<string, PointData> = {
  "present-simple": {
    name: "Present Simple", vietnameseName: "Thì hiện tại đơn",
    summary: "Diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định.",
    whenToUse: "Dùng cho thói quen hằng ngày, sự thật khoa học, lịch cố định.",
    structures: ["S + V(s/es) + O", "S + do/does + not + V", "Do/Does + S + V ?"],
    examples: [
      { en: "She plays tennis every Sunday.", vi: "Cô ấy chơi tennis mỗi Chủ nhật." },
      { en: "Water boils at 100°C.", vi: "Nước sôi ở 100°C.", note: "sự thật" },
      { en: "The train leaves at 7 a.m.", vi: "Tàu rời ga lúc 7 giờ sáng.", note: "lịch cố định" },
    ],
    commonMistakes: [
      { wrong: "She go to school every day.", correct: "She goes to school every day.", explanation: "Ngôi thứ 3 số ít phải thêm -s/-es." },
      { wrong: "He don't like spicy food.", correct: "He doesn't like spicy food.", explanation: "Phủ định ngôi thứ 3 dùng doesn't." },
    ],
    vstepTips: [
      { task: "SP1", tip: "Dùng hiện tại đơn khi nói về thói quen, sở thích cá nhân.", example: "I usually spend my weekends reading books." },
      { task: "WT1", tip: "Trong email/thư, dùng hiện tại đơn để nêu lý do viết thư.", example: "I am writing to inquire about the training programme." },
    ],
    exercises: [
      { kind: "mcq", id: "ps-1", prompt: "She ___ to work by bus every day.", options: ["go", "goes", "going", "gone"], correctIndex: 1, explanation: "Ngôi thứ 3 số ít → goes." },
      { kind: "mcq", id: "ps-2", prompt: "They ___ coffee in the morning.", options: ["drinks", "drink", "drinking", "drank"], correctIndex: 1, explanation: "They → không thêm -s." },
      { kind: "fill-blank", id: "ps-3", template: "The sun ___ in the east.", acceptedAnswers: ["rises"], explanation: "Sự thật hiển nhiên → rises." },
      { kind: "error-correction", id: "ps-4", sentence: "She go to school every day.", correction: "She goes to school every day.", explanation: "Ngôi thứ 3 số ít phải thêm -s/-es." },
      { kind: "rewrite", id: "ps-5", instruction: "Viết lại câu ở dạng phủ định.", original: "He likes spicy food.", acceptedAnswers: ["He doesn't like spicy food.", "He does not like spicy food."], explanation: "Phủ định ngôi thứ 3: doesn't + V nguyên mẫu." },
    ],
  },
  "present-perfect": {
    name: "Present Perfect", vietnameseName: "Thì hiện tại hoàn thành",
    summary: "Hành động xảy ra trong quá khứ nhưng còn ảnh hưởng đến hiện tại.",
    whenToUse: "Dùng khi nói về kinh nghiệm, hành động vừa xảy ra, hoặc hành động kéo dài đến hiện tại.",
    structures: ["S + have/has + V3/ed", "S + have/has + not + V3/ed", "Have/Has + S + V3/ed ?"],
    examples: [
      { en: "I have visited Paris twice.", vi: "Tôi đã đến Paris hai lần.", note: "kinh nghiệm" },
      { en: "She has just finished her homework.", vi: "Cô ấy vừa làm xong bài tập.", note: "vừa xảy ra" },
    ],
    commonMistakes: [
      { wrong: "I have went to Paris.", correct: "I have gone to Paris.", explanation: "Dùng V3 (past participle), không dùng V2." },
    ],
    vstepTips: [
      { task: "SP1", tip: "Dùng hiện tại hoàn thành khi nói về kinh nghiệm cá nhân.", example: "I have traveled to many countries in Southeast Asia." },
    ],
    exercises: [
      { kind: "mcq", id: "pp-1", prompt: "She ___ just finished her project.", options: ["have", "has", "had", "having"], correctIndex: 1, explanation: "She → has." },
      { kind: "fill-blank", id: "pp-2", template: "I ___ never ___ sushi before.", acceptedAnswers: ["have eaten", "have tried"], explanation: "Kinh nghiệm → have + V3." },
    ],
  },
  "past-simple": {
    name: "Past Simple", vietnameseName: "Thì quá khứ đơn",
    summary: "Hành động đã kết thúc hoàn toàn trong quá khứ.",
    whenToUse: "Dùng khi nói về hành động đã xảy ra và kết thúc tại thời điểm xác định trong quá khứ.",
    structures: ["S + V2/ed + O", "S + did + not + V", "Did + S + V ?"],
    examples: [
      { en: "I visited my grandparents last weekend.", vi: "Tôi đã thăm ông bà cuối tuần trước." },
      { en: "She didn't go to the party.", vi: "Cô ấy không đi dự tiệc." },
    ],
    commonMistakes: [
      { wrong: "I goed to school yesterday.", correct: "I went to school yesterday.", explanation: "Go là động từ bất quy tắc → went." },
    ],
    vstepTips: [
      { task: "WT1", tip: "Dùng quá khứ đơn khi kể lại sự kiện trong thư.", example: "I attended the conference last month." },
    ],
    exercises: [
      { kind: "mcq", id: "pst-1", prompt: "She ___ to the cinema yesterday.", options: ["go", "goes", "went", "gone"], correctIndex: 2, explanation: "Yesterday → quá khứ đơn → went." },
    ],
  },
  "first-conditional": {
    name: "First Conditional", vietnameseName: "Câu điều kiện loại 1",
    summary: "Điều kiện có thật, có khả năng xảy ra ở hiện tại hoặc tương lai.",
    whenToUse: "Dùng khi nói về tình huống có thể xảy ra trong tương lai.",
    structures: ["If + S + V(s/es), S + will + V"],
    examples: [{ en: "If it rains, I will stay home.", vi: "Nếu trời mưa, tôi sẽ ở nhà." }],
    commonMistakes: [{ wrong: "If it will rain, I will stay.", correct: "If it rains, I will stay.", explanation: "Mệnh đề if dùng hiện tại đơn, không dùng will." }],
    vstepTips: [{ task: "SP2", tip: "Dùng câu điều kiện loại 1 khi đề xuất giải pháp.", example: "If we reduce waste, the environment will improve." }],
    exercises: [{ kind: "mcq", id: "fc-1", prompt: "If she ___ hard, she will pass.", options: ["study", "studies", "studied", "studying"], correctIndex: 1, explanation: "Mệnh đề if + ngôi 3 → studies." }],
  },
  "present-passive": {
    name: "Passive Voice", vietnameseName: "Câu bị động",
    summary: "Nhấn mạnh đối tượng chịu tác động thay vì chủ thể.",
    whenToUse: "Dùng khi muốn nhấn mạnh hành động hoặc đối tượng, không phải người thực hiện.",
    structures: ["S + be + V3/ed (+ by agent)"],
    examples: [{ en: "The report was written by the team.", vi: "Báo cáo được viết bởi nhóm." }],
    commonMistakes: [{ wrong: "The cake baked by my mom.", correct: "The cake was baked by my mom.", explanation: "Thiếu trợ động từ be." }],
    vstepTips: [{ task: "WT2", tip: "Dùng bị động trong bài luận để tạo giọng văn khách quan.", example: "It is believed that education plays a vital role." }],
    exercises: [{ kind: "mcq", id: "pv-1", prompt: "The letter ___ yesterday.", options: ["sent", "was sent", "is sent", "sending"], correctIndex: 1, explanation: "Yesterday → quá khứ bị động → was sent." }],
  },
  "relative-clauses": {
    name: "Relative Clauses", vietnameseName: "Mệnh đề quan hệ",
    summary: "Bổ nghĩa cho danh từ bằng who / which / that / whose / where.",
    whenToUse: "Dùng để thêm thông tin cho danh từ đứng trước.",
    structures: ["N + who/which/that + V", "N + whose + N", "N + where + S + V"],
    examples: [{ en: "The man who lives next door is a doctor.", vi: "Người đàn ông sống cạnh nhà là bác sĩ." }],
    commonMistakes: [{ wrong: "The book who I read.", correct: "The book which/that I read.", explanation: "Dùng which/that cho vật, who cho người." }],
    vstepTips: [{ task: "WT2", tip: "Dùng mệnh đề quan hệ để viết câu phức, tăng điểm range.", example: "Students who study regularly tend to achieve higher scores." }],
    exercises: [{ kind: "mcq", id: "rc-1", prompt: "The woman ___ called you is my aunt.", options: ["which", "who", "whose", "where"], correctIndex: 1, explanation: "Người → who." }],
  },
  "second-conditional": {
    name: "Second Conditional", vietnameseName: "Câu điều kiện loại 2",
    summary: "Điều kiện không có thật ở hiện tại hoặc giả định khó xảy ra.",
    whenToUse: "Dùng khi nói về tình huống giả định, không có thật ở hiện tại.",
    structures: ["If + S + V2/ed, S + would + V"],
    examples: [{ en: "If I were rich, I would travel the world.", vi: "Nếu tôi giàu, tôi sẽ đi du lịch vòng quanh thế giới." }],
    commonMistakes: [{ wrong: "If I was you, I would go.", correct: "If I were you, I would go.", explanation: "Trong câu điều kiện loại 2, dùng were cho tất cả ngôi." }],
    vstepTips: [{ task: "SP3", tip: "Dùng câu điều kiện loại 2 khi bàn luận giả thuyết.", example: "If the government invested more in education, the literacy rate would increase." }],
    exercises: [{ kind: "mcq", id: "sc-1", prompt: "If I ___ you, I would apologize.", options: ["am", "was", "were", "be"], correctIndex: 2, explanation: "Điều kiện loại 2 → were." }],
  },
  "third-conditional": {
    name: "Third Conditional", vietnameseName: "Câu điều kiện loại 3",
    summary: "Điều kiện không có thật trong quá khứ — tiếc nuối việc đã xảy ra.",
    whenToUse: "Dùng khi nói về tình huống giả định trong quá khứ, không thể thay đổi.",
    structures: ["If + S + had + V3, S + would have + V3"],
    examples: [{ en: "If I had studied harder, I would have passed.", vi: "Nếu tôi học chăm hơn, tôi đã đỗ rồi." }],
    commonMistakes: [{ wrong: "If I would have known, I would have come.", correct: "If I had known, I would have come.", explanation: "Mệnh đề if dùng had + V3, không dùng would have." }],
    vstepTips: [{ task: "SP3", tip: "Dùng câu điều kiện loại 3 khi phân tích nguyên nhân-kết quả trong quá khứ.", example: "If the company had adopted new technology earlier, it would have been more competitive." }],
    exercises: [{ kind: "mcq", id: "tc-1", prompt: "If she ___ earlier, she wouldn't have missed the bus.", options: ["left", "had left", "has left", "leaves"], correctIndex: 1, explanation: "Điều kiện loại 3 → had + V3." }],
  },
};

function getPointData(id: string): PointData {
  return ALL_POINTS[id] ?? ALL_POINTS["present-simple"];
}

// ─── Screen ───────────────────────────────────────────────────────

type Tab = "theory" | "practice" | "tips";

export default function GrammarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const [tab, setTab] = useState<Tab>("theory");
  const point = getPointData(id!);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={point.name} />
      <ScrollView contentContainerStyle={styles.scroll} key={tab}>
        <Text style={[styles.vnName, { color: c.subtle }]}>{point.vietnameseName}</Text>
        <Text style={[styles.summary, { color: c.foreground }]}>{point.summary}</Text>
        <SegmentedTabs
          tabs={[{ key: "theory", label: "Lý thuyết" }, { key: "practice", label: "Luyện tập" }, { key: "tips", label: "Mẹo thi" }]}
          activeKey={tab}
          onTabChange={(k) => setTab(k as Tab)}
        />
        {tab === "theory" && <TheoryTab data={point} />}
        {tab === "practice" && <PracticeTab exercises={point.exercises} />}
        {tab === "tips" && <VstepTipsTab tips={point.vstepTips} mistakes={point.commonMistakes} />}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Theory Tab ───────────────────────────────────────────────────

function TheoryTab({ data }: { data: PointData }) {
  const c = useThemeColors();
  return (
    <View style={styles.tabContent}>
      <Section title="Khi nào dùng">
        <Text style={[styles.bodyText, { color: c.foreground }]}>{data.whenToUse}</Text>
      </Section>
      <Section title="Cấu trúc">
        {data.structures.map((s, i) => (
          <View key={i} style={[styles.structureBox, { backgroundColor: c.background }]}>
            <Text style={[styles.structureText, { color: c.foreground }]}>{s}</Text>
          </View>
        ))}
      </Section>
      <Section title="Ví dụ">
        {data.examples.map((ex, i) => (
          <View key={i} style={[styles.exampleCard, { borderColor: c.border }]}>
            <Text style={[styles.exEn, { color: c.foreground }]}>{ex.en}</Text>
            <Text style={[styles.exVi, { color: c.subtle }]}>{ex.vi}</Text>
            {ex.note && <Text style={[styles.exNote, { color: c.primary }]}>💡 {ex.note}</Text>}
          </View>
        ))}
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Practice Tab ─────────────────────────────────────────────────

function PracticeTab({ exercises }: { exercises: Exercise[] }) {
  const c = useThemeColors();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const done = index >= exercises.length;
  const ex = exercises[index];

  const handleNext = useCallback(() => { setSelected(null); setFillAnswer(""); setSubmitted(false); setIndex((i) => i + 1); }, []);
  const handleSubmit = useCallback(() => {
    if (!ex) return;
    setSubmitted(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (ex.kind === "mcq" && selected === ex.correctIndex) setCorrect((c) => c + 1);
    if (ex.kind === "fill-blank" && ex.acceptedAnswers.some((a) => a.toLowerCase() === fillAnswer.trim().toLowerCase())) setCorrect((c) => c + 1);
    if (ex.kind === "error-correction" && fillAnswer.trim().toLowerCase() === ex.correction.toLowerCase()) setCorrect((c) => c + 1);
    if (ex.kind === "rewrite" && ex.acceptedAnswers.some((a) => a.toLowerCase() === fillAnswer.trim().toLowerCase())) setCorrect((c) => c + 1);
  }, [ex, selected, fillAnswer]);

  if (done) {
    return (
      <View style={styles.doneWrap}>
        <Ionicons name="trophy" size={48} color={c.warning} />
        <Text style={[styles.doneTitle, { color: c.foreground }]}>Hoàn thành!</Text>
        <Text style={[styles.doneScore, { color: c.subtle }]}>Đúng: {correct}/{exercises.length}</Text>
        <HapticTouchable style={[styles.actionBtn, { backgroundColor: c.primary }]} onPress={() => { setIndex(0); setCorrect(0); }}>
          <Text style={styles.actionBtnText}>Làm lại</Text>
        </HapticTouchable>
      </View>
    );
  }

  const isCorrectMcq = ex.kind === "mcq" && selected === ex.correctIndex;
  const isCorrectFill = (ex.kind === "fill-blank" && ex.acceptedAnswers.some((a) => a.toLowerCase() === fillAnswer.trim().toLowerCase()))
    || (ex.kind === "error-correction" && fillAnswer.trim().toLowerCase() === ex.correction.toLowerCase())
    || (ex.kind === "rewrite" && ex.acceptedAnswers.some((a) => a.toLowerCase() === fillAnswer.trim().toLowerCase()));
  const isCorrect = ex.kind === "mcq" ? isCorrectMcq : isCorrectFill;

  return (
    <View style={styles.tabContent}>
      <View style={styles.practiceHeader}>
        <Text style={[styles.counter, { color: c.subtle }]}>Câu {index + 1} / {exercises.length}</Text>
        <Text style={[styles.counter, { color: c.foreground }]}>Đúng: {correct}</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: c.background }]}>
        <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${(index / exercises.length) * 100}%` }]} />
      </View>

      <View style={[styles.exerciseCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.kindRow}>
          <Text style={[styles.kindBadge, { color: ex.kind === "mcq" ? c.primary : c.warning, backgroundColor: (ex.kind === "mcq" ? c.primary : c.warning) + "15" }]}>
            {ex.kind === "mcq" ? "Trắc nghiệm" : "Điền từ"}
          </Text>
        </View>
        <Text style={[styles.prompt, { color: c.foreground }]}>{ex.kind === "mcq" ? ex.prompt : ex.template}</Text>

        {ex.kind === "mcq" && ex.options.map((opt, i) => {
          const isSel = selected === i;
          const showOk = submitted && i === ex.correctIndex;
          const showBad = submitted && isSel && i !== ex.correctIndex;
          return (
            <HapticTouchable key={opt} style={[styles.optionBtn, { borderColor: showOk ? c.success : showBad ? c.destructive : isSel ? c.primary : c.border }]} onPress={() => !submitted && setSelected(i)} disabled={submitted}>
              <View style={[styles.optLetter, { backgroundColor: showOk ? c.success : showBad ? c.destructive : isSel ? c.primary : c.muted }]}>
                <Text style={{ color: (isSel || showOk || showBad) ? "#fff" : c.subtle, fontSize: 12, fontFamily: fontFamily.bold }}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={[styles.optText, { color: c.foreground }]}>{opt}</Text>
            </HapticTouchable>
          );
        })}

        {ex.kind === "fill-blank" && (
          <TextInput style={[styles.fillInput, { borderColor: submitted ? (isCorrectFill ? c.success : c.destructive) : c.border, color: c.foreground }]} placeholder="Nhập đáp án..." placeholderTextColor={c.subtle} value={fillAnswer} onChangeText={setFillAnswer} editable={!submitted} autoCapitalize="none" />
        )}

        {ex.kind === "error-correction" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.kindRow}><Text style={[styles.kindBadge, { color: c.destructive, backgroundColor: c.destructive + "15" }]}>Sửa lỗi</Text></View>
            <Text style={[styles.prompt, { color: c.foreground }]}>{ex.sentence}</Text>
            <TextInput style={[styles.fillInput, { borderColor: submitted ? (isCorrectFill ? c.success : c.destructive) : c.border, color: c.foreground }]} placeholder="Viết lại câu đúng..." placeholderTextColor={c.subtle} value={fillAnswer} onChangeText={setFillAnswer} editable={!submitted} autoCapitalize="none" />
            {submitted && !isCorrectFill && <Text style={{ color: c.success, fontSize: fontSize.sm }}>Đáp án: {ex.correction}</Text>}
          </View>
        )}

        {ex.kind === "rewrite" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.kindRow}><Text style={[styles.kindBadge, { color: c.skillWriting, backgroundColor: c.skillWriting + "15" }]}>Viết lại câu</Text></View>
            <Text style={[styles.prompt, { color: c.subtle }]}>{ex.instruction}</Text>
            <Text style={[styles.prompt, { color: c.foreground }]}>{ex.original}</Text>
            <TextInput style={[styles.fillInput, { borderColor: submitted ? (isCorrectFill ? c.success : c.destructive) : c.border, color: c.foreground }]} placeholder="Viết lại câu..." placeholderTextColor={c.subtle} value={fillAnswer} onChangeText={setFillAnswer} editable={!submitted} autoCapitalize="none" />
          </View>
        )}

        {submitted && (
          <View style={[styles.explBox, { backgroundColor: isCorrect ? c.success + "0D" : c.destructive + "0D" }]}>
            <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={16} color={isCorrect ? c.success : c.destructive} />
            <Text style={[styles.explText, { color: c.foreground }]}>{ex.explanation}</Text>
          </View>
        )}
      </View>

      {!submitted ? (
        <HapticTouchable style={[styles.actionBtn, { backgroundColor: c.primary, opacity: (ex.kind === "mcq" ? selected !== null : fillAnswer.trim().length > 0) ? 1 : 0.5 }]} onPress={handleSubmit} disabled={ex.kind === "mcq" ? selected === null : fillAnswer.trim().length === 0}>
          <Text style={styles.actionBtnText}>Kiểm tra</Text>
        </HapticTouchable>
      ) : (
        <HapticTouchable style={[styles.actionBtn, { backgroundColor: c.primary }]} onPress={handleNext}>
          <Text style={styles.actionBtnText}>Tiếp theo →</Text>
        </HapticTouchable>
      )}
    </View>
  );
}

// ─── Mistakes Tab ─────────────────────────────────────────────────

function VstepTipsTab({ tips, mistakes }: { tips: VstepTip[]; mistakes: Mistake[] }) {
  const c = useThemeColors();
  return (
    <View style={styles.tabContent}>
      {tips.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Mẹo thi VSTEP</Text>
          {tips.map((t, i) => (
            <View key={i} style={[styles.mistakeCard, { borderColor: c.border, backgroundColor: c.surface }]}>
              <View style={[styles.taskBadge, { backgroundColor: c.primary + "15" }]}>
                <Text style={[styles.taskBadgeText, { color: c.primary }]}>{t.task}</Text>
              </View>
              <Text style={[styles.tipText, { color: c.foreground }]}>{t.tip}</Text>
              <View style={[styles.exampleBox, { borderLeftColor: c.primary }]}>
                <Text style={[styles.exampleBoxText, { color: c.subtle }]}>{t.example}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      {mistakes.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lỗi thường gặp</Text>
          {mistakes.map((m, i) => (
            <View key={i} style={[styles.mistakeCard, { borderColor: c.border, backgroundColor: c.surface }]}>
              <View style={styles.mistakeRow}>
                <Ionicons name="close-circle" size={16} color={c.destructive} />
                <Text style={[styles.mistakeWrong, { color: c.destructive }]}>{m.wrong}</Text>
              </View>
              <View style={styles.mistakeRow}>
                <Ionicons name="checkmark-circle" size={16} color={c.success} />
                <Text style={[styles.mistakeCorrect, { color: c.success }]}>{m.correct}</Text>
              </View>
              <Text style={[styles.mistakeExpl, { color: c.subtle }]}>{m.explanation}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.xl },
  vnName: { fontSize: fontSize.sm, marginBottom: 2 },
  summary: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.base },
  tabContent: { marginTop: spacing.xl, gap: spacing.base },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  bodyText: { fontSize: fontSize.sm, lineHeight: 20 },
  structureBox: { borderRadius: radius.lg, padding: spacing.md },
  structureText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  exampleCard: { borderLeftWidth: 3, paddingLeft: spacing.md, gap: 2 },
  exEn: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  exVi: { fontSize: fontSize.xs },
  exNote: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  // Practice
  practiceHeader: { flexDirection: "row", justifyContent: "space-between" },
  counter: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  exerciseCard: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.md },
  kindRow: { flexDirection: "row" },
  kindBadge: { fontSize: 11, fontFamily: fontFamily.semiBold, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, overflow: "hidden" },
  prompt: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 24 },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, ...depthNeutral, borderRadius: radius.lg, padding: spacing.md },
  optLetter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  optText: { flex: 1, fontSize: fontSize.sm },
  fillInput: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base },
  explBox: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  explText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  actionBtn: { alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg },
  actionBtnText: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
  // Done
  doneWrap: { alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.md },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  doneScore: { fontSize: fontSize.base },
  // Mistakes
  mistakeCard: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  mistakeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  mistakeWrong: { fontSize: fontSize.sm, textDecorationLine: "line-through" },
  mistakeCorrect: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  mistakeExpl: { fontSize: fontSize.xs, lineHeight: 18 },
  taskBadge: { alignSelf: "flex-start", borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  taskBadgeText: { fontSize: 11, fontFamily: fontFamily.bold },
  tipText: { fontSize: fontSize.sm, lineHeight: 20 },
  exampleBox: { borderLeftWidth: 3, paddingLeft: spacing.md, marginTop: 4 },
  exampleBoxText: { fontSize: fontSize.xs, fontStyle: "italic", lineHeight: 18 },
});
