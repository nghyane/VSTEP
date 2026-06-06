import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Mascot } from "@/components/Mascot";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarPickerSheet } from "@/features/profile/AvatarPickerSheet";
import { ChangePasswordDialog } from "@/features/profile/ChangePasswordDialog";
import { CreateProfileSheet } from "@/features/profile/CreateProfileSheet";
import { EditProfileSheet } from "@/features/profile/EditProfileSheet";
import { PromoRedeemCard } from "@/features/wallet/PromoRedeemCard";
import { useAuth } from "@/hooks/use-auth";
import { useAppConfig } from "@/hooks/use-exams";
import {
  useProfiles,
  useResetProfile,
  useSwitchProfile,
} from "@/hooks/use-profiles";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useResponsiveLayout,
  useThemeColors,
} from "@/theme";
import type { Profile } from "@/types/api";

export default function ProfileScreen() {
  const c = useThemeColors();
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile: activeProfile, user, signOut, switchSession } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const { data: config } = useAppConfig();
  const resetMutation = useResetProfile();
  const switchMutation = useSwitchProfile();

  const [showCreate, setShowCreate] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<Profile | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  function requestSwitch(p: Profile) {
    if (p.id === activeProfile?.id || switchMutation.isPending) return;
    setPendingSwitch(p);
  }

  function confirmSwitch() {
    if (!pendingSwitch) return;
    switchMutation.mutate(pendingSwitch.id, {
      onSuccess: async (res) => {
        await switchSession(res.accessToken, res.refreshToken, res.profile);
        setPendingSwitch(null);
      },
      onError: () => setPendingSwitch(null),
    });
  }

  function handleConfirmReset() {
    if (!activeProfile) return;
    resetMutation.mutate(activeProfile.id, {
      onSuccess: () => setConfirmReset(false),
      onError: () => setConfirmReset(false),
    });
  }

  if (isLoading) return <LoadingScreen />;

  const displayName = activeProfile?.nickname ?? user?.fullName ?? user?.email ?? "Người dùng";
  const avatarColor = activeProfile?.avatarColor ?? c.primary;
  const targetLevel = activeProfile?.targetLevel ?? "Chưa đặt";
  const targetDeadline = activeProfile?.targetDeadline;
  const maxProfiles = config?.profile.maxProfilesPerAccount ?? 5;
  const profileCount = profiles?.length ?? 0;
  const canCreateProfile = profileCount < maxProfiles;
  const zaloPhone = config?.support?.zaloPhone?.replace(/\D/g, "") ?? "";

  async function handleProfileCreated(created: Profile) {
    const res = await switchMutation.mutateAsync(created.id);
    await switchSession(res.accessToken, res.refreshToken, res.profile);
  }

  const activeAvatarSource = activeProfile
    ? {
        avatarKey: activeProfile.avatarKey,
        avatarUrl: activeProfile.avatarUrl,
        email: user?.email ?? activeProfile.nickname,
        fullName: activeProfile.nickname,
      }
    : user;

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[
        s.scroll,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
          paddingLeft: layout.isTabletLandscape ? layout.contentInsetStart : layout.horizontalPadding,
          paddingRight: layout.horizontalPadding,
          alignItems: "center",
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.pageShell, { maxWidth: layout.contentMaxWidth }]}>
        <View style={[s.topGrid, layout.isTablet ? s.topGridWide : null]}>
          <View style={[s.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <HapticTouchable onPress={() => setShowAvatarPicker(true)} style={s.avatarTouch}>
              <UserAvatar user={activeAvatarSource} size={84} fallbackName={displayName} fallbackColor={avatarColor} />
              <View style={[s.avatarEditBadge, { backgroundColor: c.primary, borderColor: c.card }]}>
                <Ionicons name="camera" size={12} color={c.primaryForeground} />
              </View>
            </HapticTouchable>
            <Text style={[s.heroName, { color: c.foreground }]}>{displayName}</Text>
            <Text style={[s.heroEmail, { color: c.mutedForeground }]}>{user?.email}</Text>
            <View style={[s.targetBadge, { backgroundColor: c.primaryTint }]}>
              <Text style={[s.targetBadgeText, { color: c.primary }]}>Mục tiêu: {targetLevel}</Text>
              {targetDeadline ? (
                <Text style={[s.targetDateText, { color: c.primary }]}> · Thi ngày {formatDate(targetDeadline)}</Text>
              ) : null}
            </View>
            <View style={s.heroActions}>
              <DepthButton
                variant="secondary"
                size="sm"
                onPress={() => activeProfile && setEditing(activeProfile)}
                disabled={!activeProfile}
              >
                Chỉnh sửa
              </DepthButton>
            </View>
            <View style={s.mascotRow}>
              <Mascot name="wave" size={48} animation="none" />
            </View>
          </View>

          <View style={s.sidebarStack}>
            <Text style={[s.sectionLabel, { color: c.subtle }]}>HỒ SƠ CỦA BẠN · {profileCount}/{maxProfiles}</Text>
            <View style={s.profileList}>
              {profiles?.map((p) => (
                <ProfileRow
                  key={p.id}
                  profile={p}
                  isActive={p.id === activeProfile?.id}
                  isSwitching={switchMutation.isPending && pendingSwitch?.id === p.id}
                  onSwitch={requestSwitch}
                />
              ))}
            </View>

            <DepthButton fullWidth variant="secondary" onPress={() => setShowCreate(true)} disabled={!canCreateProfile}>
              {canCreateProfile ? "+ Thêm mục tiêu mới" : `Đã đạt giới hạn ${maxProfiles} hồ sơ`}
            </DepthButton>

            <PromoRedeemCard />
          </View>
        </View>

        <View style={[s.bottomGrid, layout.isTablet ? s.bottomGridWide : null]}>
          <View style={s.bottomSection}>
            <Text style={[s.sectionLabel, { color: c.subtle }]}>TÀI KHOẢN</Text>
            <View style={[s.accountCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={s.accountRow}>
                <Text style={[s.accountLabel, { color: c.mutedForeground }]}>Email</Text>
                <Text style={[s.accountValue, { color: c.foreground }]} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
              <View style={[s.divider, { backgroundColor: c.borderLight }]} />
              <View style={s.passwordRow}>
                <View style={s.passwordCopy}>
                  <Text style={[s.accountLabel, { color: c.mutedForeground }]}>Mật khẩu</Text>
                  <Text style={[s.accountHint, { color: c.subtle }]}>
                    {!user?.hasPassword
                      ? "Bạn đăng nhập bằng Google — mật khẩu do Google quản lý."
                      : "Đổi mật khẩu định kỳ để bảo vệ tài khoản."}
                  </Text>
                </View>
                <DepthButton
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    if (!user?.hasPassword) {
                      void Linking.openURL("https://myaccount.google.com/security");
                      return;
                    }
                    setShowChangePassword(true);
                  }}
                >
                  {!user?.hasPassword ? "Mở Google" : "Đổi mật khẩu"}
                </DepthButton>
              </View>
            </View>
          </View>

          <View style={s.bottomSection}>
            <Text style={[s.sectionLabel, { color: c.subtle }]}>CÀI ĐẶT</Text>
            <View style={[s.menuGroup, { backgroundColor: c.card, borderColor: c.border }]}>
              <MenuRow
                icon="receipt-outline"
                label="Lịch sử đơn hàng"
                onPress={() => router.push("/(app)/orders" as never)}
              />
              <View style={[s.divider, { backgroundColor: c.borderLight }]} />
              <MenuRow
                icon="wallet-outline"
                label="Lịch sử giao dịch xu"
                onPress={() => router.push("/(app)/wallet" as never)}
              />
              <View style={[s.divider, { backgroundColor: c.borderLight }]} />
              <MenuRow
                icon="information-circle-outline"
                label="Tài khoản & Bảo mật"
                onPress={() => router.push("/(app)/account")}
              />
              <View style={[s.divider, { backgroundColor: c.borderLight }]} />
              <MenuRow
                icon="refresh-outline"
                label="Đặt lại tiến trình học"
                onPress={() => setConfirmReset(true)}
              />
              <View style={[s.divider, { backgroundColor: c.borderLight }]} />
              <MenuRow
                icon="help-circle-outline"
                label="Chat Zalo hỗ trợ"
                onPress={() => {
                  if (!zaloPhone) {
                    Alert.alert("Hỗ trợ", "Liên hệ: support@vstepgo.com");
                    return;
                  }
                  void Linking.openURL(`https://zalo.me/${zaloPhone}`);
                }}
              />
            </View>
          </View>
        </View>

        <DepthButton
          variant="destructive"
          fullWidth
          onPress={() => setConfirmSignOut(true)}
          style={{ marginTop: spacing.md }}
        >
          Đăng xuất
        </DepthButton>

        <Text style={[s.version, { color: c.placeholder }]}>VSTEP Mobile v2.0.0</Text>
      </View>

      <CreateProfileSheet visible={showCreate} onClose={() => setShowCreate(false)} onCreated={handleProfileCreated} />
      <EditProfileSheet profile={editing} onClose={() => setEditing(null)} />
      <AvatarPickerSheet visible={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} />
      <ChangePasswordDialog
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => Alert.alert("Thành công", "Đã đổi mật khẩu thành công.")}
      />

      <ConfirmDialog
        open={!!pendingSwitch}
        title="Chuyển hồ sơ?"
        description={
          pendingSwitch
            ? `Bạn sắp chuyển sang hồ sơ "${pendingSwitch.nickname}" (mục tiêu ${pendingSwitch.targetLevel}). Tiến trình luyện tập sẽ áp dụng cho hồ sơ này.`
            : ""
        }
        confirmLabel="Chuyển"
        cancelLabel="Huỷ"
        loadingLabel="Đang chuyển…"
        isLoading={switchMutation.isPending}
        onConfirm={confirmSwitch}
        onCancel={() => !switchMutation.isPending && setPendingSwitch(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Đặt lại tiến trình?"
        description="Toàn bộ dữ liệu học tập của hồ sơ hiện tại sẽ bị xóa. Hành động không thể hoàn tác."
        confirmLabel="Đặt lại"
        cancelLabel="Huỷ"
        loadingLabel="Đang xóa…"
        isLoading={resetMutation.isPending}
        destructive
        onConfirm={handleConfirmReset}
        onCancel={() => !resetMutation.isPending && setConfirmReset(false)}
      />

      <ConfirmDialog
        open={confirmSignOut}
        title="Đăng xuất?"
        description="Bạn chắc chắn muốn đăng xuất khỏi tài khoản?"
        confirmLabel="Đăng xuất"
        cancelLabel="Huỷ"
        destructive
        onConfirm={() => {
          setConfirmSignOut(false);
          signOut();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </ScrollView>
  );
}

function ProfileRow({
  profile,
  isActive,
  isSwitching,
  onSwitch,
}: {
  profile: Profile;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: (p: Profile) => void;
}) {
  const c = useThemeColors();
  const color = profile.avatarColor ?? c.primary;
  const avatarSource = {
    avatarKey: profile.avatarKey,
    avatarUrl: profile.avatarUrl,
    email: profile.nickname,
    fullName: profile.nickname,
  };

  return (
    <HapticTouchable
      scalePress={!isActive}
      disabled={isActive || isSwitching}
      onPress={() => onSwitch(profile)}
      style={[
        s.profileRow,
        {
          backgroundColor: isActive ? c.primaryTint : c.card,
          borderColor: isActive ? c.primary : c.border,
        },
      ]}
    >
      <UserAvatar user={avatarSource} size={44} fallbackName={profile.nickname} fallbackColor={color} />
      <View style={{ flex: 1 }}>
        <Text style={[s.profileName, { color: c.foreground }]}>{profile.nickname}</Text>
        <Text style={[s.profileMeta, { color: c.mutedForeground }]}>
          Mục tiêu: {profile.targetLevel}
          {profile.targetDeadline && ` · ${formatDate(profile.targetDeadline)}`}
        </Text>
      </View>
      {isActive ? (
        <View style={[s.activeBadge, { backgroundColor: c.primary }]}>
          <Text style={s.activeBadgeText}>Đang dùng</Text>
        </View>
      ) : null}
      {isSwitching ? <ActivityIndicator size="small" color={c.primary} /> : null}
    </HapticTouchable>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={s.menuLeft}>
        <Ionicons name={icon} size={17} color={c.mutedForeground} />
        <Text style={[s.menuLabel, { color: c.foreground }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.subtle} />
    </TouchableOpacity>
  );
}

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: spacing.lg },
  pageShell: { width: "100%", gap: spacing.lg },
  topGrid: { gap: spacing.lg },
  topGridWide: { flexDirection: "row", alignItems: "stretch" },
  bottomGrid: { gap: spacing.lg },
  bottomGridWide: { flexDirection: "row", alignItems: "stretch" },
  bottomSection: { flex: 1, gap: spacing.sm },
  sidebarStack: { flex: 1, gap: spacing.md },
  heroCard: {
    flex: 1.05,
    borderWidth: 2,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    position: "relative",
    minHeight: 280,
  },
  avatarTouch: { position: "relative" },
  avatarEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  heroEmail: { fontSize: fontSize.sm },
  targetBadge: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  targetBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  targetDateText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  heroActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  mascotRow: { position: "absolute", right: spacing.md, bottom: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  profileList: { gap: spacing.sm },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  profileName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  profileMeta: { fontSize: fontSize.xs },
  activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  activeBadgeText: { color: "#FFFFFF", fontSize: 10, fontFamily: fontFamily.bold },
  accountCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  accountLabel: { fontSize: fontSize.sm },
  accountValue: { flex: 1, textAlign: "right", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  passwordCopy: { flex: 1, minWidth: 0 },
  accountHint: { fontSize: fontSize.xs, lineHeight: 18, marginTop: 2 },
  menuGroup: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  divider: { height: 1 },
  version: { fontSize: 11, textAlign: "center", marginTop: spacing.xl },
});
