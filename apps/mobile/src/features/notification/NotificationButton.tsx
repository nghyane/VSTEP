// NotificationButton — bell icon + unread badge, opens notification sheet
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import {
  type AppNotification,
  clearNotifications, formatRelative, markAllRead,
  useNotifications, useUnreadCount,
} from "@/features/notification/notification-store";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

export function NotificationButton() {
  const c = useThemeColors();
  const [visible, setVisible] = useState(false);
  const unread = useUnreadCount();

  function handleOpen() {
    setVisible(true);
    if (unread > 0) markAllRead();
  }

  return (
    <>
      <HapticTouchable style={[styles.btn, { backgroundColor: c.background }]} onPress={handleOpen}>
        <Ionicons name={unread > 0 ? "notifications" : "notifications-outline"} size={18} color={unread > 0 ? c.primary : c.subtle} />
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
  const notifications = useNotifications();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>Thông báo</Text>
          {notifications.length > 0 && (
            <HapticTouchable onPress={() => { clearNotifications(); onClose(); }}>
              <Text style={[styles.clearBtn, { color: c.destructive }]}>Xoá tất cả</Text>
            </HapticTouchable>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={32} color={c.subtle + "60"} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Chưa có thông báo nào</Text>
            <Text style={[styles.emptyBody, { color: c.subtle }]}>Hoàn thành bài thi để nhận thông báo streak và thưởng xu.</Text>
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

const ICON_MAP: Record<string, { name: "fire" | "trophy" | "coin"; bg: string }> = {
  fire: { name: "fire", bg: "#E5A02015" },
  trophy: { name: "trophy", bg: "#F59E0B15" },
  coin: { name: "coin", bg: "#F59E0B15" },
};

function NotificationRow({ notification }: { notification: AppNotification }) {
  const c = useThemeColors();
  const isUnread = notification.readAt === null;
  const icon = ICON_MAP[notification.iconKey] ?? ICON_MAP.fire;

  return (
    <View style={[styles.row, isUnread && { backgroundColor: c.primary + "08" }]}>
      <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
        <GameIcon name={icon.name} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.foreground }]}>{notification.title}</Text>
        {notification.body && <Text style={[styles.rowBody, { color: c.subtle }]}>{notification.body}</Text>}
        <Text style={[styles.rowTime, { color: c.subtle }]}>{formatRelative(notification.createdAt)}</Text>
      </View>
      {isUnread && <View style={[styles.dot, { backgroundColor: c.primary }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
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
  rowTime: { fontSize: 10, fontFamily: fontFamily.medium, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
