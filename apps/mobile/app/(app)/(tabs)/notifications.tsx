import { useCallback, useRef } from "react";
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { useNotifications, useUnreadCount, useMarkAllRead, useMarkAllRead } from "@/hooks/use-notifications";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Notification, NotificationType } from "@/types/api";

const TYPE_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  grading_complete: "checkmark-circle",
  goal_achieved: "trophy",
  streak_milestone: "flame",
  session_abandoned: "alert-circle",
  feedback: "chatbubble",
  class_invite: "people",
  system: "information-circle",
};

const TYPE_COLORS: Record<NotificationType, string> = {
  grading_complete: "#22C55E",
  goal_achieved: "#F59E0B",
  streak_milestone: "#F97316",
  session_abandoned: "#6B7280",
  feedback: "#3B82F6",
  class_invite: "#8B5CF6",
  system: "#6B7280",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

export default function NotificationsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data, isLoading, error, refetch } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = data?.data ?? [];

  const handlePress = useCallback((item: Notification) => {
    if (!item.readAt) {
      markRead.mutate(item.id);
    }
  }, [markRead]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const subtitle = unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : undefined;

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.readAt;
    const iconName = TYPE_ICONS[item.type] ?? "information-circle";
    const iconColor = TYPE_COLORS[item.type] ?? c.subtle;

    return (
      <HapticTouchable
        style={[
          styles.card,
          {
            backgroundColor: isUnread ? c.primary + "08" : c.surface,
            borderColor: c.border,
          },
        ]}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconColor + "18" }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.cardTitle,
                { color: c.foreground },
                isUnread && { fontFamily: fontFamily.bold },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />}
          </View>
          {item.body ? (
            <Text
              style={[styles.cardBody, { color: c.subtle }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
          ) : null}
          <Text style={[styles.cardTime, { color: c.subtle }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </HapticTouchable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} subtitle={subtitle} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: HEADER_H + insets.top + 8,
            paddingBottom: insets.bottom + 100,
          },
          notifications.length === 0 && styles.emptyContainer,
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        ListHeaderComponent={
          unreadCount > 0 ? (
            <HapticTouchable
              style={[styles.markAllBtn, { backgroundColor: c.primary + "12" }]}
              onPress={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="checkmark-done" size={16} color={c.primary} />
              )}
              <Text style={[styles.markAllText, { color: c.primary }]}>
                Đánh dấu tất cả đã đọc
              </Text>
            </HapticTouchable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={c.subtle}
            />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>
              Chưa có thông báo
            </Text>
            <Text style={[styles.emptySub, { color: c.subtle }]}>
              Thông báo mới sẽ hiển thị ở đây
            </Text>
          </View>
        }
        refreshing={false}
        onRefresh={refetch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  markAllText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.sm,
    textAlign: "center",
    fontFamily: fontFamily.regular,
  },
});
