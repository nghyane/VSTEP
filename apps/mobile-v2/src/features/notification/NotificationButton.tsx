import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/components/BottomSheet";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { useDeleteNotification, useMarkAllRead, useNotifications, useUnreadCount } from "@/features/notification/queries";
import type { Notification } from "@/features/notification/types";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

export function NotificationButton() {
  const c = useThemeColors();
  const [visible, setVisible] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const unread = unreadData?.count ?? 0;

  return (
    <>
      <HapticTouchable
        style={[styles.btn, { backgroundColor: c.muted }]}
        onPress={() => setVisible(true)}
      >
        <Ionicons
          name={unread > 0 ? "notifications" : "notifications-outline"}
          size={18}
          color={unread > 0 ? c.primary : c.mutedForeground}
        />
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: c.destructive }]}>
            <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </HapticTouchable>
      <NotificationSheet visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

function NotificationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { data } = useNotifications();
  const markAllRead = useMarkAllRead();
  const notifications: Notification[] = data?.data ?? [];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>Thông báo</Text>
          {notifications.length > 0 && (
            <HapticTouchable onPress={() => { markAllRead.mutate(); onClose(); }}>
              <Text style={[styles.clearBtn, { color: c.destructive }]}>Đánh dấu đã đọc</Text>
            </HapticTouchable>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={32} color={c.mutedForeground + "60"} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Chưa có thông báo nào</Text>
            <Text style={[styles.emptyBody, { color: c.mutedForeground }]}>
              Hoàn thành bài tập để nhận thông báo streak và thưởng xu.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(n) => n.id}
            style={{ maxHeight: 400 }}
            renderItem={({ item }) => <NotificationRow notification={item} />}
            ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: c.border }]} />}
          />
        )}
      </View>
    </BottomSheet>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const c = useThemeColors();
  const deleteMutation = useDeleteNotification();
  const isUnread = notification.readAt === null;

  return (
    <HapticTouchable
      style={[styles.row, isUnread && { backgroundColor: c.primary + "08" }]}
      onPress={() => deleteMutation.mutate(notification.id)}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.primaryTint }]}>
        <GameIcon name="notification" size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.foreground }]}>{notification.title}</Text>
        {notification.body && (
          <Text style={[styles.rowBody, { color: c.mutedForeground }]} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        <Text style={[styles.rowTime, { color: c.mutedForeground }]}>
          {formatRelative(notification.createdAt)}
        </Text>
      </View>
      {isUnread && <View style={[styles.dot, { backgroundColor: c.primary }]} />}
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
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#FFF", fontSize: 9, fontFamily: fontFamily.bold },
  content: { paddingBottom: spacing["2xl"] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1 },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  clearBtn: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing["3xl"], paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  emptyBody: { fontSize: fontSize.xs, textAlign: "center" },
  sep: { height: 1 },
  row: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, lineHeight: 18 },
  rowBody: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },
  rowTime: { fontSize: 10, fontFamily: fontFamily.medium, marginTop: 4, letterSpacing: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
