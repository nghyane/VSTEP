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
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useCreateProfile, useDeleteProfile, useResetProfile } from "@/hooks/use-profiles";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Profile } from "@/types/api";

const AVATAR_COLORS = ["#58CC02", "#1CB0F6", "#7850C8", "#FF9B00", "#FFC800", "#EA4335"];

export default function ProfileScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile: activeProfile, user, signOut } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const createMutation = useCreateProfile();
  const deleteMutation = useDeleteProfile();
  const resetMutation = useResetProfile();

  const [showCreate, setShowCreate] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
            setShowResetConfirm(false);
          },
        },
      ],
    );
  }

  if (isLoading) return <LoadingScreen />;

  const displayName = activeProfile?.nickname ?? user?.fullName ?? user?.email ?? "Người dùng";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarColor = activeProfile?.avatarColor ?? AVATAR_COLORS[0];
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
        <View style={[s.avatar, { backgroundColor: avatarColor }]}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
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
                onDelete={handleDeleteProfile}
              />
            ))}
          </View>
        </View>
      )}

      <DepthButton fullWidth variant="secondary" onPress={() => setShowCreate(true)}>
        <Ionicons name="add" size={16} color={c.primary} />
        <Text style={[s.createBtnText, { color: c.primary }]}>Thêm hồ sơ mới</Text>
      </DepthButton>

      {/* Settings */}
      <Text style={[s.sectionLabel, { color: c.subtle }]}>CÀI ĐẶT</Text>
      <View style={[s.menuGroup, { backgroundColor: c.card, borderColor: c.border }]}>
        <MenuRow icon="information-circle-outline" label="Tài khoản & Bảo mật" onPress={() => router.push("/(app)/account")} />
        <View style={[s.divider, { backgroundColor: c.borderLight }]} />
        <MenuRow icon="refresh-outline" label="Đặt lại tiến trình học" onPress={() => setShowResetConfirm(true)} />
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
        onCreate={createMutation.mutate}
        c={c}
      />
    </ScrollView>
  );
}

// ── Profile Row ──

function ProfileRow({ profile, isActive, onDelete }: { profile: Profile; isActive: boolean; onDelete: (p: Profile) => void }) {
  const c = useThemeColors();
  const initial = profile.nickname.charAt(0).toUpperCase();
  const color = profile.avatarColor ?? AVATAR_COLORS[Math.abs(profile.id.charCodeAt(0)) % AVATAR_COLORS.length];

  return (
    <View style={[s.profileRow, { backgroundColor: isActive ? c.primaryTint : c.card, borderColor: isActive ? c.primary : c.border }]}>
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
      {!profile.isInitialProfile && (
        <HapticTouchable style={s.deleteBtn} onPress={() => onDelete(profile)}>
          <Ionicons name="trash-outline" size={16} color={c.destructive} />
        </HapticTouchable>
      )}
    </View>
  );
}

// ── Create Profile Modal ──

function CreateProfileModal({ visible, onClose, onCreate, c }: { visible: boolean; onClose: () => void; onCreate: (input: { nickname: string; targetLevel: string; targetDeadline: string }) => void; c: ReturnType<typeof useThemeColors> }) {
  const [nickname, setNickname] = useState("");
  const [targetLevel, setTargetLevel] = useState("B1");
  const [targetDeadline, setTargetDeadline] = useState("");
  const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

  function handleSubmit() {
    if (!nickname.trim()) return;
    if (!targetDeadline) return;
    onCreate({ nickname: nickname.trim(), targetLevel, targetDeadline });
    setNickname("");
    setTargetLevel("B1");
    setTargetDeadline("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[s.modalTitle, { color: c.foreground }]}>Tạo hồ sơ mới</Text>

          <Text style={[s.inputLabel, { color: c.mutedForeground }]}>Tên hồ sơ</Text>
          <TextInput
            style={[s.input, { backgroundColor: c.surface, color: c.foreground, borderColor: c.border }]}
            value={nickname}
            onChangeText={setNickname}
            placeholder="VD: Luyện thi VSTEP B2"
            placeholderTextColor={c.placeholder}
          />

          <Text style={[s.inputLabel, { color: c.mutedForeground }]}>Mục tiêu</Text>
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
            placeholder="VD: 2025-12-31"
            placeholderTextColor={c.placeholder}
          />

          <View style={s.modalBtns}>
            <DepthButton variant="secondary" onPress={onClose} style={{ flex: 1 }}>Hủy</DepthButton>
            <DepthButton onPress={handleSubmit} disabled={!nickname.trim() || !targetDeadline} style={{ flex: 1 }}>
              Tạo
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
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 32, fontFamily: fontFamily.extraBold },
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
  profileAvatarText: { color: "#FFF", fontSize: 14, fontFamily: fontFamily.extraBold },
  profileName: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  profileMeta: { fontSize: fontSize.xs },
  activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  activeBadgeText: { color: "#FFF", fontSize: 10, fontFamily: fontFamily.bold },
  deleteBtn: { padding: spacing.xs },
  createBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  menuGroup: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  divider: { height: 1 },
  version: { fontSize: 11, textAlign: "center", marginTop: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalBox: { width: "100%", borderWidth: 2, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, textAlign: "center" },
  inputLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  input: { borderWidth: 2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm },
  levelRow: { flexDirection: "row", gap: spacing.xs },
  levelChip: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 2 },
  levelChipText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  modalBtns: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
});
