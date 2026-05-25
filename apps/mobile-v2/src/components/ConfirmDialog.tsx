// ConfirmDialog — mirror FE v3 ConfirmDialog. Warning icon + optional destructive
// styling. Backdrop press triggers onCancel.
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface Props {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Ở lại",
  loadingLabel = "Đang xử lý…",
  onConfirm,
  onCancel,
  isLoading,
  destructive,
}: Props) {
  const c = useThemeColors();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable
          style={[s.box, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.iconWrap, { backgroundColor: c.warningTint, borderColor: c.warning }]}>
            <Ionicons name="warning" size={26} color={c.warning} />
          </View>

          <Text style={[s.title, { color: c.foreground }]}>{title}</Text>
          {typeof description === "string" ? (
            <Text style={[s.desc, { color: c.mutedForeground }]}>{description}</Text>
          ) : (
            <View style={s.descBlock}>{description}</View>
          )}

          <View style={s.actions}>
            <DepthButton variant="secondary" fullWidth onPress={onCancel} disabled={isLoading}>
              {cancelLabel}
            </DepthButton>
            <DepthButton
              variant={destructive ? "destructive" : "primary"}
              fullWidth
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? loadingLabel : confirmLabel}
            </DepthButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  box: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.extraBold,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  desc: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  descBlock: { marginBottom: spacing.lg, alignItems: "center" },
  actions: { gap: spacing.sm, width: "100%" },
});
