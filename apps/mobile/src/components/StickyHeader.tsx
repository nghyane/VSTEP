import { useRef } from "react";
import { Animated, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

const HEADER_H = 56;
const GRADIENT_TOP = "#E8EEFF";

interface StickyHeaderProps {
  scrollY: Animated.Value;
  subtitle?: string;
}

export function StickyHeader({ scrollY, subtitle }: StickyHeaderProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const borderOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: HEADER_H + insets.top,
          backgroundColor: GRADIENT_TOP,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            opacity: borderOpacity,
          },
        ]}
      />
      <View style={styles.headerInner}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <Text style={styles.avatarText}>
            {(user?.email ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.headerTitle, { color: c.foreground }]} numberOfLines={1}>
            Xin chào, {user?.email ?? "bạn"}
          </Text>
          {subtitle ? (
            <Text style={[styles.headerSub, { color: c.subtle }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.bellBtn, { backgroundColor: c.background }]}
          onPress={() => router.push("/(app)/(tabs)/notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color={c.foreground} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export { HEADER_H };

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
  textWrap: { flex: 1 },
  headerTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  headerSub: { fontSize: fontSize.xs, marginTop: 1, fontFamily: fontFamily.medium },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: fontFamily.bold,
    lineHeight: 16,
  },
});
