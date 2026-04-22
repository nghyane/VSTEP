// CustomTabBar — redesigned premium floating pill tab bar
// Design: glass-surface pill, animated indicator, icon + label with spring scale
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useThemeColors, spacing, fontFamily, radius } from "@/theme";
import { useHaptics } from "@/contexts/HapticsContext";

const HIDDEN_TABS = new Set(["notifications", "classes", "explore", "progress"]);

export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const c = useThemeColors();
  const { trigger } = useHaptics();
  const visibleRoutes = state.routes.filter((r) => !HIDDEN_TABS.has(r.name));
  const count = visibleRoutes.length;

  const activeVisibleIdx = visibleRoutes.findIndex(
    (r) => r.key === state.routes[state.index].key,
  );

  // Spring-scale each tab icon when active
  const scales = useRef(
    Array.from({ length: count }, (_, i) =>
      new Animated.Value(i === activeVisibleIdx ? 1 : 0.92),
    ),
  ).current;

  // Slide the active indicator pill
  const indicatorX = useRef(new Animated.Value(activeVisibleIdx)).current;

  useEffect(() => {
    scales.forEach((scale, i) => {
      Animated.spring(scale, {
        toValue: i === activeVisibleIdx ? 1.12 : 0.92,
        damping: 14,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    });
    Animated.spring(indicatorX, {
      toValue: activeVisibleIdx,
      damping: 18,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [activeVisibleIdx, scales, indicatorX]);

  const TAB_W = 100 / count;

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
      {/* Sliding active background */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: c.primaryTint,
            width: `${TAB_W}%` as any,
            left: indicatorX.interpolate({
              inputRange: [0, count - 1],
              outputRange: ["0%", `${TAB_W * (count - 1)}%`],
            }),
          },
        ]}
      />

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
              activeOpacity={0.8}
              style={styles.tab}
            >
              <Animated.View
                style={[
                  styles.iconWrap,
                  { transform: [{ scale: scales[visIdx] }] },
                ]}
              >
                {icon}
              </Animated.View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: focused ? fontFamily.bold : fontFamily.medium,
                  },
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
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 6,
    height: 48,
    borderRadius: radius.xl,
    marginHorizontal: 4,
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
    gap: 2,
    zIndex: 1,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
