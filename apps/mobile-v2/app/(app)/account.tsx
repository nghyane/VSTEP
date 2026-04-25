import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useAuth } from "@/hooks/use-auth";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function AccountScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
    >
      <Text style={[s.title, { color: c.foreground }]}>Tài khoản & Bảo mật</Text>

      <InfoCard icon="mail-outline" label="Email" value={user?.email ?? "—"} c={c} />
      <InfoCard icon="person-outline" label="Họ và tên" value={user?.fullName ?? "Chưa cập nhật"} c={c} />
      <InfoCard icon="person-circle-outline" label="Vai trò" value={formatRole(user?.role)} c={c} />

      {profile && (
        <View style={s.sectionGap}>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>HỒ SƠ ĐANG DÙNG</Text>
          <InfoCard icon="id-card-outline" label="Biệt danh" value={profile.nickname} c={c} />
          <InfoCard icon="flag-outline" label="Mục tiêu" value={profile.targetLevel ?? "Chưa đặt"} c={c} />
          {profile.targetDeadline && (
            <InfoCard icon="calendar-outline" label="Hạn thi" value={formatDate(profile.targetDeadline)} c={c} />
          )}
        </View>
      )}

      <DepthButton
        variant="secondary"
        fullWidth
        onPress={() => router.push("/(app)/goal")}
        style={{ marginTop: spacing.md }}
      >
        <Ionicons name="flag-outline" size={16} color={c.primary} />
        <Text style={{ color: c.primary, marginLeft: spacing.xs, fontFamily: fontFamily.semiBold }}>
          Đổi mục tiêu học tập
        </Text>
      </DepthButton>

      <DepthButton
        variant="secondary"
        fullWidth
        onPress={() => router.push("/(app)/(tabs)/profile")}
        style={{ marginTop: spacing.sm }}
      >
        <Ionicons name="people-outline" size={16} color={c.info} />
        <Text style={{ color: c.info, marginLeft: spacing.xs, fontFamily: fontFamily.semiBold }}>
          Quản lý hồ sơ
        </Text>
      </DepthButton>

      <DepthButton fullWidth onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
        Quay lại
      </DepthButton>
    </ScrollView>
  );
}

function InfoCard({ icon, label, value, c }: { icon: string; label: string; value: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={[s.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name={icon as any} size={18} color={c.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[s.infoLabel, { color: c.subtle }]}>{label}</Text>
        <Text style={[s.infoValue, { color: c.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function formatRole(role?: string): string {
  if (!role) return "—";
  const map: Record<string, string> = { learner: "Học viên", admin: "Quản trị viên", teacher: "Giảng viên" };
  return map[role] ?? role;
}

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center", marginBottom: spacing.lg },
  infoCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.base, borderBottomColor: "#CACACA" },
  infoLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  infoValue: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  sectionGap: { gap: spacing.sm, marginTop: spacing.sm },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.xs },
});
