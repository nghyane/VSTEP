// EditProfileSheet — edit nickname + deadline of an existing profile.
// Mirror FE v3 EditProfileForm: target_level is read-only (data rule:
// "1 Profile = 1 Target. Do not change target, create new profile").
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { Profile } from "@/types/api";

interface Props {
  profile: Profile | null;
  onClose: () => void;
}

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDisplayDate(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return "";
  const [y, m, d] = input.split("-");
  return `${d}/${m}/${y}`;
}

function parseDateInput(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(input + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function daysUntil(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function EditProfileSheet({ profile, onClose }: Props) {
  const c = useThemeColors();
  const updateMutation = useUpdateProfile();
  const [nickname, setNickname] = useState("");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setTargetDeadline(profile.targetDeadline ?? "");
      setShowDatePicker(false);
      updateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!profile) return null;

  const trimmed = nickname.trim();
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(targetDeadline);
  const dirty = trimmed !== profile.nickname || targetDeadline !== (profile.targetDeadline ?? "");
  const canSubmit = trimmed.length > 0 && dateValid && dirty && !updateMutation.isPending;

  function handleClose() {
    if (updateMutation.isPending) return;
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit || !profile) return;
    updateMutation.mutate(
      { id: profile.id, nickname: trimmed, targetDeadline },
      { onSuccess: () => onClose() },
    );
  }

  function handleDateChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setTargetDeadline(toDateInput(selectedDate));
  }

  const dateDisplay = toDisplayDate(targetDeadline);
  const dateValue = parseDateInput(targetDeadline) ?? new Date();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
      >
        <Pressable style={s.backdrop} onPress={handleClose} />
        <View style={[s.box, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[s.header, { backgroundColor: c.primaryTint }]}>
            <View style={[s.avatarPreview, { backgroundColor: c.primary }]}>
              <Text style={s.avatarText}>{profile.nickname.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[s.title, { color: c.foreground }]}>Chỉnh sửa mục tiêu</Text>
            <Text style={[s.sub, { color: c.subtle }]}>Cập nhật thông tin lộ trình của bạn</Text>
          </View>

          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[s.label, { color: c.mutedForeground }]}>Nickname</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.surface, color: c.foreground, borderColor: c.border }]}
              value={nickname}
              onChangeText={setNickname}
              maxLength={32}
            />
            <Text style={[s.hint, { color: c.subtle }]}>Tên hiển thị trên hồ sơ</Text>

            <Text style={[s.label, { color: c.mutedForeground }]}>Ngày thi dự kiến</Text>
            <HapticTouchable
              onPress={() => setShowDatePicker(true)}
              style={[
                s.dateField,
                { backgroundColor: c.surface, borderColor: dateValid ? c.primary : c.border },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color={c.mutedForeground} />
              <Text
                style={[
                  s.dateFieldText,
                  { color: dateDisplay ? c.foreground : c.placeholder },
                ]}
              >
                {dateDisplay || "Chọn ngày thi..."}
              </Text>
            </HapticTouchable>
            {showDatePicker && (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            <Text style={[s.hint, { color: c.subtle }]}>
              {dateValid && targetDeadline && daysUntil(targetDeadline) > 0
                ? `Còn ${daysUntil(targetDeadline)} ngày để chuẩn bị`
                : "Chọn ngày thi để tính toán lộ trình"}
            </Text>

            <View style={[s.lockedBox, { borderColor: c.border }]}>
              <Text style={[s.lockedLabel, { color: c.subtle }]}>TRÌNH ĐỘ MỤC TIÊU</Text>
              <Text style={[s.lockedValue, { color: c.foreground }]}>{profile.targetLevel}</Text>
              <Text style={[s.lockedHint, { color: c.subtle }]}>
                Không thể đổi level — tạo mục tiêu mới nếu muốn level khác
              </Text>
            </View>

            {updateMutation.isError ? (
              <Text style={[s.error, { color: c.destructive }]}>
                Không lưu được. Vui lòng thử lại.
              </Text>
            ) : null}
          </ScrollView>

          <View style={[s.footer, { borderTopColor: c.borderLight }]}>
            <View style={{ flex: 1 }}>
              <DepthButton
                variant="secondary"
                fullWidth
                onPress={handleClose}
                disabled={updateMutation.isPending}
              >
                Hủy
              </DepthButton>
            </View>
            <View style={{ flex: 1 }}>
              <DepthButton fullWidth onPress={handleSubmit} disabled={!canSubmit}>
                {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
              </DepthButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  box: {
    width: "100%",
    maxWidth: 480,
    flex: 1,
    maxHeight: "92%",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  header: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.xs },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  avatarText: { color: "#FFFFFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  title: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, textAlign: "center" },
  sub: { fontSize: fontSize.xs, textAlign: "center" },
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md },
  label: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, marginTop: spacing.sm },
  input: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  hint: { fontSize: 11, fontFamily: fontFamily.medium },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dateFieldText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  lockedBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  lockedLabel: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  lockedValue: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    marginBottom: spacing.xs,
  },
  lockedHint: { fontSize: 11, fontFamily: fontFamily.medium },
  error: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: spacing.sm },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    flexShrink: 0,
  },
});
