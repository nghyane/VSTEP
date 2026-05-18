// ConversationTurnView — render one turn (AI or user) with text, IPA toggle,
// translate toggle, optional speak button (AI), suggested word chips, and
// feedback panel (user).
// Mirrors apps/frontend-v3/src/features/practice/components/ConversationTurnView.tsx
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { ConversationFeedback } from "@/components/ConversationFeedback";
import { translateText } from "@/lib/translate";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";
import type {
  SpeakingConversationScenario,
  SpeakingConversationTurn,
} from "@/hooks/use-practice";

interface Props {
  turn: SpeakingConversationTurn;
  scenario: SpeakingConversationScenario;
  isSpeaking: boolean;
  onSpeak: () => void;
  onAppendWord: (word: string) => void;
}

export function ConversationTurnView({
  turn,
  scenario,
  isSpeaking,
  onSpeak,
  onAppendWord,
}: Props) {
  const c = useThemeColors();
  const isUser = turn.role === "user";

  return (
    <View style={[s.wrap, isUser ? s.right : s.left]}>
      <View
        style={[
          s.row,
          isUser ? s.rowReverse : null,
        ]}
      >
        <Avatar role={isUser ? "user" : "ai"} character={scenario.characterName} />
        <View style={s.bubbleCol}>
          {!isUser ? (
            <Text style={[s.roleLabel, { color: c.mutedForeground }]}>
              {scenario.characterName}
            </Text>
          ) : null}

          <View
            style={[
              s.bubble,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                borderBottomColor: c.border,
              },
            ]}
          >
            <View style={s.bubbleHeader}>
              <Text
                style={[s.bubbleText, { color: c.foreground }]}
                selectable
              >
                {turn.text}
              </Text>
              {!isUser ? (
                <HapticTouchable
                  onPress={onSpeak}
                  style={[
                    s.speakMini,
                    { backgroundColor: isSpeaking ? c.coinTint : c.surfaceTint },
                  ]}
                  hitSlop={6}
                >
                  <Ionicons
                    name={isSpeaking ? "volume-high" : "volume-medium-outline"}
                    size={14}
                    color={c.coinDark}
                  />
                </HapticTouchable>
              ) : null}
            </View>
          </View>

          <TurnActions
            text={turn.text}
            ipa={turn.ipa}
            alignRight={isUser}
          />

          {!isUser && turn.suggestedWords.length > 0 ? (
            <View style={[s.chipRow, isUser ? s.chipRowRight : null]}>
              {turn.suggestedWords.slice(0, 4).map((word) => (
                <HapticTouchable
                  key={word}
                  onPress={() => onAppendWord(word)}
                  style={[s.chip, { backgroundColor: c.surfaceTint }]}
                >
                  <Text style={[s.chipText, { color: c.foreground }]}>{word}</Text>
                </HapticTouchable>
              ))}
            </View>
          ) : null}

          {isUser && turn.feedback ? (
            <ConversationFeedback feedback={turn.feedback} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Avatar({ role, character }: { role: "user" | "ai"; character: string }) {
  const c = useThemeColors();
  if (role === "ai") {
    return (
      <View
        style={[
          s.avatar,
          { backgroundColor: c.skillSpeaking, borderColor: c.skillSpeaking },
        ]}
      >
        <Text style={[s.avatarText, { color: c.primaryForeground }]}>
          {character.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={[
        s.avatar,
        { backgroundColor: c.foreground, borderColor: c.foreground },
      ]}
    >
      <Text style={[s.avatarText, { color: c.surface }]}>You</Text>
    </View>
  );
}

function TurnActions({
  text,
  ipa,
  alignRight,
}: {
  text: string;
  ipa: string | null;
  alignRight: boolean;
}) {
  const c = useThemeColors();
  const [showIpa, setShowIpa] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleTranslate() {
    if (translation) {
      setTranslation(null);
      return;
    }
    setLoading(true);
    try {
      const result = await translateText(text);
      setTranslation(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.actionsCol}>
      <View style={[s.actionsRow, alignRight ? s.actionsRowRight : null]}>
        {ipa ? (
          <HapticTouchable
            onPress={() => setShowIpa((v) => !v)}
            style={[
              s.actionBtn,
              {
                backgroundColor: showIpa ? c.infoTint : c.surface,
                borderColor: showIpa ? c.info : c.border,
                borderBottomColor: showIpa ? c.info : c.border,
              },
            ]}
            hitSlop={4}
          >
            <Text
              style={[
                s.actionText,
                { color: showIpa ? c.info : c.mutedForeground },
              ]}
            >
              {showIpa ? "Ẩn phiên âm" : "Phiên âm"}
            </Text>
          </HapticTouchable>
        ) : null}
        <HapticTouchable
          onPress={toggleTranslate}
          disabled={loading}
          style={[
            s.actionBtn,
            {
              backgroundColor: translation ? c.coinTint : c.surface,
              borderColor: translation ? c.skillSpeaking : c.border,
              borderBottomColor: translation ? c.skillSpeaking : c.border,
              opacity: loading ? 0.6 : 1,
            },
          ]}
          hitSlop={4}
        >
          {loading ? (
            <ActivityIndicator size="small" color={c.mutedForeground} />
          ) : (
            <>
              <Ionicons
                name="swap-horizontal-outline"
                size={12}
                color={translation ? c.coinDark : c.mutedForeground}
              />
              <Text
                style={[
                  s.actionText,
                  { color: translation ? c.coinDark : c.mutedForeground },
                ]}
              >
                {translation ? "Ẩn dịch" : "Dịch"}
              </Text>
            </>
          )}
        </HapticTouchable>
      </View>
      {showIpa && ipa ? (
        <Text
          style={[
            s.ipaText,
            { color: c.mutedForeground },
            alignRight ? s.textRight : null,
          ]}
        >
          /{ipa}/
        </Text>
      ) : null}
      {translation ? (
        <Text
          style={[
            s.translateText,
            { color: c.mutedForeground },
            alignRight ? s.textRight : null,
          ]}
        >
          {translation}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginVertical: spacing.xs },
  left: { alignSelf: "stretch" },
  right: { alignSelf: "stretch" },
  row: { flexDirection: "row", gap: spacing.sm },
  rowReverse: { flexDirection: "row-reverse" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 11, fontFamily: fontFamily.extraBold },
  bubbleCol: { flex: 1, gap: 2 },
  roleLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  bubble: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  bubbleText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 22,
    fontFamily: fontFamily.medium,
  },
  speakMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsCol: { gap: spacing.xs, marginTop: spacing.xs },
  actionsRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  actionsRowRight: { justifyContent: "flex-end" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.button,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  actionText: { fontSize: 11, fontFamily: fontFamily.bold },
  ipaText: { fontSize: fontSize.sm, fontStyle: "italic", paddingHorizontal: 2 },
  translateText: { fontSize: fontSize.sm, fontStyle: "italic", paddingHorizontal: 2 },
  textRight: { textAlign: "right" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  chipRowRight: { justifyContent: "flex-end" },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
});
