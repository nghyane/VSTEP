// Change password dialog — mirror FE v3 ChangePasswordDialog.
// Uses BE POST /me/change-password (added in commit a735a5e).
// Validates: current required, new ≥8 chars + different from current, confirm match.
// Maps BE field-level errors back to current_password / new_password inline.
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ApiError, api } from "@/lib/api";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirm?: string;
}

export function ChangePasswordDialog({ visible, onClose, onSuccess }: Props) {
  const c = useThemeColors();
  const { height } = useWindowDimensions();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) return;
    setCurrent("");
    setNext("");
    setConfirm("");
    setShowCurrent(false);
    setShowNext(false);
    setErrors({});
    setSubmitting(false);
  }, [visible]);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit() {
    const nextErrors: FieldErrors = {};
    if (current.length < 1) nextErrors.currentPassword = "Nhập mật khẩu hiện tại.";
    if (next.length < 8) nextErrors.newPassword = "Mật khẩu mới tối thiểu 8 ký tự.";
    else if (next === current) nextErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    if (confirm !== next) nextErrors.confirm = "Mật khẩu nhập lại không khớp.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await api.post<{ success: boolean }>("/api/v1/me/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      setSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitting(false);
      const out: FieldErrors = {};
      if (err instanceof ApiError) {
        // api.ts camelCase-transforms response body, so BE
        // `errors.current_password` arrives as `errors.currentPassword`.
        const body = err.body as
          | { errors?: Record<string, string[]>; message?: string }
          | null;
        const e = body?.errors ?? {};
        if (e.currentPassword?.[0]) out.currentPassword = e.currentPassword[0];
        if (e.newPassword?.[0]) out.newPassword = e.newPassword[0];
        if (!out.currentPassword && !out.newPassword) {
          out.currentPassword = body?.message ?? "Không đổi được mật khẩu.";
        }
      } else {
        out.currentPassword = "Không đổi được mật khẩu.";
      }
      setErrors(out);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            onPress={() => undefined}
            style={[styles.card, { backgroundColor: c.card, borderColor: c.border, maxHeight: height - spacing["3xl"] }]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={[styles.header, { backgroundColor: c.primaryTint }]}>
                <HapticTouchable
                  style={styles.closeBtn}
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={20} color={c.mutedForeground} />
                </HapticTouchable>
                <View style={[styles.lockBadge, { backgroundColor: c.primary }]}>
                  <Ionicons name="lock-closed" size={28} color={c.primaryForeground} />
                </View>
                <Text style={[styles.title, { color: c.foreground }]}>Đổi mật khẩu</Text>
                <Text style={[styles.subtitle, { color: c.subtle }]}>
                  Bảo vệ tài khoản — chỉ bạn biết mật khẩu mới.
                </Text>
              </View>

              <View style={styles.body}>
                <PasswordField
                  label="Mật khẩu hiện tại"
                  value={current}
                  onChangeText={(v) => {
                    setCurrent(v);
                    if (errors.currentPassword) setErrors((s) => ({ ...s, currentPassword: undefined }));
                  }}
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent((v) => !v)}
                  error={errors.currentPassword}
                  textContentType="password"
                />

                <PasswordField
                  label="Mật khẩu mới"
                  value={next}
                  onChangeText={(v) => {
                    setNext(v);
                    if (errors.newPassword) setErrors((s) => ({ ...s, newPassword: undefined }));
                  }}
                  show={showNext}
                  onToggleShow={() => setShowNext((v) => !v)}
                  error={errors.newPassword}
                  hint="Tối thiểu 8 ký tự, khác mật khẩu hiện tại."
                  textContentType="newPassword"
                />

                <PasswordField
                  label="Nhập lại mật khẩu mới"
                  value={confirm}
                  onChangeText={(v) => {
                    setConfirm(v);
                    if (errors.confirm) setErrors((s) => ({ ...s, confirm: undefined }));
                  }}
                  show={showNext}
                  onToggleShow={() => setShowNext((v) => !v)}
                  error={errors.confirm}
                  textContentType="newPassword"
                />

                <View style={styles.actionRow}>
                  <DepthButton variant="secondary" onPress={handleClose} disabled={submitting} style={styles.actionBtn}>
                    Hủy
                  </DepthButton>
                  <DepthButton onPress={handleSubmit} disabled={submitting} style={styles.actionBtn}>
                    {submitting ? <ActivityIndicator color={c.primaryForeground} /> : "Đổi mật khẩu"}
                  </DepthButton>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  show,
  onToggleShow,
  error,
  hint,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  hint?: string;
  textContentType?: "password" | "newPassword";
}) {
  const c = useThemeColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: c.surface,
            borderColor: error ? c.destructive : c.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete={textContentType === "newPassword" ? "new-password" : "password"}
          textContentType={textContentType}
          importantForAutofill="yes"
          placeholder="••••••••"
          placeholderTextColor={c.placeholder}
        />
        <HapticTouchable style={styles.eyeBtn} onPress={onToggleShow}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: c.subtle }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center" },
  body: { padding: spacing.xl, gap: spacing.md },
  field: { gap: spacing.xs },
  label: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.sm, fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  eyeBtn: { padding: spacing.xs },
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: spacing.xs },
  hintText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, marginTop: spacing.xs },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { flex: 1 },
});
