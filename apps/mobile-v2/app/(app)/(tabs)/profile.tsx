import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Mascot } from "@/components/Mascot";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarPickerSheet } from "@/features/profile/AvatarPickerSheet";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useCreateProfile, useDeleteProfile, useResetProfile, useSwitchProfile } from "@/hooks/use-profiles";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Profile } from "@/types/api";

const AVATAR_KEYS = ["primary", "info", "skillReading", "warning", "coin", "destructive"] as const;

export default function ProfileScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile: activeProfile, user, signOut, switchSession } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const createMutation = useCreateProfile();
  const deleteMutation = useDeleteProfile();
  const resetMutation = useResetProfile();
  const switchMutation = useSwitchProfile();

  const [showCreate, setShowCreate] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  function handleSwitchProfile(p: Profile) {
    if (p.id === activeProfile?.id || switchMutation.isPending) return;
    Alert.alert(
      "Chuyển hồ sơ?",
      `Bạn sắp chuyển sang hồ sơ "${p.nickname}". Tiến trình luyện tập sẽ áp dụng cho hồ sơ này.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chuyển",
          onPress: () => {
            switchMutation.mutate(p.id, {
              onSuccess: async (res) => {
                await switchSession(res.accessToken, res.refreshToken, res.profile);
              },
            });
          },
        },
      ],
    );
  }

  function handleSignOut() {
    Alert.alert("Đăng xuất", "Bạn chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: signOut },
    ]);
  }

  function handleDeleteProfile(p: Profile) {
    Alert.alert(
      "Xóa hồ sơ",
      `Bạn có chắc muốn xóa hồ sơ "${p.nickname}"? Dữ liệu học tập sẽ bị mất.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(p.id),
        },
      ],
    );
  }

  function handleResetProfile() {
    if (!activeProfile) return;
    Alert.alert(
      "Đặt lại hồ sơ",
      "Toàn bộ dữ liệu học tập sẽ bị xóa. Bạn có chắc chắn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đặt lại",
          style: "destructive",
          onPress: () => {
            resetMutation.mutate(activeProfile.id);
          },
        },
      ],
    );
  }

  if (isLoading) return <LoadingScreen />;

  const displayName = activeProfile?.nickname ?? user?.fullName ?? user?.email ?? "Người dùng";
  const avatarColor = activeProfile?.avatarColor ?? c.primary;
  const targetLevel = activeProfile?.targetLevel ?? "Chưa đặt";
  const targetDeadline = activeProfile?.targetDeadline;

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
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
          <DepthButton variant="secondary" size="sm" onPress={() => router.push("/(app)/goal")}>
            Đổi mục tiêu
          </DepthButton>
        </View>
        <View style={s.mascotRow}>
          <Mascot name="wave" size={48} animation="none" />
        </View>
      </View>

      {/* Profile list */}
      {profiles && profiles.length > 1 && (
        <View>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>HỒ SƠ</Text>
          <View style={s.profileList}>
            {profiles.map((p) => (
              <ProfileRow
                key={p.id}
                profile={p}
                isActive={p.id === activeProfile?.id}
                isSwitching={switchMutation.isPending && p.id !== activeProfile?.id}
                onSwitch={handleSwitchProfile}
                onDelete={handleDeleteProfile}
              />
            ))}
          </View>
        </View>
      )}

      <DepthButton fullWidth variant="secondary" onPress={() => setShowCreate(true)}>
        + Thêm mục tiêu mới
      </DepthButton>

      {/* Settings */}
      <Text style={[s.sectionLabel, { color: c.subtle }]}>CÀI ĐẶT</Text>
      <View style={[s.menuGroup, { backgroundColor: c.card, borderColor: c.border }]}>
        <MenuRow icon="information-circle-outline" label="Tài khoản & Bảo mật" onPress={() => router.push("/(app)/account")} />
        <View style={[s.divider, { backgroundColor: c.borderLight }]} />
        <MenuRow icon="refresh-outline" label="Đặt lại tiến trình học" onPress={handleResetProfile} />
        <View style={[s.divider, { backgroundColor: c.borderLight }]} />
        <MenuRow icon="help-circle-outline" label="Trung tâm hỗ trợ" onPress={() => Alert.alert("Hỗ trợ", "Liên hệ: support@vstepgo.com")} />
      </View>

      <DepthButton variant="destructive" fullWidth onPress={handleSignOut} style={{ marginTop: spacing.md }}>
        Đăng xuất
      </DepthButton>

      <Text style={[s.version, { color: c.placeholder }]}>VSTEP Mobile v2.0.0</Text>

      {/* Create profile modal */}
      <CreateProfileModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        createMutation={createMutation}
        c={c}
      />

      {/* Avatar picker sheet */}
      <AvatarPickerSheet
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
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
  const color = profile.avatarColor ?? c[AVATAR_KEYS[Math.abs(profile.id.charCodeAt(0)) % AVATAR_KEYS.length]];

  return (
    <HapticTouchable
      scalePress={!isActive}
      disabled={isActive || isSwitching}
      onPress={() => onSwitch(profile)}
      style={[s.profileRow, { backgroundColor: isActive ? c.primaryTint : c.card, borderColor: isActive ? c.primary : c.border }]}
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
      {!profile.isInitialProfile && (
        <HapticTouchable style={s.deleteBtn} onPress={() => onDelete(profile)} disabled={isSwitching}>
          <Ionicons name="trash-outline" size={16} color={c.destructive} />
        </HapticTouchable>
      )}
    </HapticTouchable>
  );
}

