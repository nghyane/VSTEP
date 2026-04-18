import { useCallback, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Mock data (aligned with frontend-v2 VocabWord + VocabExercise) ──

interface Word {
  id: string; word: string; phonetic: string; partOfSpeech: string;
  definition: string; example: string; synonyms: string[];
}

interface McqExercise { kind: "mcq"; id: string; prompt: string; options: string[]; correctIndex: number; explanation: string; }
interface FillBlankExercise { kind: "fill-blank"; id: string; sentence: string; acceptedAnswers: string[]; explanation: string; }
interface WordFormExercise { kind: "word-form"; id: string; instruction: string; sentence: string; rootWord: string; acceptedAnswers: string[]; explanation: string; }
type Exercise = McqExercise | FillBlankExercise | WordFormExercise;

interface TopicData { name: string; description: string; words: Word[]; exercises: Exercise[]; }

const ALL_TOPICS: Record<string, TopicData> = {
  "family-relationships": {
    name: "Gia đình & Mối quan hệ", description: "Từ vựng về thành viên gia đình và các mối quan hệ thường ngày.",
    words: [
      { id: "w1", word: "relative", phonetic: "/ˈrel.ə.tɪv/", partOfSpeech: "noun", definition: "họ hàng", example: "We visit our relatives during holidays.", synonyms: ["kin", "family member"] },
      { id: "w2", word: "sibling", phonetic: "/ˈsɪb.lɪŋ/", partOfSpeech: "noun", definition: "anh chị em", example: "I have two siblings.", synonyms: ["brother", "sister"] },
      { id: "w3", word: "upbringing", phonetic: "/ˈʌp.brɪŋ.ɪŋ/", partOfSpeech: "noun", definition: "sự nuôi dạy", example: "His upbringing shaped his character.", synonyms: ["childhood", "rearing"] },
      { id: "w4", word: "bond", phonetic: "/bɒnd/", partOfSpeech: "noun", definition: "mối gắn kết", example: "The bond between them is strong.", synonyms: ["connection", "tie"] },
      { id: "w5", word: "nurture", phonetic: "/ˈnɜː.tʃər/", partOfSpeech: "verb", definition: "nuôi dưỡng", example: "Parents nurture their children.", synonyms: ["raise", "foster"] },
    ],
    exercises: [
      { kind: "mcq", id: "ex1", prompt: "My ___ live in the countryside.", options: ["relatives", "relations", "relationships", "relators"], correctIndex: 0, explanation: "'Relatives' là danh từ chỉ người thân." },
      { kind: "fill-blank", id: "ex2", sentence: "Parents should ___ their children with love.", acceptedAnswers: ["nurture"], explanation: "'Nurture' nghĩa là nuôi dưỡng." },
      { kind: "word-form", id: "ex3", instruction: "Điền dạng đúng của từ trong ngoặc.", sentence: "The ___ (relate) between parents and children is important.", rootWord: "relate", acceptedAnswers: ["relationship"], explanation: "'Relate' (v) → 'relationship' (n) = mối quan hệ." },
    ],
  },
  "daily-life": {
    name: "Sinh hoạt hằng ngày", description: "Các hoạt động và thói quen trong ngày.",
    words: [
      { id: "d1", word: "routine", phonetic: "/ruːˈtiːn/", partOfSpeech: "noun", definition: "thói quen hàng ngày", example: "My morning routine starts at 6 AM.", synonyms: ["habit", "schedule"] },
      { id: "d2", word: "commute", phonetic: "/kəˈmjuːt/", partOfSpeech: "verb", definition: "đi lại (đi làm)", example: "I commute by bus every day.", synonyms: ["travel", "journey"] },
      { id: "d3", word: "household", phonetic: "/ˈhaʊs.həʊld/", partOfSpeech: "noun", definition: "hộ gia đình", example: "Household chores take a lot of time.", synonyms: ["home", "family"] },
      { id: "d4", word: "leisure", phonetic: "/ˈleʒ.ər/", partOfSpeech: "noun", definition: "thời gian rảnh", example: "I enjoy reading in my leisure time.", synonyms: ["free time", "recreation"] },
    ],
    exercises: [
      { kind: "mcq", id: "de1", prompt: "My morning ___ includes exercise and breakfast.", options: ["routine", "route", "root", "round"], correctIndex: 0, explanation: "'Routine' = thói quen hàng ngày." },
      { kind: "fill-blank", id: "de2", sentence: "She ___ to work by train every day.", acceptedAnswers: ["commutes"], explanation: "'Commute' = đi lại hàng ngày." },
    ],
  },
  "work-career": {
    name: "Công việc & Sự nghiệp", description: "Thuật ngữ cơ bản về công việc, nghề nghiệp và môi trường văn phòng.",
    words: [
      { id: "wk1", word: "colleague", phonetic: "/ˈkɒl.iːɡ/", partOfSpeech: "noun", definition: "đồng nghiệp", example: "My colleagues are very friendly.", synonyms: ["coworker", "associate"] },
      { id: "wk2", word: "deadline", phonetic: "/ˈded.laɪn/", partOfSpeech: "noun", definition: "hạn chót", example: "We must meet the deadline.", synonyms: ["due date", "time limit"] },
      { id: "wk3", word: "promote", phonetic: "/prəˈməʊt/", partOfSpeech: "verb", definition: "thăng chức", example: "She was promoted to manager.", synonyms: ["advance", "upgrade"] },
    ],
    exercises: [
      { kind: "mcq", id: "we1", prompt: "We need to meet the ___ by Friday.", options: ["deadline", "dateline", "headline", "sideline"], correctIndex: 0, explanation: "'Deadline' = hạn chót." },
    ],
  },
  "health-fitness": {
    name: "Sức khỏe & Thể chất", description: "Từ vựng về rèn luyện sức khỏe, dinh dưỡng và lối sống.",
    words: [
      { id: "h1", word: "symptom", phonetic: "/ˈsɪmp.təm/", partOfSpeech: "noun", definition: "triệu chứng", example: "Fever is a common symptom.", synonyms: ["sign", "indication"] },
      { id: "h2", word: "nutrition", phonetic: "/njuːˈtrɪʃ.ən/", partOfSpeech: "noun", definition: "dinh dưỡng", example: "Good nutrition is essential for health.", synonyms: ["diet", "nourishment"] },
      { id: "h3", word: "exercise", phonetic: "/ˈek.sə.saɪz/", partOfSpeech: "noun", definition: "bài tập thể dục", example: "Regular exercise keeps you fit.", synonyms: ["workout", "training"] },
    ],
    exercises: [
      { kind: "mcq", id: "he1", prompt: "Fever is a common ___ of the flu.", options: ["symptom", "symbol", "system", "syndrome"], correctIndex: 0, explanation: "'Symptom' = triệu chứng." },
    ],
  },
  "environment-climate": {
    name: "Môi trường & Khí hậu", description: "Từ vựng học thuật về môi trường, biến đổi khí hậu và phát triển bền vững.",
    words: [
      { id: "e1", word: "sustainable", phonetic: "/səˈsteɪ.nə.bəl/", partOfSpeech: "adj", definition: "bền vững", example: "We need sustainable energy sources.", synonyms: ["renewable", "viable"] },
      { id: "e2", word: "emission", phonetic: "/ɪˈmɪʃ.ən/", partOfSpeech: "noun", definition: "khí thải", example: "Carbon emissions cause global warming.", synonyms: ["discharge", "release"] },
      { id: "e3", word: "conservation", phonetic: "/ˌkɒn.səˈveɪ.ʃən/", partOfSpeech: "noun", definition: "bảo tồn", example: "Wildlife conservation is important.", synonyms: ["preservation", "protection"] },
    ],
    exercises: [
      { kind: "mcq", id: "ee1", prompt: "Carbon ___ contribute to global warming.", options: ["emissions", "admissions", "permissions", "submissions"], correctIndex: 0, explanation: "'Emissions' = khí thải." },
    ],
  },
  "education-academic": {
    name: "Giáo dục & Học thuật", description: "Từ vựng học thuật dùng trong bài thi, báo cáo và luận văn.",
    words: [
      { id: "ed1", word: "curriculum", phonetic: "/kəˈrɪk.jə.ləm/", partOfSpeech: "noun", definition: "chương trình học", example: "The curriculum includes science.", synonyms: ["syllabus", "program"] },
      { id: "ed2", word: "scholarship", phonetic: "/ˈskɒl.ə.ʃɪp/", partOfSpeech: "noun", definition: "học bổng", example: "She won a scholarship to study abroad.", synonyms: ["grant", "fellowship"] },
      { id: "ed3", word: "thesis", phonetic: "/ˈθiː.sɪs/", partOfSpeech: "noun", definition: "luận văn", example: "He is writing his thesis.", synonyms: ["dissertation", "paper"] },
    ],
    exercises: [
      { kind: "mcq", id: "ede1", prompt: "She won a ___ to study in the UK.", options: ["scholarship", "relationship", "partnership", "membership"], correctIndex: 0, explanation: "'Scholarship' = học bổng." },
    ],
  },
};

function getTopicData(id: string): TopicData {
  return ALL_TOPICS[id] ?? ALL_TOPICS["family-relationships"];
}

// ─── Screen ───────────────────────────────────────────────────────

type Tab = "flashcard" | "practice";

export default function VocabularyTopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("flashcard");
  const topic = getTopicData(id!);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={topic.name} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>{topic.description}</Text>
        <SegmentedTabs
          tabs={[{ key: "flashcard", label: "Flashcard" }, { key: "practice", label: "Luyện tập" }]}
          activeKey={tab}
          onTabChange={(k) => setTab(k as Tab)}
        />
        {tab === "flashcard" ? <FlashcardTab words={topic.words} /> : <PracticeTab exercises={topic.exercises} />}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Flashcard Tab ────────────────────────────────────────────────

const RATINGS = [
  { label: "Quên", color: "#EF4444" },
  { label: "Khó", color: "#F59E0B" },
  { label: "Tốt", color: "#22C55E" },
  { label: "Dễ", color: "#3B82F6" },
];

function FlashcardTab({ words }: { words: Word[] }) {
  const c = useThemeColors();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const done = index >= words.length;
  const word = words[index];

  const handleRate = useCallback((_rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlipped(false);
    setIndex((i) => i + 1);
  }, []);

  const handleReset = useCallback(() => {
    setIndex(0);
    setFlipped(false);
  }, []);

  if (done) {
    return (
      <View style={styles.doneWrap}>
        <Ionicons name="checkmark-circle" size={48} color={c.success} />
        <Text style={[styles.doneTitle, { color: c.foreground }]}>Đã xem hết {words.length} từ!</Text>
        <HapticTouchable style={[styles.resetBtn, { backgroundColor: c.primary }]} onPress={handleReset}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.resetBtnText}>Học lại</Text>
        </HapticTouchable>
      </View>
    );
  }

  return (
    <View style={styles.flashcardWrap}>
      <Text style={[styles.counter, { color: c.mutedForeground }]}>Câu {index + 1} / {words.length}</Text>

      <HapticTouchable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => setFlipped(!flipped)} activeOpacity={0.9}>
        {!flipped ? (
          <View style={styles.cardFront}>
            <Text style={[styles.wordText, { color: c.foreground }]}>{word.word}</Text>
            <Text style={[styles.phoneticText, { color: c.mutedForeground }]}>{word.phonetic}</Text>
            <Text style={[styles.posText, { color: c.primary }]}>{word.partOfSpeech}</Text>
            <Text style={[styles.tapHint, { color: c.mutedForeground }]}>Nhấn để xem nghĩa</Text>
          </View>
        ) : (
          <View style={styles.cardBack}>
            <Text style={[styles.wordTextSmall, { color: c.foreground }]}>{word.word}</Text>
            <Text style={[styles.defText, { color: c.foreground }]}>{word.definition}</Text>
            <Text style={[styles.exampleText, { color: c.mutedForeground }]}>"{word.example}"</Text>
            {word.synonyms.length > 0 && (
              <Text style={[styles.synText, { color: c.mutedForeground }]}>≈ {word.synonyms.join(", ")}</Text>
            )}
          </View>
        )}
      </HapticTouchable>

      {flipped && (
        <View style={styles.ratingRow}>
          {RATINGS.map((r, i) => (
            <HapticTouchable key={r.label} style={[styles.ratingBtn, { backgroundColor: r.color }]} onPress={() => handleRate(i)}>
              <Text style={styles.ratingLabel}>{r.label}</Text>
            </HapticTouchable>
          ))}
        </View>
      )}
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

  const handleNext = useCallback(() => {
    setSelected(null);
    setFillAnswer("");
    setSubmitted(false);
    setIndex((i) => i + 1);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!ex) return;
    setSubmitted(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (ex.kind === "mcq" && selected === ex.correctIndex) setCorrect((c) => c + 1);
    if ((ex.kind === "fill-blank" || ex.kind === "word-form") && (ex as any).acceptedAnswers.some((a: string) => a.toLowerCase() === fillAnswer.trim().toLowerCase())) setCorrect((c) => c + 1);
  }, [ex, selected, fillAnswer]);

  if (done) {
    return (
      <View style={styles.doneWrap}>
        <Ionicons name="trophy" size={48} color={c.warning} />
        <Text style={[styles.doneTitle, { color: c.foreground }]}>Hoàn thành!</Text>
        <Text style={[styles.doneScore, { color: c.mutedForeground }]}>Đúng: {correct}/{exercises.length}</Text>
        <HapticTouchable style={[styles.resetBtn, { backgroundColor: c.primary }]} onPress={() => { setIndex(0); setCorrect(0); }}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.resetBtnText}>Làm lại</Text>
        </HapticTouchable>
      </View>
    );
  }

  const isCorrectMcq = ex.kind === "mcq" && selected === ex.correctIndex;
  const isCorrectFill = (ex.kind === "fill-blank" || ex.kind === "word-form") && (ex as any).acceptedAnswers.some((a: string) => a.toLowerCase() === fillAnswer.trim().toLowerCase());

  return (
    <View style={styles.practiceWrap}>
      <View style={styles.practiceHeader}>
        <Text style={[styles.counter, { color: c.mutedForeground }]}>Câu {index + 1} / {exercises.length}</Text>
        <Text style={[styles.counter, { color: c.foreground }]}>Đúng: {correct}</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${((index) / exercises.length) * 100}%` }]} />
      </View>

      <View style={[styles.exerciseCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {ex.kind === "mcq" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.kindBadgeRow}>
              <Text style={[styles.kindBadge, { color: c.primary, backgroundColor: c.primary + "15" }]}>Trắc nghiệm</Text>
            </View>
            <Text style={[styles.prompt, { color: c.foreground }]}>{ex.prompt}</Text>
            {ex.options.map((opt, i) => {
              const isSelected = selected === i;
              const showCorrect = submitted && i === ex.correctIndex;
              const showWrong = submitted && isSelected && i !== ex.correctIndex;
              return (
                <HapticTouchable
                  key={opt}
                  style={[styles.optionBtn, { borderColor: showCorrect ? c.success : showWrong ? c.destructive : isSelected ? c.primary : c.border, backgroundColor: showCorrect ? c.success + "0D" : showWrong ? c.destructive + "0D" : isSelected ? c.primary + "0D" : "transparent" }]}
                  onPress={() => !submitted && setSelected(i)}
                  disabled={submitted}
                >
                  <View style={[styles.optionLetter, { backgroundColor: showCorrect ? c.success : showWrong ? c.destructive : isSelected ? c.primary : c.muted }]}>
                    <Text style={{ color: (isSelected || showCorrect || showWrong) ? "#fff" : c.mutedForeground, fontSize: 12, fontFamily: fontFamily.bold }}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: c.foreground }]}>{opt}</Text>
                </HapticTouchable>
              );
            })}
          </View>
        )}

        {ex.kind === "fill-blank" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.kindBadgeRow}>
              <Text style={[styles.kindBadge, { color: c.warning, backgroundColor: c.warning + "15" }]}>Điền từ</Text>
            </View>
            <Text style={[styles.prompt, { color: c.foreground }]}>{ex.sentence}</Text>
            <TextInput
              style={[styles.fillInput, { borderColor: submitted ? (isCorrectFill ? c.success : c.destructive) : c.border, color: c.foreground, backgroundColor: c.card }]}
              placeholder="Nhập đáp án..."
              placeholderTextColor={c.mutedForeground}
              value={fillAnswer}
              onChangeText={setFillAnswer}
              editable={!submitted}
              autoCapitalize="none"
            />
          </View>
        )}

        {ex.kind === "word-form" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.kindBadgeRow}>
              <Text style={[styles.kindBadge, { color: c.skillWriting, backgroundColor: c.skillWriting + "15" }]}>Biến đổi từ</Text>
            </View>
            <Text style={[styles.prompt, { color: c.mutedForeground }]}>{ex.instruction}</Text>
            <Text style={[styles.prompt, { color: c.foreground }]}>{ex.sentence}</Text>
            <Text style={[{ color: c.primary, fontSize: fontSize.xs, fontFamily: fontFamily.semiBold }]}>Từ gốc: {ex.rootWord}</Text>
            <TextInput
              style={[styles.fillInput, { borderColor: submitted ? (isCorrectFill ? c.success : c.destructive) : c.border, color: c.foreground, backgroundColor: c.card }]}
              placeholder="Nhập dạng đúng..."
              placeholderTextColor={c.mutedForeground}
              value={fillAnswer}
              onChangeText={setFillAnswer}
              editable={!submitted}
              autoCapitalize="none"
            />
          </View>
        )}

        {submitted && (
          <View style={[styles.explanationBox, { backgroundColor: (ex.kind === "mcq" ? isCorrectMcq : isCorrectFill) ? c.success + "0D" : c.destructive + "0D" }]}>
            <Ionicons name={(ex.kind === "mcq" ? isCorrectMcq : isCorrectFill) ? "checkmark-circle" : "close-circle"} size={16} color={(ex.kind === "mcq" ? isCorrectMcq : isCorrectFill) ? c.success : c.destructive} />
            <Text style={[styles.explanationText, { color: c.foreground }]}>{ex.explanation}</Text>
          </View>
        )}
      </View>

      {!submitted ? (
        <HapticTouchable
          style={[styles.submitBtn, { backgroundColor: c.primary, opacity: (ex.kind === "mcq" ? selected !== null : fillAnswer.trim().length > 0) ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={ex.kind === "mcq" ? selected === null : fillAnswer.trim().length === 0}
        >
          <Text style={styles.submitBtnText}>Kiểm tra</Text>
        </HapticTouchable>
      ) : (
        <HapticTouchable style={[styles.submitBtn, { backgroundColor: c.primary }]} onPress={handleNext}>
          <Text style={styles.submitBtnText}>Tiếp theo →</Text>
        </HapticTouchable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.xl },
  desc: { fontSize: fontSize.sm, marginBottom: spacing.base },
  counter: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  // Flashcard
  flashcardWrap: { marginTop: spacing.xl, gap: spacing.base },
  card: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing["2xl"], minHeight: 200, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center" },
  cardFront: { alignItems: "center", gap: spacing.sm },
  cardBack: { alignItems: "center", gap: spacing.sm },
  wordText: { fontSize: fontSize["3xl"], fontFamily: fontFamily.bold },
  wordTextSmall: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  phoneticText: { fontSize: fontSize.base },
  posText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  tapHint: { fontSize: fontSize.xs, marginTop: spacing.base },
  defText: { fontSize: fontSize.xl, fontFamily: fontFamily.semiBold },
  exampleText: { fontSize: fontSize.sm, fontStyle: "italic", textAlign: "center" },
  synText: { fontSize: fontSize.xs },
  ratingRow: { flexDirection: "row", gap: spacing.sm },
  ratingBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg },
  ratingLabel: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  // Done
  doneWrap: { alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.md },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  doneScore: { fontSize: fontSize.base },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg },
  resetBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  // Practice
  practiceWrap: { marginTop: spacing.xl, gap: spacing.base },
  practiceHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  exerciseCard: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.base },
  kindBadgeRow: { flexDirection: "row" },
  kindBadge: { fontSize: 11, fontFamily: fontFamily.semiBold, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, overflow: "hidden" },
  prompt: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 24 },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, ...depthNeutral, borderRadius: radius.lg, padding: spacing.md },
  optionLetter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1, fontSize: fontSize.sm },
  fillInput: { ...depthNeutral, backgroundColor: "#FFF", borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base },
  explanationBox: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  explanationText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  submitBtn: { alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg },
  submitBtnText: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
});
