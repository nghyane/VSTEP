// NotificationButton — bell icon, reads from server API
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/components/BottomSheet";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { type ApiResponse, api } from "@/lib/api";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
}

const notificationsQuery = {
  queryKey: ["notifications"],
  queryFn: () => api.get<ApiResponse<Notification[]>>("notifications"),
  staleTime: 30_000,
};

const unreadCountQuery = {
  queryKey: ["notifications", "unread-count"],
  queryFn: () => api.get<ApiResponse<{ count: number }>>("notifications/unread-count"),
  staleTime: 30_000,
};

export function NotificationButton() {
  const c = useThemeColors();
  const [visible, setVisible] = useState(false);
  const { data: unreadRes } = useQuery(unreadCountQuery);
  const unread = unreadRes?.data.count ?? 0;
  const qc = useQueryClient();

  function handleOpen() {
    setVisible(true);
    if (unread > 0) {
      api.post("notifications/read-all").then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
    }
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
  const { data: res } = useQuery(notificationsQuery);
  const notifications = res?.data ?? [];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>Thông báo</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={32} color={c.placeholder} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Chưa có thông báo nào</Text>
            <Text style={[styles.emptyBody, { color: c.subtle }]}>Hoàn thành bài thi để nhận thông báo.</Text>
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
  const isUnread = notification.read_at === null;

  return (
    <View style={[styles.row, isUnread && { backgroundColor: c.primaryTint }]}>
      <GameIcon name="fire" size={20} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.foreground }]}>{notification.title}</Text>
        {notification.body && <Text style={[styles.rowBody, { color: c.subtle }]}>{notification.body}</Text>}
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
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing["3xl"], paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  emptyBody: { fontSize: fontSize.xs, textAlign: "center" },
  sep: { height: 1 },
  row: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: "center" },
  rowTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  rowBody: { fontSize: fontSize.xs, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
