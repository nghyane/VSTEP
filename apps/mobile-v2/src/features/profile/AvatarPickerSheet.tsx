// AvatarPickerSheet — bottom sheet to upload photo or pick a preset DiceBear seed.
// Mirror FE v3 `AvatarPickerSection` in `_app/ho-so.tsx` flow:
// - Tap "Tải ảnh lên" → expo-image-picker → preview as pending file
// - Tap a preset → preview as pending key
// - "Lưu" commits via uploadAvatarPhoto / updateAvatarPreset
// - "Hủy" clears pending state
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/components/BottomSheet";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { UserAvatar } from "@/components/UserAvatar";
import {
  updateAvatarPreset,
  uploadAvatarPhoto,
} from "@/features/profile/avatar-actions";
import { useAuth } from "@/hooks/use-auth";
import { AVATAR_PRESETS, getAvatarUrl } from "@/lib/avatar";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { AvatarKey } from "@/types/api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface PendingFile {
  uri: string;
  mimeType: string;
}

export function AvatarPickerSheet({ visible, onClose }: Props) {
  const c = useThemeColors();
  const { user, updateUser } = useAuth();
  const [pendingKey, setPendingKey] = useState<AvatarKey | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [saving, setSaving] = useState(false);

  function clearPending() {
    setPendingKey(null);
    setPendingFile(null);
  }

  function handleClose() {
    if (saving) return;
    clearPending();
    onClose();
  }

  async function handlePickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Cần quyền truy cập", "Hãy cấp quyền truy cập thư viện ảnh để chọn avatar.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    setPendingFile({
      uri: asset.uri,
      // BE accepts jpg|jpeg|png|webp; expo returns mimeType when available.
      mimeType: asset.mimeType ?? guessMime(asset.uri),
    });
    setPendingKey(null);
  }

  async function handleSave() {
    if (!pendingFile && !pendingKey) return;
    setSaving(true);
    try {
      if (pendingFile) {
        const res = await uploadAvatarPhoto(pendingFile.uri, pendingFile.mimeType);
        await updateUser({ avatarUrl: res.avatarUrl, avatarKey: null });
      } else if (pendingKey) {
        const res = await updateAvatarPreset(pendingKey);
        await updateUser({ avatarKey: res.avatarKey, avatarUrl: null });
      }
      setSaving(false);
      clearPending();
      onClose();
    } catch {
      setSaving(false);
      Alert.alert("Không lưu được", "Vui lòng thử lại sau.");
    }
  }

  const previewUri = pendingFile?.uri ?? (pendingKey ? getAvatarUrl(pendingKey) : null);
  const isDirty = pendingFile !== null || pendingKey !== null;

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: c.foreground }]}>Đổi avatar</Text>
            <Text style={[styles.subtitle, { color: c.subtle }]}>
              Tải ảnh của bạn lên hoặc chọn một avatar có sẵn.
            </Text>
          </View>
          <HapticTouchable style={styles.closeBtn} onPress={handleClose} disabled={saving}>
            <Ionicons name="close" size={20} color={c.mutedForeground} />
          </HapticTouchable>
        </View>

        <View style={styles.previewRow}>
          <UserAvatar user={user} size={88} uriOverride={previewUri ?? undefined} />
          <View style={styles.previewActions}>
            <DepthButton variant="secondary" size="sm" onPress={handlePickPhoto} disabled={saving}>
              <Ionicons name="image-outline" size={14} color={c.primary} />
              <Text style={[styles.uploadBtnText, { color: c.primary }]}>Tải ảnh lên</Text>
            </DepthButton>
            <Text style={[styles.previewHint, { color: c.subtle }]}>
              JPG/PNG/WEBP · ≤ 2 MB
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.subtle }]}>HOẶC CHỌN AVATAR CÓ SẴN</Text>

        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
        >
          <View style={styles.gridWrap}>
            {AVATAR_PRESETS.map((key) => {
              const selected = pendingKey === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setPendingKey(key);
                    setPendingFile(null);
                  }}
                  style={[
                    styles.gridItem,
                    {
                      borderColor: selected ? c.primary : c.border,
                      backgroundColor: selected ? c.primaryTint : c.surface,
                    },
                  ]}
                >
                  <Image source={{ uri: getAvatarUrl(key) }} style={styles.gridImage} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <DepthButton
            variant="secondary"
            onPress={handleClose}
            disabled={saving}
            style={styles.footerBtn}
          >
            Hủy
          </DepthButton>
          <DepthButton
            onPress={handleSave}
            disabled={!isDirty || saving}
            style={styles.footerBtn}
          >
            {saving ? <ActivityIndicator color={c.primaryForeground} /> : "Lưu"}
          </DepthButton>
        </View>
      </View>
    </BottomSheet>
  );
}

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

const TILE = 64;

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  previewRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, paddingVertical: spacing.sm },
  previewActions: { flex: 1, gap: spacing.xs },
  uploadBtnText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  previewHint: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  grid: { maxHeight: 280 },
  gridContent: {},
  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "flex-start" },
  gridItem: {
    width: TILE,
    height: TILE,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gridImage: { width: TILE - 8, height: TILE - 8, borderRadius: (TILE - 8) / 2 },
  footer: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  footerBtn: { flex: 1 },
});
