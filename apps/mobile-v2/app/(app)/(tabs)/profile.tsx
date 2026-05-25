import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { CreateProfileSheet } from "@/features/profile/CreateProfileSheet";
import { EditProfileSheet } from "@/features/profile/EditProfileSheet";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeleteProfile,
  useProfiles,
  useResetProfile,
  useSwitchProfile,
} from "@/hooks/use-profiles";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { Profile } from "@/types/api";

const AVATAR_KEYS = ["primary", "info", "skillReading", "warning", "coin", "destructive"] as const;

export default function ProfileScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile: activeProfile, user, signOut, switchSession } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const deleteMutation = useDeleteProfile();
  const resetMutation = useResetProfile();
  const switchMutation = useSwitchProfile();

  const [showCreate, setShowCreate] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<Profile | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

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

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
      onError: () => setPendingDelete(null),
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

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[
        s.scroll,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={[s.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <HapticTouchable onPress={() => setShowAvatarPicker(true)} style={s.avatarTouch}>
          <UserAvatar user={user} size={84} fallbackName={displayName} fallbackColor={avatarColor} />
          <View style={[s.avatarEditBadge, { backgroundColor: c.primary, borderColor: c.card }]}>
            <Ionicons name="camera" size={12} color={c.primaryForeground} />
          </View>
        </HapticTouchable>
        <Text style={[s.heroName, { color: c.foreground }]}>{displayName}</Text>
        <Text style={[s.heroEmail, { color: c.mutedForeground }]}>{user?.email}</Text>
        <View style={[s.targetBadge, { backgroundColor: c.primaryTint }]}>
          <Text style={[s.targetBadgeText, { color: c.primary }]}>Mục tiêu: {targetLevel}</Text>
          {targetDeadline && (
            <Text style={[s.targetDateText, { color: c.primary }]}> · Thi ngày {formatDate(targetDeadline)}</Text>
          )}
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

      {/* Profile selector */}
      <Text style={[s.sectionLabel, { color: c.subtle }]}>HỒ SƠ CỦA BẠN</Text>
      <View style={s.profileList}>
        {profiles?.map((p) => (
          <ProfileRow
            key={p.id}
            profile={p}
            isActive={p.id === activeProfile?.id}
            isSwitching={switchMutation.isPending && pendingSwitch?.id === p.id}
            onSwitch={requestSwitch}
            onDelete={setPendingDelete}
          />
        ))}
      </View>

      <DepthButton fullWidth variant="secondary" onPress={() => setShowCreate(true)}>
        + Thêm mục tiêu mới
      </DepthButton>

      {/* Settings */}
      <Text style={[s.sectionLabel, { color: c.subtle }]}>CÀI ĐẶT</Text>
      <View style={[s.menuGroup, { backgroundColor: c.card, borderColor: c.border }]}>
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
          label="Trung tâm hỗ trợ"
          onPress={() => Alert.alert("Hỗ trợ", "Liên hệ: support@vstepgo.com")}
        />
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

      {/* Sheets & dialogs */}
      <CreateProfileSheet visible={showCreate} onClose={() => setShowCreate(false)} />
      <EditProfileSheet profile={editing} onClose={() => setEditing(null)} />
      <AvatarPickerSheet visible={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} />

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
        open={!!pendingDelete}
        title="Xóa hồ sơ?"
        description={
          pendingDelete
            ? `Hồ sơ "${pendingDelete.nickname}" sẽ bị xóa vĩnh viễn. Toàn bộ dữ liệu học tập sẽ mất.`
            : ""
        }
        confirmLabel="Xóa"
        cancelLabel="Huỷ"
        loadingLabel="Đang xóa…"
        isLoading={deleteMutation.isPending}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => !deleteMutation.isPending && setPendingDelete(null)}
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

// ── Profile Row ──

function ProfileRow({
  profile,
  isActive,
  isSwitching,
  onSwitch,
  onDelete,
}: {
  profile: Profile;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: (p: Profile) => void;
  onDelete: (p: Profile) => void;
}) {
  const c = useThemeColors();
  const initial = profile.nickname.charAt(0).toUpperCase();
  const color =
    profile.avatarColor ??
    c[AVATAR_KEYS[Math.abs(profile.id.charCodeAt(0)) % AVATAR_KEYS.length]];

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
      <View style={[s.profileAvatar, { backgroundColor: color }]}>
        <Text style={s.profileAvatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.profileName, { color: c.foreground }]}>{profile.nickname}</Text>
        <Text style={[s.profileMeta, { color: c.mutedForeground }]}>
          Mục tiêu: {profile.targetLevel}
          {profile.targetDeadline && ` · ${formatDate(profile.targetDeadline)}`}
        </Text>
      </View>
      {isActive && (
        <View style={[s.activeBadge, { backgroundColor: c.primary }]}>
          <Text style={s.activeBadgeText}>Đang dùng</Text>
        </View>
      )}
      {isSwitching && <ActivityIndicator size="small" color={c.primary} />}
      {!profile.isInitialProfile && !isActive && (
        <HapticTouchable style={s.deleteBtn} onPress={() => onDelete(profile)} disabled={isSwitching}>
          <Ionicons name="trash-outline" size={16} color={c.destructive} />
        </HapticTouchable>
      )}
    </HapticTouchable>
  );
}

// ── Menu Row ──

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

// ── Helpers ──

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

// ── Styles ──

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  heroCard: {
    borderWidth: 2,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    position: "relative",
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
  },
  targetBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  targetDateText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  heroActions: { flexDirection: "row", gap: spacing.sm },
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
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { color: "#FFFFFF", fontSize: 14, fontFamily: fontFamily.extraBold },
  profileName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  profileMeta: { fontSize: fontSize.xs },
  activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  activeBadgeText: { color: "#FFFFFF", fontSize: 10, fontFamily: fontFamily.bold },
  deleteBtn: { padding: spacing.xs },
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
