import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotResult } from "@/components/MascotStates";
import {
  startSpeakingDrillSession,
  submitSpeakingDrillAttempt,
  useSpeakingDrillDetail,
} from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";
const COLOR_TEXT = "#A07800";

function accuracyFor(expected: string, answer: string) {
  const a = expected.toLowerCase().trim().split(/\s+/);
  const b = answer.toLowerCase().trim().split(/\s+/);
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

  const startMutation = useMutation({
    mutationFn: () => startSpeakingDrillSession(drillId ?? ""),
    onSuccess: (res) => setSessionId(res.sessionId),
  });

  if (isLoading || !drill) {
    return <View style={[s.fullCenter, { backgroundColor: c.background }]}><ActivityIndicator color={COLOR} size="large" /></View>;
  }

  if (!sessionId) {
    return (
      <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}> 
        <HapticTouchable onPress={() => router.back()} style={s.backRow}>
          <Ionicons name="arrow-back" size={20} color={c.foreground} />
          <Text style={[s.backText, { color: c.foreground }]}>Speaking Drills</Text>
        </HapticTouchable>

        <DepthCard style={s.previewCard}>
          <View style={[s.levelBadge, { backgroundColor: COLOR + "25" }]}> 
            <Text style={[s.levelText, { color: COLOR_TEXT }]}>{drill.level}</Text>
          </View>
          <Text style={[s.title, { color: c.foreground }]}>{drill.title}</Text>
          {drill.description ? <Text style={[s.sub, { color: c.mutedForeground }]}>{drill.description}</Text> : null}
          <Text style={[s.meta, { color: c.subtle }]}>{drill.sentences.length} câu · {drill.estimatedMinutes ?? 5} phút</Text>
          <DepthButton onPress={() => startMutation.mutate()} disabled={startMutation.isPending} style={{ backgroundColor: COLOR, borderColor: COLOR }}>
            {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu drill"}
          </DepthButton>
        </DepthCard>
      </ScrollView>
    );
  }

  return <DrillSessionScreen drill={drill} sessionId={sessionId} onBack={() => router.back()} />;
}

function DrillSessionScreen({ drill, sessionId, onBack }: { drill: NonNullable<ReturnType<typeof useSpeakingDrillDetail>["data"]>; sessionId: string; onBack: () => void }) {
  const c = useThemeColors();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const current = drill.sentences[index] ?? null;
  const done = index >= drill.sentences.length;
  const avg = useMemo(() => scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, [scores]);

  const attemptMutation = useMutation({
    mutationFn: () => {
      if (!current) throw new Error("No sentence");
      const pct = accuracyFor(current.text, answer);
      return submitSpeakingDrillAttempt(sessionId, current.id, "dictation", answer, pct);
    },
    onSuccess: (res) => {
      setScores((prev) => [...prev, res.accuracyPercent]);
      setAnswer("");
      setIndex((value) => value + 1);
    },
  });

  if (done) {
    return <MascotResult score={avg} total={100} onBack={onBack} backLabel="Quay lại" />;
  }

  if (!current) return null;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}> 
      <View style={[s.topBar, { borderBottomColor: c.borderLight }]}> 
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topTitle, { color: c.foreground }]}>{index + 1}/{drill.sentences.length}</Text>
      </View>

      <ScrollView contentContainerStyle={s.sessionScroll}>
        <DepthCard style={s.card}>
          <Text style={[s.promptLabel, { color: COLOR_TEXT }]}>Nghe/đọc và nhập lại câu</Text>
          <Text style={[s.sentence, { color: c.foreground }]}>{current.text}</Text>
          {current.translation ? <Text style={[s.translation, { color: c.mutedForeground }]}>{current.translation}</Text> : null}
        </DepthCard>

        <DepthCard style={s.card}>
          <TextInput
            style={[s.input, { color: c.foreground, borderColor: c.border }]}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Nhập câu bạn nghe/đọc được..."
            placeholderTextColor={c.placeholder}
            multiline
          />
          <DepthButton
            fullWidth
            disabled={answer.trim().length === 0 || attemptMutation.isPending}
            onPress={() => attemptMutation.mutate()}
            style={{ backgroundColor: COLOR, borderColor: COLOR }}
          >
            {attemptMutation.isPending ? "Đang lưu..." : "Nộp câu này"}
          </DepthButton>
        </DepthCard>
      </ScrollView>
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
  meta: { fontSize: fontSize.xs },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  closeBtn: { padding: spacing.xs },
  topTitle: { flex: 1, textAlign: "center", fontSize: fontSize.sm, fontFamily: fontFamily.bold, marginRight: 32 },
  sessionScroll: { padding: spacing.xl, gap: spacing.lg },
  card: { padding: spacing.lg, gap: spacing.md },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  sentence: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, lineHeight: 28 },
  translation: { fontSize: fontSize.sm, lineHeight: 20 },
  input: { minHeight: 100, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, fontSize: fontSize.sm, textAlignVertical: "top" },
});
