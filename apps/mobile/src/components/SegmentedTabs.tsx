import { StyleSheet, Text, View } from "react-native";
import { HapticTouchable } from "./HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface Tab {
  key: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeKey: string;
  onTabChange: (key: string) => void;
}

export function SegmentedTabs({ tabs, activeKey, onTabChange }: Props) {
  const c = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: c.muted }]}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <HapticTouchable
            key={tab.key}
            style={[
              styles.tab,
              active && { backgroundColor: c.card, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: active ? c.foreground : c.mutedForeground, fontFamily: active ? fontFamily.semiBold : fontFamily.medium },
              ]}
            >
              {tab.label}
            </Text>
          </HapticTouchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  label: {
    fontSize: fontSize.sm,
  },
});