// ── Create Profile Modal ──

function CreateProfileModal({ visible, onClose, createMutation, c }: { visible: boolean; onClose: () => void; createMutation: ReturnType<typeof useCreateProfile>; c: ReturnType<typeof useThemeColors> }) {
  const [nickname, setNickname] = useState("");
  const [targetLevel, setTargetLevel] = useState("B2");
  const [targetDeadline, setTargetDeadline] = useState("");
  const LEVELS = ["B1", "B2", "C1"];

  function handleSubmit() {
    const trimmed = nickname.trim();
    if (!trimmed || !targetDeadline) return;
    createMutation.mutate(
      { nickname: trimmed, targetLevel, targetDeadline },
      {
        onSuccess: () => {
          setNickname("");
          setTargetLevel("B2");
          setTargetDeadline("");
          onClose();
        },
      },
    );
  }

  const canSubmit = nickname.trim().length > 0 && targetDeadline.length > 0 && !createMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[s.modalHeader, { backgroundColor: c.primaryTint }]}>
            <View style={[s.modalAvatarPreview, { backgroundColor: c.primary }]}>
              <Text style={s.modalAvatarText}>{nickname.trim().charAt(0).toUpperCase() || "?"}</Text>
            </View>
            <Text style={[s.modalTitle, { color: c.foreground }]}>Tạo mục tiêu mới</Text>
            <Text style={[s.modalSub, { color: c.subtle }]}>Mỗi mục tiêu là một lộ trình riêng</Text>
          </View>

          <View style={s.modalBody}>
            <Text style={[s.inputLabel, { color: c.mutedForeground }]}>Nickname</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.surface, color: c.foreground, borderColor: c.border }]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="VD: Mục tiêu B2 tháng 6"
              placeholderTextColor={c.placeholder}
              maxLength={32}
            />

            <Text style={[s.inputLabel, { color: c.mutedForeground }]}>Mục tiêu trình độ</Text>
            <View style={s.levelRow}>
              {LEVELS.map((lvl) => (
                <HapticTouchable
                  key={lvl}
                  onPress={() => setTargetLevel(lvl)}
                  style={[
                    s.levelChip,
                    {
                      borderColor: targetLevel === lvl ? c.primary : c.border,
                      backgroundColor: targetLevel === lvl ? c.primaryTint : c.surface,
                      borderBottomColor: targetLevel === lvl ? c.primaryDark : c.border,
                    },
                  ]}
                >
                  <Text style={[s.levelChipText, { color: targetLevel === lvl ? c.primary : c.mutedForeground }]}>{lvl}</Text>
                </HapticTouchable>
              ))}
            </View>

            <Text style={[s.inputLabel, { color: c.mutedForeground }]}>Ngày thi dự kiến</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.surface, color: c.foreground, borderColor: c.border }]}
              value={targetDeadline}
              onChangeText={setTargetDeadline}
              placeholder="YYYY-MM-DD (VD: 2026-12-31)"
              placeholderTextColor={c.placeholder}
              keyboardType="numbers-and-punctuation"
            />

            {createMutation.isError ? (
              <Text style={[s.errorText, { color: c.destructive }]}>Không thể tạo hồ sơ. Vui lòng thử lại.</Text>
            ) : null}
          </View>

          <View style={s.modalBtns}>
            <DepthButton variant="secondary" onPress={onClose} style={{ flex: 1 }}>
              Hủy
            </DepthButton>
            <DepthButton onPress={handleSubmit} disabled={!canSubmit} style={{ flex: 1 }}>
              {createMutation.isPending ? "Đang tạo..." : "Tạo mục tiêu"}
            </DepthButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Menu Row ──

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
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
  heroCard: { borderWidth: 2, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.sm, position: "relative" },
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
  targetBadge: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  targetBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  targetDateText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  heroActions: { flexDirection: "row", gap: spacing.sm },
  mascotRow: { position: "absolute", right: spacing.md, bottom: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  profileList: { gap: spacing.sm },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#FFFFFF", fontSize: 14, fontFamily: fontFamily.extraBold },
  profileName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  profileMeta: { fontSize: fontSize.xs },
  activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  activeBadgeText: { color: "#FFFFFF", fontSize: 10, fontFamily: fontFamily.bold },
  deleteBtn: { padding: spacing.xs },
  menuGroup: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  divider: { height: 1 },
  version: { fontSize: 11, textAlign: "center", marginTop: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalBox: { width: "100%", borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, overflow: "hidden" },
  modalHeader: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.xs },
  modalAvatarPreview: { width: 56, height: 56, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  modalAvatarText: { color: "#FFFFFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  modalTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, textAlign: "center" },
  modalSub: { fontSize: fontSize.xs, textAlign: "center" },
  modalBody: { padding: spacing.xl, gap: spacing.md },
  inputLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  input: { borderWidth: 2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  levelRow: { flexDirection: "row", gap: spacing.sm },
  levelChip: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4 },
  levelChipText: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  modalBtns: { flexDirection: "row", gap: spacing.md, padding: spacing.xl, paddingTop: 0 },
});
