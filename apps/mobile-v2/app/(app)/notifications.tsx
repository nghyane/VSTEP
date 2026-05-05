import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeleteNotification, useMarkAllRead, useMarkNotificationRead, useNotifications } from "@/features/notification/queries";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { fontSize, fontFamily, spacing, useThemeColors } from "@/theme";
import type { Notification } from "@/features/notification/types";

export default function NotificationsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const notifications: Notification[] = data?.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.base }]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Thông báo</Text>
        {notifications.length > 0 && (
          <HapticTouchable onPress={() => markAll.mutate()}>
            <Text style={[styles.markRead, { color: c.primary }]}>Đánh dấu đã đọc</Text>
          </HapticTouchable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={[styles.centerText, { color: c.subtle }]}>Đang tải...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <GameIcon name="notification" size={48} />
          <Text style={[styles.centerTitle, { color: c.foreground }]}>Chưa có thông báo nào</Text>
          <Text style={[styles.centerBody, { color: c.mutedForeground }]}>
            Hoàn thành bài tập để nhận thông báo streak và thưởng xu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing["3xl"] }}
          renderItem={({ item }) => <NotificationRow n={item} />}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: c.border }]} />}
        />
      )}
    </View>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const c = useThemeColors();
  const del = useDeleteNotification();
  const markRead = useMarkNotificationRead();
  const unread = n.readAt === null;

  const handlePress = () => {
    if (unread) {
      markRead.mutate(n.id);
      return;
    }
    del.mutate(n.id);
  };

  return (
    <HapticTouchable
      style={[styles.row, unread && { backgroundColor: c.primaryTint }]}
      onPress={handlePress}
      onLongPress={() => del.mutate(n.id)}
    >
      <View style={styles.rowIcon}>
        <GameIcon name="notification" size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.foreground }]}>{n.title}</Text>
        {n.body && (
          <Text style={[styles.rowBody, { color: c.mutedForeground }]} numberOfLines={2}>
            {n.body}
          </Text>
        )}
        <Text style={[styles.rowTime, { color: c.subtle }]}>{formatRelative(n.createdAt)}</Text>
      </View>
      {unread && <View style={[styles.dot, { backgroundColor: c.primary }]} />}
    </HapticTouchable>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  markRead: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.xl },
  centerText: { fontSize: fontSize.sm },
  centerTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  centerBody: { fontSize: fontSize.sm, textAlign: "center" },
  sep: { height: 1 },
  row: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, lineHeight: 18 },
  rowBody: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },
  rowTime: { fontSize: 10, fontFamily: fontFamily.medium, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
