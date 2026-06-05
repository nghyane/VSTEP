import { useEffect } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { FlipCard } from "@/components/FlipCard";
import { FocusHeader } from "@/components/FocusHeader";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotResult } from "@/components/MascotStates";
import { SrsRatingButtons } from "@/components/SrsRatingButtons";
import {
  usePracticeSession,
  type ConcretePracticeMode,
  type PracticeItem,
  type PracticeMode,
} from "@/features/vocab/use-practice-session";
import { useVocabTopicDetail, type VocabWord } from "@/hooks/use-vocab";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

const MODE_LABEL: Record<ConcretePracticeMode, string> = {
  flashcard: "Flashcard",
  reverse: "Đảo ngược",
  typing: "Gõ từ",
  listen: "Nghe",
  fill_blank: "Điền chỗ trống",
};

const MODES: PracticeMode[] = ["flashcard", "typing", "listen", "reverse", "fill_blank", "mixed"];

export default function TopicPracticeScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode?: string }>();
  const topicId = id ?? "";
  const mode = MODES.includes((modeParam ?? "") as PracticeMode) ? (modeParam as PracticeMode) : "flashcard";
  const { data, isLoading } = useVocabTopicDetail(topicId);
  const session = usePracticeSession(data?.words ?? [], mode, topicId);

  if (isLoading || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (session.status === "done") {
    return (
      <MascotResult
        score={session.reviewed}
        total={session.reviewed}
        onBack={() => router.back()}
        backLabel="Quay lại"
      />
    );
  }

  if (session.status === "empty" || !session.current) {
    return (
      <View style={[s.emptyRoot, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <FocusHeader current={0} total={0} accentColor={c.primary} onClose={() => router.back()} c={c} />
        <View style={s.emptyBody}>
          <Text style={[s.emptyTitle, { color: c.foreground }]}>Chưa có từ phù hợp</Text>
          <Text style={[s.emptySub, { color: c.mutedForeground }]}>
            Chủ đề này chưa có dữ liệu phù hợp với chế độ luyện tập đã chọn.
          </Text>
          <DepthButton variant="secondary" onPress={() => router.back()}>
            Quay lại
          </DepthButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.background, paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FocusHeader
        current={session.index}
        total={session.total}
        accentColor={c.primary}
        onClose={() => router.back()}
        c={c}
      />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing["2xl"] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.practiceWrap}>
          <PracticeView item={session.current} session={session} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PracticeView({
  item,
  session,
}: {
  item: PracticeItem;
  session: ReturnType<typeof usePracticeSession>;
}) {
  const c = useThemeColors();
  const isFlipMode = item.mode === "flashcard" || item.mode === "reverse";
  const flipped = session.phase === "reveal";

  if (isFlipMode) {
    return (
      <>
        <PracticeFlipCard
          item={item}
          flipped={flipped}
          onToggle={() => {
            if (flipped) session.hide();
            else session.reveal();
          }}
        />
        {flipped ? (
          <SrsRatingButtons disabled={session.submitting} onRate={session.rate} />
        ) : (
          <DepthButton fullWidth onPress={session.reveal}>
            Hiện đáp án
          </DepthButton>
        )}
        <Text style={[s.hint, { color: c.subtle }]}>Đánh giá sau khi xem đáp án để cập nhật SRS.</Text>
      </>
    );
  }

  return <StaticPracticeView item={item} session={session} />;
}

function PracticeFlipCard({ item, flipped, onToggle }: { item: PracticeItem; flipped: boolean; onToggle: () => void }) {
  return (
    <FlipCard
      flipped={flipped}
      front={<PracticeFlipFace item={item} side="front" onPress={onToggle} />}
      back={<PracticeFlipFace item={item} side="back" onPress={onToggle} />}
    />
  );
}

function PracticeFlipFace({
  item,
  side,
  onPress,
}: {
  item: PracticeItem;
  side: "front" | "back";
  onPress: () => void;
}) {
  const c = useThemeColors();
  const word = item.entry.word;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.flipFace,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderBottomColor: "#CACACA",
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={s.flipHeader}>
        <View style={[s.modeBadge, { backgroundColor: c.background }]}>
          <Text style={[s.modeBadgeText, { color: c.mutedForeground }]}>{MODE_LABEL[item.mode]}</Text>
        </View>
        <HapticTouchable
          onPress={() => {
            void speakWord(word.word);
          }}
          style={s.flipVolumeBtn}
          hitSlop={8}
        >
          <Ionicons name="volume-medium-outline" size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>
      <PracticeFace item={item} side={side} />
      <Text style={[s.hint, { color: c.subtle }]}>{side === "front" ? "Nhấn để lật thẻ" : "Nhấn để lật lại"}</Text>
    </Pressable>
  );
}

function StaticPracticeView({
  item,
  session,
}: {
  item: PracticeItem;
  session: ReturnType<typeof usePracticeSession>;
}) {
  const c = useThemeColors();
  const revealed = session.phase === "reveal";
  const tone =
    session.correct === true ? c.primary : session.correct === false ? c.destructive : c.border;

  return (
    <>
      <DepthCard style={[s.promptCard, { borderColor: tone }]}>
        <View style={[s.modeBadge, { backgroundColor: c.background }]}>
          <Text style={[s.modeBadgeText, { color: c.mutedForeground }]}>{MODE_LABEL[item.mode]}</Text>
        </View>
        <PracticeFace item={item} side="front" />
      </DepthCard>

      {!revealed ? (
        <InputBlock item={item} session={session} />
      ) : (
        <>
          <DepthCard style={s.answerCard}>
            <ReviewBanner value={session.value} correct={session.correct === true} word={item.entry.word.word} />
            <PracticeFace item={item} side="back" />
          </DepthCard>
          <SrsRatingButtons disabled={session.submitting} onRate={session.rate} />
        </>
      )}
    </>
  );
}

function PracticeFace({ item, side }: { item: PracticeItem; side: "front" | "back" }) {
  const c = useThemeColors();
  const word = item.entry.word;

  if (side === "back") {
    return (
      <View style={s.faceBody}>
        <WordTitle word={word} />
        <Text style={[s.definition, { color: c.foreground }]}>{word.definition}</Text>
        {word.example ? (
          <Text style={[s.example, { color: c.mutedForeground }]}>{word.example}</Text>
        ) : null}
        {word.vstepTip ? (
          <Text style={[s.tip, { color: c.info, backgroundColor: c.infoTint }]}>{word.vstepTip}</Text>
        ) : null}
      </View>
    );
  }

  switch (item.mode) {
    case "flashcard":
      return (
        <View style={s.faceBody}>
          <WordTitle word={word} />
        </View>
      );
    case "reverse":
      return (
        <View style={s.faceBody}>
          <Text style={[s.faceKicker, { color: c.mutedForeground }]}>Nhớ lại từ tiếng Anh</Text>
          <Text style={[s.definitionPrompt, { color: c.foreground }]}>{word.definition}</Text>
          <PartOfSpeech text={word.partOfSpeech} />
        </View>
      );
    case "typing":
      return (
        <View style={s.faceBody}>
          <Text style={[s.faceKicker, { color: c.mutedForeground }]}>Gõ từ tiếng Anh</Text>
          <Text style={[s.definitionPrompt, { color: c.foreground }]}>{word.definition}</Text>
          <PartOfSpeech text={word.partOfSpeech} />
        </View>
      );
    case "listen":
      return <ListenPrompt word={word} />;
    case "fill_blank":
      return (
        <View style={s.faceBody}>
          <Text style={[s.faceKicker, { color: c.mutedForeground }]}>Điền vào chỗ trống</Text>
          <Text style={[s.sentencePrompt, { color: c.foreground }]}>{item.maskedSentence}</Text>
        </View>
      );
  }
}

function WordTitle({ word }: { word: VocabWord }) {
  const c = useThemeColors();
  return (
    <>
      <Text style={[s.wordTitle, { color: c.foreground }]}>{word.word}</Text>
      {word.phonetic ? <Text style={[s.phonetic, { color: c.subtle }]}>{word.phonetic}</Text> : null}
      <PartOfSpeech text={word.partOfSpeech} />
    </>
  );
}

function ListenPrompt({ word }: { word: VocabWord }) {
  const c = useThemeColors();

  useEffect(() => {
    void speakWord(word.word);
    return () => {
      void Speech.stop().catch(() => undefined);
    };
  }, [word.word]);

  return (
    <View style={s.faceBody}>
      <Text style={[s.faceKicker, { color: c.mutedForeground }]}>Nghe và gõ từ</Text>
      <HapticTouchable
        onPress={() => {
          void speakWord(word.word);
        }}
        style={[s.listenButton, { backgroundColor: c.primaryTint, borderColor: c.primary }]}
      >
        <Ionicons name="volume-high" size={40} color={c.primary} />
      </HapticTouchable>
      <PartOfSpeech text={word.partOfSpeech} />
    </View>
  );
}

async function speakWord(word: string) {
  await Speech.stop().catch(() => undefined);
  Speech.speak(word, { language: "en-US", rate: 0.9 });
}

function InputBlock({
  item,
  session,
}: {
  item: PracticeItem;
  session: ReturnType<typeof usePracticeSession>;
}) {
  const c = useThemeColors();
  const placeholder = item.mode === "fill_blank" ? "Điền từ còn thiếu..." : "Gõ từ tiếng Anh...";

  return (
    <>
      <TextInput
        value={session.value}
        onChangeText={session.setValue}
        placeholder={placeholder}
        placeholderTextColor={c.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={() => {
          if (session.value.trim()) session.check();
        }}
        style={[s.input, { borderColor: c.primary, color: c.foreground, backgroundColor: c.surface }]}
      />
      <DepthButton fullWidth disabled={!session.value.trim()} onPress={session.check}>
        Kiểm tra
      </DepthButton>
    </>
  );
}

function ReviewBanner({ value, correct, word }: { value: string; correct: boolean; word: string }) {
  const c = useThemeColors();
  const color = correct ? c.primary : c.destructive;

  return (
    <View style={[s.review, { backgroundColor: correct ? c.primaryTint : c.destructiveTint }]}>
      <Ionicons name={correct ? "checkmark-circle" : "close-circle"} size={18} color={color} />
      <View style={s.reviewCopy}>
        <Text style={[s.reviewTitle, { color }]}>{correct ? "Chính xác!" : "Chưa đúng"}</Text>
        <Text style={[s.reviewText, { color: c.foreground }]}>
          Bạn trả lời: {value.trim() || "(bỏ qua)"}
        </Text>
        {!correct ? <Text style={[s.reviewText, { color: c.primary }]}>Đáp án đúng: {word}</Text> : null}
      </View>
    </View>
  );
}

function PartOfSpeech({ text }: { text: string | null }) {
  const c = useThemeColors();
  if (!text) return null;
  return (
    <View style={[s.pos, { backgroundColor: c.background }]}>
      <Text style={[s.posText, { color: c.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
  },
  practiceWrap: { width: "100%", gap: spacing.base },
  emptyRoot: { flex: 1 },
  emptyBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  emptySub: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  promptCard: {
    minHeight: 220,
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.lg,
  },
  answerCard: { gap: spacing.md, padding: spacing.lg },
  flipFace: {
    width: "100%",
    minHeight: 360,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
  },
  flipHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  flipVolumeBtn: { padding: spacing.xs },
  modeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  modeBadgeText: { fontSize: 11, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  faceBody: { minHeight: 136, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  faceKicker: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: "uppercase", textAlign: "center" },
  wordTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  phonetic: { fontSize: fontSize.sm, textAlign: "center" },
  definitionPrompt: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center", lineHeight: 28 },
  sentencePrompt: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, textAlign: "center", lineHeight: 26 },
  definition: { fontSize: fontSize.base, fontFamily: fontFamily.bold, textAlign: "center", lineHeight: 22 },
  example: { fontSize: fontSize.sm, fontStyle: "italic", textAlign: "center", lineHeight: 20 },
  tip: { fontSize: fontSize.xs, textAlign: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  pos: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  posText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  listenButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: radius.button,
    paddingHorizontal: spacing.base,
    fontSize: fontSize.base,
    fontFamily: fontFamily.regular,
  },
  review: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  reviewCopy: { flex: 1, gap: 2 },
  reviewTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  reviewText: { fontSize: fontSize.sm, lineHeight: 20 },
  hint: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.xs },
});
