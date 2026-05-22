import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotResult } from "@/components/MascotStates";
import {
  SpeakingDrillDetail,
  startSpeakingDrillSession,
  submitSpeakingDrillAttempt,
  useSpeakingDrillDetail,
} from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type DrillMode = "shadowing" | "dictation";
type AttemptScore = { accuracy: number | null; mode: DrillMode };

function accuracyFor(expected: string, answer: string) {
  const a = expected.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const b = answer.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (a.length === 0) return 0;
  const correct = a.filter((word, i) => b[i] === word).length;
  return Math.round((correct / a.length) * 100);
}

export default function SpeakingDrillDetailScreen() {
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const { data: drill, isLoading } = useSpeakingDrillDetail(drillId ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const speakingColor = c.skillSpeaking;
  const speakingText = c.coinDark;

  const startMutation = useMutation({
    mutationFn: () => startSpeakingDrillSession(drillId ?? ""),
    onSuccess: (res) => setSessionId(res.sessionId),
  });

  if (isLoading || !drill) {
    return <View style={[s.fullCenter, { backgroundColor: c.background }]}><ActivityIndicator color={speakingColor} size="large" /></View>;
  }

  if (!sessionId) {
    return (
      <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}>
        <HapticTouchable onPress={() => router.back()} style={s.backRow}>
          <Ionicons name="arrow-back" size={20} color={c.foreground} />
          <Text style={[s.backText, { color: c.foreground }]}>Speaking Drills</Text>
        </HapticTouchable>

        <DepthCard style={s.previewCard}>
          <View style={[s.levelBadge, { backgroundColor: c.coinTint }]}>
            <Text style={[s.levelText, { color: speakingText }]}>{drill.level}</Text>
          </View>
          <Text style={[s.title, { color: c.foreground }]}>{drill.title}</Text>
          {drill.description ? <Text style={[s.sub, { color: c.mutedForeground }]}>{drill.description}</Text> : null}
          <View style={s.previewMetaRow}>
            <View style={[s.previewMeta, { backgroundColor: c.coinTint }]}>
              <Ionicons name="volume-high-outline" size={16} color={speakingText} />
              <Text style={[s.previewMetaText, { color: speakingText }]}>Shadowing</Text>
            </View>
            <View style={[s.previewMeta, { backgroundColor: c.surfaceTint }]}>
              <Ionicons name="create-outline" size={16} color={c.foreground} />
              <Text style={[s.previewMetaText, { color: c.foreground }]}>{drill.sentences.length} câu</Text>
            </View>
          </View>
          <Text style={[s.meta, { color: c.subtle }]}>{drill.estimatedMinutes ?? 5} phút · TTS mẫu + feedback từng câu</Text>
          <DepthButton onPress={() => startMutation.mutate()} disabled={startMutation.isPending} style={{ backgroundColor: speakingColor, borderColor: speakingColor }}>
            {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu drill"}
          </DepthButton>
        </DepthCard>
      </ScrollView>
    );
  }

  return <DrillSessionScreen drill={drill} sessionId={sessionId} onBack={() => router.back()} />;
}

function DrillSessionScreen({ drill, sessionId, onBack }: { drill: SpeakingDrillDetail; sessionId: string; onBack: () => void }) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<DrillMode>("shadowing");
  const [scores, setScores] = useState<AttemptScore[]>([]);
  const [lastFeedback, setLastFeedback] = useState<AttemptScore | null>(null);
  const current = drill.sentences[index] ?? null;
  const done = index >= drill.sentences.length;
  const gradedScores = scores.flatMap((score) => (score.accuracy == null ? [] : [score.accuracy]));
  const avg = useMemo(
    () => gradedScores.length ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length) : 100,
    [gradedScores],
  );
  const progressPct = Math.round(((Math.min(index + 1, drill.sentences.length)) / drill.sentences.length) * 100);
  const speakingColor = c.skillSpeaking;
  const speakingText = c.coinDark;

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, [index]);

  const speakCurrent = () => {
    if (!current) return;
    Speech.stop();
    Speech.speak(current.text, { language: "en-US", rate: 0.88 });
  };

  const attemptMutation = useMutation({
    mutationFn: () => {
      if (!current) throw new Error("No sentence");
      const trimmed = answer.trim();
      const pct = trimmed.length > 0 ? accuracyFor(current.text, trimmed) : null;
      return submitSpeakingDrillAttempt(sessionId, current.id, mode, trimmed || null, pct);
    },
    onSuccess: (res) => {
      const pct = answer.trim().length > 0 ? res.accuracyPercent : null;
      const result = { accuracy: pct, mode };
      setScores((prev) => [...prev, result]);
      setLastFeedback(result);
      setAnswer("");
      setIndex((value) => value + 1);
    },
  });

  if (done) {
    return <MascotResult score={avg} total={100} onBack={onBack} backLabel="Quay lại" />;
  }

  if (!current) return null;

  const canSubmit = mode === "shadowing" || answer.trim().length > 0;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.md, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={s.topCenter}>
          <Text style={[s.topTitle, { color: c.foreground }]}>{index + 1}/{drill.sentences.length}</Text>
          <View style={[s.progressTrack, { backgroundColor: c.borderLight }]}>
            <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: speakingColor }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.sessionScroll, { paddingBottom: insets.bottom + spacing["2xl"] }]}>
        <View style={[s.modeToggle, { backgroundColor: c.surfaceTint }]}>
          <ModeButton active={mode === "shadowing"} label="Shadowing" icon="volume-high-outline" onPress={() => setMode("shadowing")} />
          <ModeButton active={mode === "dictation"} label="Dictation" icon="create-outline" onPress={() => setMode("dictation")} />
        </View>

        {lastFeedback ? <FeedbackCard feedback={lastFeedback} /> : null}

        <DepthCard style={s.card}>
          <Text style={[s.promptLabel, { color: speakingText }]}>
            {mode === "shadowing" ? "Nghe mẫu, nói theo, rồi nhập transcript nếu muốn chấm khớp" : "Nghe mẫu và nhập lại câu"}
          </Text>
          <Text style={[s.sentence, { color: c.foreground }]}>{current.text}</Text>
          {current.translation ? <Text style={[s.translation, { color: c.mutedForeground }]}>{current.translation}</Text> : null}
          <HapticTouchable onPress={speakCurrent} style={[s.speakButton, { backgroundColor: c.coinTint }]}>
            <Ionicons name="play" size={18} color={speakingText} />
            <Text style={[s.speakText, { color: speakingText }]}>Nghe mẫu</Text>
          </HapticTouchable>
        </DepthCard>

        <DepthCard style={s.card}>
          <TextInput
            style={[s.input, { color: c.foreground, borderColor: c.border }]}
            value={answer}
            onChangeText={setAnswer}
            placeholder={mode === "shadowing" ? "Transcript sau khi nói, có thể bỏ trống..." : "Nhập câu bạn nghe được..."}
            placeholderTextColor={c.placeholder}
            multiline
          />
          <DepthButton
            fullWidth
            disabled={!canSubmit || attemptMutation.isPending}
            onPress={() => attemptMutation.mutate()}
            style={{ backgroundColor: speakingColor, borderColor: speakingColor }}
          >
            {attemptMutation.isPending ? "Đang lưu..." : mode === "shadowing" ? "Đã nói xong" : "Nộp câu này"}
          </DepthButton>
        </DepthCard>
      </ScrollView>
    </View>
  );
}

