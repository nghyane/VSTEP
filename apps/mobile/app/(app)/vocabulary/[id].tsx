import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import {
  useVocabularyTopic,
  useTopicProgress,
  useToggleKnown,
} from "@/hooks/use-vocabulary";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { VocabularyWord } from "@/types/api";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.25;
const SWIPE_OUT_DURATION = 300;

type Mode = "list" | "flashcard";

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function VocabularyTopicDetailScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: topic, isLoading, error, refetch } = useVocabularyTopic(id!);
  const { data: progress } = useTopicProgress(id!);
  const toggle = useToggleKnown();

  const [mode, setMode] = useState<Mode>("list");
  const [flashcardIndex, setFlashcardIndex] = useState(0);

  const knownWordIds = progress?.knownWordIds ?? [];
  const totalWords = progress?.totalWords ?? topic?.words.length ?? 0;
  const knownCount = progress?.knownCount ?? 0;
  const progressRatio = totalWords > 0 ? knownCount / totalWords : 0;

  // Ref to always have fresh knownWordIds in callbacks (avoids stale closures)
  const knownIdsRef = useRef(knownWordIds);
  knownIdsRef.current = knownWordIds;

  const isWordKnown = useCallback(
    (wordId: string) => knownIdsRef.current.includes(wordId),
    [],
  );

  const handleToggleKnown = useCallback(
    (wordId: string) => {
      toggle.mutate({ wordId, known: !knownIdsRef.current.includes(wordId) });
    },
    [toggle],
  );

  // Mark word known/unknown — called IMMEDIATELY on swipe detect (no delay)
  function markWord(known: boolean) {
    const words = topic?.words ?? [];
    const word = words[flashcardIndex];
    if (word) {
      const currentlyKnown = knownIdsRef.current.includes(word.id);
      if (known !== currentlyKnown) {
        toggle.mutate({ wordId: word.id, known });
      }
    }
  }

  // Advance to next card — called AFTER fly-out animation completes
  function nextCard() {
    setFlashcardIndex((i) => i + 1);
  }

  // Button handler (does both at once since no animation needed)
  function advanceCard(known: boolean) {
    markWord(known);
    nextCard();
  }

  // Refs for SwipeableFlashcard — always reads latest version
  const markWordRef = useRef(markWord);
  markWordRef.current = markWord;
  const nextCardRef = useRef(nextCard);
  nextCardRef.current = nextCard;

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;
  if (!topic) return <ErrorScreen message="Không tìm thấy chủ đề" />;

  const words = topic.words;
  const isFinished = flashcardIndex >= words.length;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={topic.name} />
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: c.border }]}>
        <HapticTouchable
          style={[styles.tab, mode === "list" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          onPress={() => setMode("list")}
        >
          <Ionicons name="list" size={18} color={mode === "list" ? c.primary : c.mutedForeground} />
          <Text style={[styles.tabText, { color: mode === "list" ? c.primary : c.mutedForeground }]}>
            Danh sách
          </Text>
        </HapticTouchable>
        <HapticTouchable
          style={[styles.tab, mode === "flashcard" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          onPress={() => { setMode("flashcard"); setFlashcardIndex(0); }}
        >
          <Ionicons name="copy-outline" size={18} color={mode === "flashcard" ? c.primary : c.mutedForeground} />
          <Text style={[styles.tabText, { color: mode === "flashcard" ? c.primary : c.mutedForeground }]}>
            Flashcard
          </Text>
        </HapticTouchable>
      </View>

      {mode === "list" ? (
        <BouncyScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Topic Header */}
          <View style={[styles.headerCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.topicName, { color: c.foreground }]}>{topic.name}</Text>
            <Text style={[styles.topicDesc, { color: c.mutedForeground }]}>{topic.description}</Text>
            <Text style={[styles.progressText, { color: c.mutedForeground }]}>
              {knownCount}/{totalWords} từ đã biết
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: c.muted }]}>
              <View style={[styles.progressBarFill, { backgroundColor: c.success, width: `${progressRatio * 100}%` }]} />
            </View>
          </View>

          {words.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              known={isWordKnown(word.id)}
              onToggle={() => handleToggleKnown(word.id)}
              colors={c}
            />
          ))}
        </BouncyScrollView>
      ) : (
        <View style={[styles.flashcardContainer, { backgroundColor: c.background }]}>
          {/* Swipe hints */}
          <View style={styles.hintRow}>
            <View style={styles.hintItem}>
              <Ionicons name="arrow-back" size={14} color={c.destructive} />
              <Text style={[styles.hintText, { color: c.destructive }]}>Chưa biết</Text>
            </View>
            <Text style={[styles.flashcardProgress, { color: c.mutedForeground }]}>
              {Math.min(flashcardIndex + 1, words.length)}/{words.length}
            </Text>
            <View style={styles.hintItem}>
              <Text style={[styles.hintText, { color: c.success }]}>Đã biết</Text>
              <Ionicons name="arrow-forward" size={14} color={c.success} />
            </View>
          </View>

          {!isFinished ? (
            <SwipeableFlashcard
              key={flashcardIndex}
              word={words[flashcardIndex]}
              known={isWordKnown(words[flashcardIndex].id)}
              onMark={markWordRef}
              onDone={nextCardRef}
              colors={c}
            />
          ) : (
            <View style={styles.finishedContainer}>
              <View style={[styles.finishedCircle, { backgroundColor: c.success + "18" }]}>
                <Ionicons name="checkmark-done" size={48} color={c.success} />
              </View>
              <Text style={[styles.finishedTitle, { color: c.foreground }]}>Hoàn thành!</Text>
              <Text style={[styles.finishedSubtitle, { color: c.mutedForeground }]}>
                Bạn đã xem hết {words.length} từ trong chủ đề này
              </Text>
              <HapticTouchable
                style={[styles.restartBtn, { backgroundColor: c.primary }]}
                onPress={() => setFlashcardIndex(0)}
              >
                <Ionicons name="refresh" size={18} color={c.primaryForeground} />
                <Text style={[styles.restartBtnText, { color: c.primaryForeground }]}>Làm lại</Text>
              </HapticTouchable>
              <HapticTouchable
                style={[styles.listBtn, { borderColor: c.border }]}
                onPress={() => setMode("list")}
              >
                <Ionicons name="list" size={18} color={c.foreground} />
                <Text style={[styles.restartBtnText, { color: c.foreground }]}>Về danh sách</Text>
              </HapticTouchable>
            </View>
          )}

          {/* Bottom action buttons */}
          {!isFinished && (
            <View style={styles.flashcardActions}>
              <HapticTouchable
                style={[styles.actionBtn, { backgroundColor: c.destructive + "12", borderColor: c.destructive + "40" }]}
                onPress={() => advanceCard(false)}
              >
                <Ionicons name="close" size={28} color={c.destructive} />
              </HapticTouchable>
              <HapticTouchable
                style={[styles.actionBtn, { backgroundColor: c.success + "12", borderColor: c.success + "40" }]}
                onPress={() => advanceCard(true)}
              >
                <Ionicons name="checkmark" size={28} color={c.success} />
              </HapticTouchable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Swipeable Flashcard with 3D Flip ───────────────────────────────────────

function SwipeableFlashcard({
  word,
  known,
  onMark,
  onDone,
  colors: c,
}: {
  word: VocabularyWord;
  known: boolean;
  onMark: React.RefObject<(known: boolean) => void>;
  onDone: React.RefObject<() => void>;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const position = useRef(new Animated.ValueXY()).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const swiping = useRef(false);

  // Enter animation — run once on mount
  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      damping: 18,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  const flip = useCallback(() => {
    if (swiping.current) return;
    const toFlipped = !flipped;
    setFlipped(toFlipped);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(flipAnim, {
      toValue: toFlipped ? 180 : 0,
      damping: 14,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [flipped, flipAnim]);

  // PanResponder — stable refs, no stale closures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
        onPanResponderMove: (_, g) => {
          position.setValue({ x: g.dx, y: 0 });
        },
        onPanResponderRelease: (_, g) => {
          if (swiping.current) return;

          if (g.dx > SWIPE_THRESHOLD) {
            // Swipe RIGHT = "Đã biết"
            swiping.current = true;
            onMark.current(true); // ← mutation fires IMMEDIATELY
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Animated.timing(position, {
              toValue: { x: SCREEN_W * 1.5, y: 0 },
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }).start(() => onDone.current()); // ← advance card after fly-out
          } else if (g.dx < -SWIPE_THRESHOLD) {
            // Swipe LEFT = "Chưa biết"
            swiping.current = true;
            onMark.current(false); // ← mutation fires IMMEDIATELY
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Animated.timing(position, {
              toValue: { x: -SCREEN_W * 1.5, y: 0 },
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }).start(() => onDone.current()); // ← advance card after fly-out
          } else {
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              damping: 18,
              stiffness: 200,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [position, onMark, onDone],
  );

  // Card rotation from drag
  const cardRotate = position.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp",
  });

  // Overlay opacity
  const leftOverlay = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const rightOverlay = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // 3D flip
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: ["0deg", "90deg", "180deg"],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: ["180deg", "90deg", "0deg"],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  // Enter scale
  const enterScale = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <Animated.View
      style={[
        styles.swipeCardOuter,
        {
          transform: [
            { translateX: position.x },
            { rotate: cardRotate },
            { scale: enterScale },
          ],
          opacity: enterAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Swipe overlay badges */}
      <Animated.View style={[styles.overlayBadge, styles.overlayLeft, { opacity: leftOverlay }]}>
        <View style={[styles.overlayBadgeInner, { borderColor: c.destructive }]}>
          <Ionicons name="close" size={32} color={c.destructive} />
          <Text style={[styles.overlayBadgeText, { color: c.destructive }]}>Chưa biết</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.overlayBadge, styles.overlayRight, { opacity: rightOverlay }]}>
        <View style={[styles.overlayBadgeInner, { borderColor: c.success }]}>
          <Ionicons name="checkmark" size={32} color={c.success} />
          <Text style={[styles.overlayBadgeText, { color: c.success }]}>Đã biết</Text>
        </View>
      </Animated.View>

      <Pressable style={styles.cardPressable} onPress={flip}>
        {/* Front Face */}
        <Animated.View
          style={[
            styles.flashcard,
            { backgroundColor: c.card, borderColor: c.border },
            { transform: [{ perspective: 1000 }, { rotateY: frontRotateY }], opacity: frontOpacity },
          ]}
          pointerEvents={flipped ? "none" : "auto"}
        >
          {known && (
            <View style={[styles.knownIndicator, { backgroundColor: c.success + "18" }]}>
              <Ionicons name="checkmark-circle" size={16} color={c.success} />
              <Text style={[styles.knownIndicatorText, { color: c.success }]}>Đã biết</Text>
            </View>
          )}
          <Text style={[styles.flashcardWord, { color: c.foreground }]}>{word.word}</Text>
          {word.phonetic ? (
            <Text style={[styles.flashcardPhonetic, { color: c.mutedForeground }]}>{word.phonetic}</Text>
          ) : null}
          <View style={[styles.posBadge, { backgroundColor: c.secondary }]}>
            <Text style={[styles.posBadgeText, { color: c.secondaryForeground }]}>{word.partOfSpeech}</Text>
          </View>
          <View style={styles.tapHintRow}>
            <Ionicons name="hand-left-outline" size={14} color={c.mutedForeground} />
            <Text style={[styles.tapHint, { color: c.mutedForeground }]}>Chạm để lật • Kéo để chọn</Text>
          </View>
        </Animated.View>

        {/* Back Face */}
        <Animated.View
          style={[
            styles.flashcard,
            styles.flashcardBack,
            { backgroundColor: c.card, borderColor: c.border },
            { transform: [{ perspective: 1000 }, { rotateY: backRotateY }], opacity: backOpacity },
          ]}
          pointerEvents={flipped ? "auto" : "none"}
        >
          <Text style={[styles.backWord, { color: c.primary }]}>{word.word}</Text>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Text style={[styles.flashcardDefinition, { color: c.foreground }]}>{word.definition}</Text>
          <Text style={[styles.flashcardExplanation, { color: c.mutedForeground }]}>{word.explanation}</Text>
          {word.examples.length > 0 ? (
            <View style={styles.flashcardExamples}>
              {word.examples.map((ex, i) => (
                <Text key={i} style={[styles.flashcardExample, { color: c.foreground }]}>
                  "{ex}"
                </Text>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Word Card (List mode) ──────────────────────────────────────────────────

function WordCard({
  word,
  known,
  onToggle,
  colors: c,
}: {
  word: VocabularyWord;
  known: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[styles.wordCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.wordHeader}>
        <View style={styles.wordTitleRow}>
          <Text style={[styles.wordText, { color: c.foreground }]}>{word.word}</Text>
          {known ? <Ionicons name="checkmark-circle" size={20} color={c.success} /> : null}
        </View>
        {word.phonetic ? (
          <Text style={[styles.phonetic, { color: c.mutedForeground }]}>{word.phonetic}</Text>
        ) : null}
        <View style={[styles.posBadge, { backgroundColor: c.secondary }]}>
          <Text style={[styles.posBadgeText, { color: c.secondaryForeground }]}>{word.partOfSpeech}</Text>
        </View>
      </View>

      <Text style={[styles.definition, { color: c.foreground }]}>{word.definition}</Text>
      <Text style={[styles.explanation, { color: c.mutedForeground }]}>{word.explanation}</Text>

      {word.examples.length > 0 ? (
        <View style={styles.examplesContainer}>
          {word.examples.map((ex, i) => (
            <Text key={i} style={[styles.exampleText, { color: c.mutedForeground }]}>"{ex}"</Text>
          ))}
        </View>
      ) : null}

      <HapticTouchable
        style={[
          styles.toggleBtn,
          known
            ? { backgroundColor: c.success + "18", borderColor: c.success }
            : { backgroundColor: c.muted, borderColor: c.border },
        ]}
        onPress={onToggle}
      >
        <Ionicons
          name={known ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={known ? c.success : c.mutedForeground}
        />
        <Text style={[styles.toggleBtnText, { color: known ? c.success : c.mutedForeground }]}>
          {known ? "Đã biết" : "Chưa biết"}
        </Text>
      </HapticTouchable>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.md },

  /* Tab Bar */
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: spacing.xl },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.xs, paddingVertical: spacing.md,
  },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  /* Topic Header */
  headerCard: {
    borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  topicName: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  topicDesc: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, lineHeight: 20 },
  progressText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, marginTop: spacing.xs },
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, borderRadius: 3 },

  /* Word Card */
  wordCard: {
    borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  wordHeader: { gap: spacing.xs },
  wordTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordText: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  phonetic: { fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  posBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  posBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  definition: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 22 },
  explanation: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, lineHeight: 20 },
  examplesContainer: { gap: spacing.xs },
  exampleText: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, fontStyle: "italic", lineHeight: 20 },
  toggleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.sm, marginTop: spacing.xs,
  },
  toggleBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  /* Flashcard Mode */
  flashcardContainer: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  hintRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.sm, marginBottom: spacing.md,
  },
  hintItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  hintText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  flashcardProgress: {
    fontSize: fontSize.sm, fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"],
  },

  /* Swipeable card */
  swipeCardOuter: { flex: 1 },
  cardPressable: { flex: 1 },

  flashcard: {
    flex: 1, borderWidth: 1, borderRadius: radius["2xl"], padding: spacing.xl,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
    backfaceVisibility: "hidden",
  },
  flashcardBack: {
    ...StyleSheet.absoluteFillObject,
  },

  knownIndicator: {
    position: "absolute", top: spacing.base, right: spacing.base,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full,
  },
  knownIndicatorText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },

  flashcardWord: { fontSize: 36, fontFamily: fontFamily.extraBold, textAlign: "center" },
  flashcardPhonetic: { fontSize: fontSize.lg, fontFamily: fontFamily.regular, textAlign: "center", marginTop: spacing.sm },

  tapHintRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing["2xl"] },
  tapHint: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },

  backWord: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, textAlign: "center", marginBottom: spacing.sm },
  divider: { width: 40, height: 2, borderRadius: 1, marginBottom: spacing.md },

  flashcardDefinition: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center", lineHeight: 28 },
  flashcardExplanation: { fontSize: fontSize.base, fontFamily: fontFamily.regular, textAlign: "center", lineHeight: 22, marginTop: spacing.sm },
  flashcardExamples: { marginTop: spacing.md, gap: spacing.sm },
  flashcardExample: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, fontStyle: "italic", textAlign: "center", lineHeight: 20 },

  /* Overlay badges */
  overlayBadge: { position: "absolute", top: spacing["2xl"], zIndex: 10 },
  overlayLeft: { left: spacing.xl },
  overlayRight: { right: spacing.xl },
  overlayBadgeInner: {
    borderWidth: 2.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    alignItems: "center",
  },
  overlayBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: 2 },

  /* Action buttons */
  flashcardActions: {
    flexDirection: "row", justifyContent: "center", gap: spacing["2xl"],
    paddingVertical: spacing.lg,
  },
  actionBtn: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 1.5,
    justifyContent: "center", alignItems: "center",
  },

  /* Finished */
  finishedContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  finishedCircle: {
    width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center", marginBottom: spacing.lg,
  },
  finishedTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  finishedSubtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, textAlign: "center", marginTop: spacing.sm },
  restartBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.xl,
  },
  listBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.md,
    borderWidth: 1,
  },
  restartBtnText: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
});
