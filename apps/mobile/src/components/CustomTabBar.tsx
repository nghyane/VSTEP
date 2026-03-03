import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useThemeColors, spacing, radius } from "@/theme";

const INSET = 4;

export function CustomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const c = useThemeColors();
  const [barWidth, setBarWidth] = useState(0);
  const animLeft = useRef(new Animated.Value(0)).current;
  const didMount = useRef(false);

  const count = state.routes.length;
  const tabW = barWidth / count;
  const centerIdx = Math.floor(count / 2);

  useEffect(() => {
    if (!barWidth) return;
    const target = tabW * state.index + INSET;
    if (!didMount.current) {
      animLeft.setValue(target);
      didMount.current = true;
    } else {
      Animated.spring(animLeft, {
        toValue: target,
        damping: 20,
        stiffness: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [state.index, barWidth, tabW, animLeft]);

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: c.card,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View
        style={styles.row}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* Animated border indicator */}
        {barWidth > 0 && (
          <Animated.View
            style={[
              styles.ring,
              {
                left: animLeft,
                width: tabW - INSET * 2,
                borderColor: c.primary,
                backgroundColor: c.primary + "08",
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const isCenter = index === centerIdx;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;

          if (isCenter) {
            const icon = options.tabBarIcon?.({
              focused,
              color: c.primaryForeground,
              size: 20,
            });
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.tab}
              >
                <View style={[styles.centerDot, { backgroundColor: c.primary }]}>
                  {icon}
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: focused ? c.primary : c.mutedForeground,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }

          const color = focused ? c.primary : c.mutedForeground;
          const icon = options.tabBarIcon?.({ focused, color, size: 20 });
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              {icon}
              <Text style={[styles.label, { color }]}>{label}</Text>
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
  ring: {
    position: "absolute",
    top: 2,
    bottom: 2,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    gap: 3,
  },
  centerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#4F5BD5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
});
