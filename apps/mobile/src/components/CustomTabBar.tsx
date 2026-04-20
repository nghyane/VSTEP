import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useThemeColors, spacing, fontFamily } from "@/theme";
import { useHaptics } from "@/contexts/HapticsContext";

const HIDDEN_TABS = new Set(["notifications", "classes", "explore", "progress"]);

export function CustomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const c = useThemeColors();
  const { trigger } = useHaptics();
  const visibleRoutes = state.routes.filter((r) => !HIDDEN_TABS.has(r.name));
  const count = visibleRoutes.length;

  const activeVisibleIdx = visibleRoutes.findIndex(
    (r) => r.key === state.routes[state.index].key,
  );

  const scales = useRef(
    Array.from({ length: count }, (_, i) =>
      new Animated.Value(i === activeVisibleIdx ? 1.25 : 1),
    ),
  ).current;

  useEffect(() => {
    scales.forEach((scale, i) => {
      Animated.spring(scale, {
        toValue: i === activeVisibleIdx ? 1.25 : 1,
        damping: 15,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [activeVisibleIdx, scales]);

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.row}>
        {visibleRoutes.map((route, visIdx) => {
          const { options } = descriptors[route.key];
          const focused = route.key === state.routes[state.index].key;
          const color = focused ? c.primary : c.subtle;
          const icon = options.tabBarIcon?.({ focused, color, size: 22 });

          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;

          const onPress = () => {
            trigger();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Animated.View style={{ transform: [{ scale: scales[visIdx] }] }}>
                {icon}
              </Animated.View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.label,
                  { color, fontFamily: focused ? fontFamily.bold : fontFamily.medium },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: "row",
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    gap: 3,
  },
  label: {
    fontSize: 10,
  },
});
