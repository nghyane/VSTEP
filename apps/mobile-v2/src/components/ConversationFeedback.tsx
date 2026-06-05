// ConversationFeedback — collapsible per-turn feedback panel.
// Mirrors apps/frontend-v3/src/features/practice/components/ConversationFeedback.tsx
// Sections:
// 1. Summary toggle: vocab used / target + grammar status
// 2. Sử dụng từ — vocab check list with ✓/✗
// 3. Ngữ pháp — corrections list with wrong → correct + explanation
// 4. Cách nói tốt hơn — better suggestion + speak (expo-speech) + better_ipa
import { useState } from "react";
import * as Speech from "expo-speech";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";
import type { SpeakingConversationTurnFeedback } from "@/hooks/use-practice";

interface Props {
  feedback: SpeakingConversationTurnFeedback;
}

export function ConversationFeedback({ feedback }: Props) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);

  const grammarCount = feedback.grammarCorrections?.length ?? 0;
  const vocabUsed = feedback.vocabCheck?.filter((v) => v.used).length ?? feedback.wordCount?.used ?? 0;
  const vocabTotal = feedback.vocabCheck?.length ?? feedback.wordCount?.target ?? 0;
  const hasProfanity = feedback.profanity?.found ?? false;
  const summary = hasProfanity
    ? "Từ ngữ không phù hợp"
    : `${vocabUsed}/${vocabTotal} từ${
        grammarCount > 0 ? ` · ${grammarCount} gợi ý ngữ pháp` : " · Ngữ pháp OK"
      }`;

  return (
    <View style={s.wrap}>
      <HapticTouchable
        onPress={() => setOpen((v) => !v)}
        style={[
          s.header,
          { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: c.border },
        ]}
      >
        <Ionicons name="clipboard-outline" size={14} color={c.mutedForeground} />
        <Text style={[s.summary, { color: c.foreground }]}>{summary}</Text>
        <Ionicons
          name={open ? "chevron-down" : "chevron-forward"}
          size={14}
          color={c.mutedForeground}
        />
      </HapticTouchable>

      {open ? (
        <View style={s.body}>
          {hasProfanity && feedback.profanity ? (
            <View
              style={[
                s.profanityBlock,
                { borderColor: c.warning + "4D", backgroundColor: c.warningTint + "80" },
              ]}
            >
              <View style={s.grammarHeader}>
                <Ionicons name="warning-outline" size={14} color={c.warning} />
                <Text style={[s.profanityTitle, { color: c.warning }]}>Giữ ngôn ngữ lịch sự</Text>
              </View>
              <Text style={[s.profanityText, { color: c.mutedForeground }]}>
                Phát hiện {feedback.profanity.count} từ không phù hợp: {censorWords(feedback.profanity.words)}.
                Hãy trả lời lại bằng tiếng Anh phù hợp với ngữ cảnh học thuật.
              </Text>
            </View>
          ) : null}

          {feedback.vocabCheck && feedback.vocabCheck.length > 0 ? (
            <Section label="Sử dụng từ">
              {feedback.vocabCheck.map((v) => (
                <View key={v.phrase} style={s.vocabRow}>
                  <Ionicons
                    name={v.used ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={v.used ? c.success : c.destructive}
                  />
                  <Text
                    style={[
                      s.vocabText,
                      {
                        color: v.used ? c.foreground : c.mutedForeground,
                        textDecorationLine: v.used ? "none" : "line-through",
                      },
                    ]}
                  >
                    {v.phrase}
                  </Text>
                </View>
              ))}
            </Section>
          ) : null}

          {feedback.grammarCorrections && feedback.grammarCorrections.length > 0 ? (
            <Section label="Ngữ pháp">
              {feedback.grammarCorrections.map((g, idx) => (
                <View
                  key={`${g.wrong ?? "g"}-${idx}`}
                  style={[
                    s.grammarBlock,
                    { borderColor: c.warning + "4D", backgroundColor: c.warningTint + "80" },
                  ]}
                >
                  <View style={s.grammarHeader}>
                    <Ionicons name="flash-outline" size={12} color={c.warning} />
                    {g.wrong ? (
                      <Text style={[s.grammarWrong, { color: c.mutedForeground }]}>
                        {g.wrong}
                      </Text>
                    ) : null}
                  </View>
                  {g.correct ? (
                    <Text style={[s.grammarCorrect, { color: c.foreground }]}>
                      {g.correct}
                    </Text>
                  ) : null}
                  {g.explanation ? (
                    <Text style={[s.grammarExp, { color: c.mutedForeground }]}>
                      {g.explanation}
                    </Text>
                  ) : null}
                </View>
              ))}
            </Section>
          ) : null}

          {feedback.better ? (
            <View
              style={[
                s.betterBlock,
                { borderColor: c.info + "4D", backgroundColor: c.infoTint + "80" },
              ]}
            >
              <View style={s.betterHeader}>
                <Ionicons name="bulb-outline" size={14} color={c.info} />
                <Text style={[s.betterLabel, { color: c.info }]}>Cách nói tốt hơn</Text>
              </View>
              <View style={s.betterRow}>
                <Text style={[s.betterText, { color: c.foreground }]}>{feedback.better}</Text>
                <HapticTouchable
                  onPress={() =>
                    Speech.speak(feedback.better ?? "", { language: "en-US", rate: 0.9 })
                  }
                  style={s.speakBtn}
                  hitSlop={8}
                >
                  <Ionicons name="volume-medium" size={16} color={c.info} />
                </HapticTouchable>
              </View>
              {feedback.betterIpa ? (
                <Text style={[s.betterIpa, { color: c.mutedForeground }]}>
                  /{feedback.betterIpa}/
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View style={s.section}>
      <Text style={[s.sectionLabel, { color: c.subtle }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: spacing.xs, gap: spacing.xs },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  summary: { flex: 1, fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  body: { gap: spacing.sm },
  section: { gap: spacing.xs },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  vocabRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  vocabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  grammarBlock: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  grammarHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  grammarWrong: { fontSize: fontSize.sm, textDecorationLine: "line-through" },
  grammarCorrect: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  grammarExp: { fontSize: fontSize.xs, fontStyle: "italic" },
  profanityBlock: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  profanityTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  profanityText: { fontSize: fontSize.xs, lineHeight: 18 },
  betterBlock: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  betterHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  betterLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
  },
  betterRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  betterText: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  speakBtn: { padding: 4 },
  betterIpa: { fontSize: fontSize.xs, fontStyle: "italic" },
});

function censorWords(words: string[]): string {
  return words.map(censorWord).join(", ");
}

function censorWord(word: string): string {
  if (word.length <= 2) return "*".repeat(word.length);
  return `${word[0]}${"*".repeat(word.length - 2)}${word[word.length - 1]}`;
}
