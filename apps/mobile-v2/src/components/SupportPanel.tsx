import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { HapticTouchable } from "./HapticTouchable";
import { useThemeColors, spacing, fontSize, fontFamily, radius } from "@/theme";
import { requestSupport, requestWritingSupport, type SupportResult } from "@/hooks/use-practice";
import { addCoins } from "@/features/coin/coin-store";

interface SupportPanelProps {
  skill: "listening" | "reading" | "writing";
  sessionId: string;
  hasTranscript: boolean;
  hasKeywords: boolean;
  accentColor: string;
  unlockedLevels?: number[];
  onUnlock?: (level: number) => void;
}

interface SupportOption {
  level: number;
  label: string;
  icon: "text-outline" | "chatbubble-ellipses-outline";
  available: boolean;
}

export function SupportPanel({
  skill,
  sessionId,
  hasTranscript,
  hasKeywords,
  accentColor,
  unlockedLevels = [],
  onUnlock,
}: SupportPanelProps) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const options: SupportOption[] = [
    { level: 1, label: "Gợi ý từ khóa", icon: "text-outline", available: hasKeywords },
    { level: 2, label: "Hiện bản dịch", icon: "chatbubble-ellipses-outline", available: hasTranscript },
  ];
  const availableOptions = options.filter((o): o is SupportOption => o.available);

  const mutation = useMutation({
    mutationFn: ({ level }: { level: number }) => {
      if (skill === "writing") {
        return requestWritingSupport(sessionId, level);
      }
      return requestSupport(skill, sessionId, level);
    },
    onSuccess: (res: SupportResult) => {
      if (res.coinsSpent > 0) {
        addCoins(-res.coinsSpent);
      }
      const level = res.supportLevelsUsed.at(-1)?.level;
      if (level != null) {
        onUnlock?.(level);
      }
    },
  });

  if (availableOptions.length === 0) return null;

  return (
    <View style={[s.root, { borderColor: c.border }]}>
      <HapticTouchable
        onPress={() => setExpanded(!expanded)}
        style={[s.header, { borderColor: expanded ? c.border : "transparent" }]}
      >
        <Ionicons name="bulb-outline" size={16} color={accentColor} />
        <Text style={[s.headerText, { color: c.mutedForeground }]}>Hỗ trợ</Text>
        <View style={s.trailer}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={c.subtle}
          />
        </View>
      </HapticTouchable>

      {expanded && (
        <View style={s.options}>
          {availableOptions.map(({ level, label, icon }) => (
            <HapticTouchable
              key={level}
              onPress={() => mutation.mutate({ level })}
              disabled={mutation.isPending || unlockedLevels.includes(level)}
              style={[
                s.optionRow,
                {
                  borderColor: unlockedLevels.includes(level) ? accentColor : c.border,
                  backgroundColor: unlockedLevels.includes(level) ? `${accentColor}14` : c.surface,
                },
              ]}
            >
              <Ionicons
                name={unlockedLevels.includes(level) ? "checkmark-circle" : icon}
                size={16}
                color={unlockedLevels.includes(level) ? accentColor : c.mutedForeground}
              />
              <Text style={[s.optionText, { color: c.foreground }]}>{label}</Text>
              {unlockedLevels.includes(level) ? (
                <Text style={[s.optionCost, { color: accentColor }]}>Đã mở</Text>
              ) : mutation.isPending ? (
                <Text style={[s.optionCost, { color: c.subtle }]}>Đang xử lý...</Text>
              ) : null}
            </HapticTouchable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    flex: 1,
  },
  trailer: {
    padding: spacing.xs,
  },
  options: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  optionCost: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
  },
});