function ModeButton({ active, label, icon, onPress }: { active: boolean; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable onPress={onPress} style={[s.modeButton, { backgroundColor: active ? c.card : "transparent" }]}>
      <Ionicons name={icon} size={16} color={active ? c.coinDark : c.mutedForeground} />
      <Text style={[s.modeText, { color: active ? c.foreground : c.mutedForeground }]}>{label}</Text>
    </HapticTouchable>
  );
}

function FeedbackCard({ feedback }: { feedback: AttemptScore }) {
  const c = useThemeColors();
  const scored = feedback.accuracy != null;
  return (
    <View style={[s.feedbackCard, { backgroundColor: scored ? c.coinTint : c.infoTint, borderColor: scored ? c.skillSpeaking : c.info }]}>
      <Ionicons name={scored ? "checkmark-circle" : "mic-circle"} size={18} color={scored ? c.coinDark : c.info} />
      <Text style={[s.feedbackText, { color: c.foreground }]}>
        {scored ? `Câu trước khớp ${feedback.accuracy}%.` : "Câu trước đã lưu shadowing. Nhập transcript nếu muốn có điểm khớp."}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  previewCard: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  levelText: { fontSize: 10, fontFamily: fontFamily.bold },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  sub: { fontSize: fontSize.sm, lineHeight: 20, textAlign: "center" },
  previewMetaRow: { flexDirection: "row", gap: spacing.sm },
  previewMeta: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  previewMetaText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  meta: { fontSize: fontSize.xs },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1 },
  closeBtn: { padding: spacing.xs },
  topCenter: { flex: 1, alignItems: "center", gap: spacing.xs, marginRight: 32 },
  topTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  progressTrack: { width: "72%", height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.full },
  sessionScroll: { padding: spacing.xl, gap: spacing.lg },
  modeToggle: { flexDirection: "row", borderRadius: radius.full, padding: 4, gap: 4 },
  modeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.sm, borderRadius: radius.full },
  modeText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  feedbackCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  feedbackText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  card: { padding: spacing.lg, gap: spacing.md },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  sentence: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, lineHeight: 28 },
  translation: { fontSize: fontSize.sm, lineHeight: 20 },
  speakButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  speakText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  input: { minHeight: 100, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, fontSize: fontSize.sm, textAlignVertical: "top" },
});
