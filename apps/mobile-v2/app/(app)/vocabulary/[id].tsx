import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVocabTopicDetail, type WordWithState } from "@/hooks/use-vocab";
import { api } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type SrsRating = 1 | 2 | 3 | 4;
type Tab = "flashcard" | "practice";
type ExerciseKind = "mcq" | "fill_blank" | "word_form";

interface VocabExercise {
  id: string;
  displayOrder: number;
  kind: ExerciseKind;
  payload: Record<string, unknown>;
}

export default function VocabTopicDetailScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useVocabTopicDetail(id ?? "");
  const [tab, setTab] = useState<Tab>("flashcard");

  if (isLoading || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  const { topic, words } = data;
  const exercises = (data as any).exercises as VocabExercise[] | undefined;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <HapticTouchable onPress={() => router.back()} style={s.backRow}>
          <Ionicons name="arrow-back" size={20} color={c.foreground} />
          <Text style={[s.backText, { color: c.foreground }]}>{topic.name}</Text>
        </HapticTouchable>

        {topic.description ? (
          <Text style={[s.desc, { color: c.mutedForeground }]}>{topic.description}</Text>
        ) : null}

        {/* Tab switcher */}
        <View style={s.tabRow}>
          <HapticTouchable
            style={[s.tab, { backgroundColor: tab === "flashcard" ? c.primaryTint : c.muted, borderColor: tab === "flashcard" ? c.primary : "transparent" }]}
            onPress={() => setTab("flashcard")}
          >
            <Text style={[s.tabText, { color: tab === "flashcard" ? c.primary : c.mutedForeground }]}>Flashcard</Text>
          </HapticTouchable>
          <HapticTouchable
            style={[s.tab, { backgroundColor: tab === "practice" ? c.primaryTint : c.muted, borderColor: tab === "practice" ? c.primary : "transparent" }]}
            onPress={() => setTab("practice")}
          >
            <Text style={[s.tabText, { color: tab === "practice" ? c.primary : c.mutedForeground }]}>Luyện tập</Text>
          </HapticTouchable>
        </View>

        {tab === "flashcard" ? (
          <FlashcardTab words={words} />
        ) : (
          <PracticeTab exercises={exercises ?? []} />
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Flashcard Tab ────────────────────────────────────────────────

const RATINGS: { label: string; color: string; rating: SrsRating }[] = [
  { label: "Quên", color: "#EF4444", rating: 1 },
  { label: "Khó", color: "#F59E0B", rating: 2 },
  { label: "Tốt", color: "#22C55E", rating: 3 },
  { label: "Dễ", color: "#3B82F6", rating: 4 },
];

function FlashcardTab({ words }: { words: WordWithState[] }) {
  const c = useThemeColors();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const done = index >= words.length;
  const current = words[index];

  const handleRate = useCallback(async (rating: SrsRating) => {
    if (!current || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    try {
      await api.post("/api/v1/vocab/srs/review", { wordId: current.word.id, rating });
    } catch {
      // continue regardless — offline-tolerant
    }
    setSubmitting(false);
    setFlipped(false);
    setIndex((i) => i + 1);
  }, [current, submitting]);

  const handleReset = useCallback(() => {
    setIndex(0);
    setFlipped(false);
  }, []);

  if (words.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <Ionicons name="book-outline" size={40} color={c.subtle} />
        <Text style={[s.emptyTitle, { color: c.foreground }]}>Chưa có từ vựng</Text>
        <Text style={[s.emptyDesc, { color: c.mutedForeground }]}>Chủ đề này chưa có từ nào.</Text>
      </View>
    );
  }

  if (done) {
    return (
      <View style={s.doneWrap}>
        <Ionicons name="checkmark-circle" size={48} color={c.success} />
        <Text style={[s.doneTitle, { color: c.foreground }]}>{`Đã xem hết ${words.length} từ!`}</Text>
        <DepthButton onPress={handleReset}>Học lại</DepthButton>
      </View>
    );
  }

  const w = current.word;

  return (
    <View style={s.flashcardWrap}>
      <Text style={[s.counter, { color: c.mutedForeground }]}>{`Câu ${index + 1} / ${words.length}`}</Text>

      <HapticTouchable
        style={[s.flashcard, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => setFlipped(!flipped)}
        activeOpacity={0.9}
      >
        {!flipped ? (
          <View style={s.cardCenter}>
            <Text style={[s.wordBig, { color: c.foreground }]}>{w.word}</Text>
            {w.phonetic ? <Text style={[s.phonetic, { color: c.mutedForeground }]}>{w.phonetic}</Text> : null}
            {w.partOfSpeech ? <Text style={[s.pos, { color: c.primary }]}>{w.partOfSpeech}</Text> : null}
            <Text style={[s.tapHint, { color: c.subtle }]}>Nhấn để xem nghĩa</Text>
          </View>
        ) : (
          <View style={s.cardCenter}>
            <Text style={[s.wordSmall, { color: c.foreground }]}>{w.word}</Text>
            <Text style={[s.definition, { color: c.foreground }]}>{w.definition}</Text>
            {w.example ? <Text style={[s.example, { color: c.mutedForeground }]}>{`"${w.example}"`}</Text> : null}
          </View>
        )}
      </HapticTouchable>

      {flipped ? (
        <View style={s.ratingRow}>
          {RATINGS.map((r) => (
            <HapticTouchable
              key={r.label}
              style={[s.ratingBtn, { backgroundColor: r.color, opacity: submitting ? 0.5 : 1 }]}
              onPress={() => handleRate(r.rating)}
              disabled={submitting}
            >
              <Text style={s.ratingLabel}>{r.label}</Text>
            </HapticTouchable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Practice Tab ─────────────────────────────────────────────────

function PracticeTab({ exercises }: { exercises: VocabExercise[] }) {
  const c = useThemeColors();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string | null } | null>(null);

  const done = index >= exercises.length;
  const ex = exercises[index];

  const handleSubmit = useCallback(async () => {
    if (!ex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let answer: Record<string, unknown> = {};
    if (ex.kind === "mcq") answer = { selected_index: selected };
    else answer = { text: fillAnswer.trim() };

    try {
      const result = await api.post<{ attemptId: string; isCorrect: boolean; explanation: string | null }>(
        `/api/v1/vocab/exercises/${ex.id}/attempt`,
        { answer },
      );
      setFeedback({ isCorrect: result.isCorrect, explanation: result.explanation });
      if (result.isCorrect) setCorrect((c) => c + 1);
    } catch {
      setFeedback({ isCorrect: false, explanation: "Không thể kiểm tra. Vui lòng thử lại." });
    }
    setSubmitted(true);
  }, [ex, selected, fillAnswer]);

  const handleNext = useCallback(() => {
    setSelected(null);
    setFillAnswer("");
    setSubmitted(false);
    setFeedback(null);
    setIndex((i) => i + 1);
  }, []);

  if (exercises.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <Ionicons name="document-text-outline" size={40} color={c.subtle} />
        <Text style={[s.emptyTitle, { color: c.foreground }]}>Chưa có bài tập</Text>
        <Text style={[s.emptyDesc, { color: c.mutedForeground }]}>Chủ đề này chưa có bài tập nào.</Text>
      </View>
    );
  }

  if (done) {
    return (
      <View style={s.doneWrap}>
        <Ionicons name="trophy" size={48} color="#FFC800" />
        <Text style={[s.doneTitle, { color: c.foreground }]}>Hoàn thành!</Text>
        <Text style={[s.doneScore, { color: c.mutedForeground }]}>{`Đúng: ${correct}/${exercises.length}`}</Text>
        <DepthButton onPress={() => { setIndex(0); setCorrect(0); setFeedback(null); setSubmitted(false); }}>
          Làm lại
        </DepthButton>
      </View>
    );
  }

  const payload = ex.payload as Record<string, any>;
  const kindLabel = ex.kind === "mcq" ? "Trắc nghiệm" : ex.kind === "fill_blank" ? "Điền từ" : "Biến đổi từ";
  const kindColor = ex.kind === "mcq" ? "#1CB0F6" : ex.kind === "fill_blank" ? "#FF9B00" : "#58CC02";

  const canSubmit = ex.kind === "mcq" ? selected !== null : fillAnswer.trim().length > 0;

  return (
    <View style={s.practiceWrap}>
      <View style={s.practiceHeader}>
        <Text style={[s.counter, { color: c.mutedForeground }]}>{`Câu ${index + 1} / ${exercises.length}`}</Text>
        <Text style={[s.counter, { color: c.foreground }]}>{`Đúng: ${correct}`}</Text>
      </View>

      <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[s.progressFill, { backgroundColor: c.primary, width: `${(index / exercises.length) * 100}%` }]} />
      </View>

      <DepthCard style={s.exerciseCard}>
        <View style={[s.kindBadge, { backgroundColor: kindColor + "15" }]}>
          <Text style={[s.kindBadgeText, { color: kindColor }]}>{kindLabel}</Text>
        </View>

        {/* MCQ */}
        {ex.kind === "mcq" && payload.prompt ? (
          <View style={{ gap: spacing.md }}>
            <Text style={[s.prompt, { color: c.foreground }]}>{payload.prompt}</Text>
            {(payload.options as string[]).map((opt: string, i: number) => {
              const isSelected = selected === i;
              const showCorrect = submitted && feedback?.isCorrect && isSelected;
              const showWrong = submitted && !feedback?.isCorrect && isSelected;
              return (
                <HapticTouchable
                  key={opt}
                  style={[s.optionBtn, {
                    borderColor: showCorrect ? c.success : showWrong ? c.destructive : isSelected ? c.primary : c.border,
                    backgroundColor: showCorrect ? c.success + "10" : showWrong ? c.destructive + "10" : isSelected ? c.primary + "10" : "transparent",
                  }]}
                  onPress={() => !submitted && setSelected(i)}
                  disabled={submitted}
                >
                  <View style={[s.optionLetter, { backgroundColor: showCorrect ? c.success : showWrong ? c.destructive : isSelected ? c.primary : c.muted }]}>
                    <Text style={{ color: (isSelected || showCorrect || showWrong) ? "#fff" : c.mutedForeground, fontSize: 12, fontFamily: fontFamily.bold }}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[s.optionText, { color: c.foreground }]}>{opt}</Text>
                </HapticTouchable>
              );
            })}
          </View>
        ) : null}

        {/* Fill blank */}
        {ex.kind === "fill_blank" && payload.sentence ? (
          <View style={{ gap: spacing.md }}>
            <Text style={[s.prompt, { color: c.foreground }]}>{payload.sentence}</Text>
            <TextInput
              style={[s.fillInput, { borderColor: submitted ? (feedback?.isCorrect ? c.success : c.destructive) : c.border, color: c.foreground }]}
              placeholder="Nhập đáp án..."
              placeholderTextColor={c.placeholder}
              value={fillAnswer}
              onChangeText={setFillAnswer}
              editable={!submitted}
              autoCapitalize="none"
            />
          </View>
        ) : null}

        {/* Word form */}
        {ex.kind === "word_form" && payload.sentence ? (
          <View style={{ gap: spacing.md }}>
            <Text style={[s.prompt, { color: c.mutedForeground }]}>{payload.instruction}</Text>
            <Text style={[s.prompt, { color: c.foreground }]}>{payload.sentence}</Text>
            <Text style={{ color: c.primary, fontSize: fontSize.xs, fontFamily: fontFamily.semiBold }}>
              {`Từ gốc: ${payload.root_word ?? payload.rootWord ?? ""}`}
            </Text>
            <TextInput
              style={[s.fillInput, { borderColor: submitted ? (feedback?.isCorrect ? c.success : c.destructive) : c.border, color: c.foreground }]}
              placeholder="Nhập dạng đúng..."
              placeholderTextColor={c.placeholder}
              value={fillAnswer}
              onChangeText={setFillAnswer}
              editable={!submitted}
              autoCapitalize="none"
            />
          </View>
        ) : null}

        {/* Feedback */}
        {submitted && feedback ? (
          <View style={[s.feedbackBox, { backgroundColor: feedback.isCorrect ? c.success + "10" : c.destructive + "10" }]}>
            <Ionicons name={feedback.isCorrect ? "checkmark-circle" : "close-circle"} size={16} color={feedback.isCorrect ? c.success : c.destructive} />
            <Text style={[s.feedbackText, { color: c.foreground }]}>
              {feedback.explanation ?? (feedback.isCorrect ? "Chính xác!" : "Chưa đúng.")}
            </Text>
          </View>
        ) : null}
      </DepthCard>

      {!submitted ? (
        <DepthButton fullWidth onPress={handleSubmit} disabled={!canSubmit}>
          Kiểm tra
        </DepthButton>
      ) : (
        <DepthButton fullWidth onPress={handleNext}>
          {`Tiếp theo \u2192`}
        </DepthButton>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  desc: { fontSize: fontSize.sm, lineHeight: 20 },

  // Tabs
  tabRow: { flexDirection: "row", gap: spacing.sm },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  // Flashcard
  flashcardWrap: { gap: spacing.base },
  counter: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  flashcard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius["2xl"], padding: spacing["2xl"], minHeight: 220, justifyContent: "center", alignItems: "center" },
  cardCenter: { alignItems: "center", gap: spacing.sm },
  wordBig: { fontSize: fontSize["3xl"], fontFamily: fontFamily.bold },
  wordSmall: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  phonetic: { fontSize: fontSize.base },
  pos: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  tapHint: { fontSize: fontSize.xs, marginTop: spacing.base },
  definition: { fontSize: fontSize.xl, fontFamily: fontFamily.semiBold, textAlign: "center" },
  example: { fontSize: fontSize.sm, fontStyle: "italic", textAlign: "center" },
  ratingRow: { flexDirection: "row", gap: spacing.sm },
  ratingBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.lg },
  ratingLabel: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },

  // Done / empty
  doneWrap: { alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.md },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  doneScore: { fontSize: fontSize.base },
  emptyWrap: { alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  emptyDesc: { fontSize: fontSize.sm, textAlign: "center" },

  // Practice
  practiceWrap: { gap: spacing.base },
  practiceHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  exerciseCard: { gap: spacing.base },
  kindBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  kindBadgeText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  prompt: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 24 },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 3, borderRadius: radius.lg, padding: spacing.md },
  optionLetter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1, fontSize: fontSize.sm },
  fillInput: { borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, fontFamily: fontFamily.regular },
  feedbackBox: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  feedbackText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
});
