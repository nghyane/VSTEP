// CustomTabBar — redesigned premium floating pill tab bar
// Design: glass-surface pill, animated indicator, icon + label with spring scale
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useThemeColors, useResponsiveLayout, spacing, fontFamily, radius } from "@/theme";
import { useHaptics } from "@/contexts/HapticsContext";

const HIDDEN_TABS = new Set(["notifications", "explore", "progress"]);

export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const c = useThemeColors();
  const layout = useResponsiveLayout();
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
  const indicatorY = useRef(new Animated.Value(activeVisibleIdx)).current;

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
    Animated.spring(indicatorY, {
      toValue: activeVisibleIdx,
      damping: 18,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [activeVisibleIdx, scales, indicatorX, indicatorY]);

  const TAB_W = 100 / count;
  const isRail = layout.isTabletLandscape;
  const railWidth = layout.navRailWidth;
  const railItemHeight = layout.isLargeTablet ? 72 : 66;

  return (
    <View
      style={[
        styles.outer,
        isRail ? styles.outerRail : styles.outerBar,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderRightColor: c.border,
          paddingBottom: isRail ? 0 : Math.max(insets.bottom, 8),
          paddingTop: isRail ? insets.top + 12 : 0,
          width: isRail ? railWidth : undefined,
        },
      ]}
    >
      {/* Sliding active background */}
      <Animated.View
        style={[
          styles.indicator,
          isRail ? styles.indicatorRail : styles.indicatorBar,
          {
            backgroundColor: c.primaryTint,
            width: isRail ? railWidth - 16 : (`${TAB_W}%` as any),
            left: isRail
              ? 8
              : indicatorX.interpolate({
                  inputRange: [0, count - 1],
                  outputRange: ["0%", `${TAB_W * (count - 1)}%`],
                }),
            top: isRail ? indicatorY.interpolate({
              inputRange: [0, count - 1],
              outputRange: Array.from({ length: count }, (_, i) => 8 + i * railItemHeight),
            }) : 6,
          },
        ]}
      />

      <View style={[styles.row, isRail ? styles.column : styles.barRow]}>
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
              style={[styles.tab, isRail ? styles.tabRail : styles.tabBar, isRail ? { height: railItemHeight } : null]}
            >
              <Animated.View
                style={[
                  styles.iconWrap,
                  isRail ? styles.iconWrapRail : null,
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
                  isRail ? styles.labelRail : styles.labelBar,
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
    position: "relative",
  },
  outerBar: {
    borderTopWidth: 1,
  },
  outerRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    zIndex: 50,
  },
  indicator: {
    position: "absolute",
    borderRadius: radius.xl,
  },
  indicatorBar: {
    top: 6,
    height: 48,
    marginHorizontal: 4,
  },
  indicatorRail: {
    height: 58,
  },
  row: {
  },
  barRow: {
    flexDirection: "row",
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  column: {
    flexDirection: "column",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.base,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    zIndex: 1,
  },
  tabBar: {
    flex: 1,
    minHeight: 50,
  },
  tabRail: {
    width: "100%",
    minHeight: 58,
    gap: 6,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapRail: {
    width: 28,
    height: 28,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  labelBar: {},
  labelRail: {
    fontSize: 11,
  },
});
