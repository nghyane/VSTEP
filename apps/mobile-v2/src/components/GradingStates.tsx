import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, spacing, fontFamily, fontSize } from "@/theme";

interface PendingProps {
  title: string;
  subtitle: string;
  accentColor: string;
  onBack: () => void;
  backLabel?: string;
}

export function GradingPendingState({
  title,
  subtitle,
  accentColor,
  onBack,
  backLabel = "Về danh sách",
}: PendingProps) {
  const c = useThemeColors();
  return (
    <View style={s.center}>
      <Mascot name="think" size={112} animation="float" />
      <Text style={[s.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[s.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text>
      <View style={s.statusRow}>
        <ActivityIndicator color={accentColor} size="small" />
        <Text style={[s.statusText, { color: accentColor }]}>Đang tự cập nhật...</Text>
      </View>
      <DepthButton variant="secondary" onPress={onBack} style={s.actionButton}>
        {backLabel}
      </DepthButton>
    </View>
  );
}

interface ErrorProps {
  title: string;
  subtitle: string;
  onRetry: () => void;
  onBack: () => void;
  retrying?: boolean;
}

export function GradingErrorState({ title, subtitle, onRetry, onBack, retrying }: ErrorProps) {
  const c = useThemeColors();
  return (
    <View style={s.center}>
      <Mascot name="sad" size={104} animation="bounce" />
      <Text style={[s.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[s.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text>
      <View style={s.errorActions}>
        <DepthButton variant="secondary" onPress={onBack} style={s.splitButton}>
          Quay lại
        </DepthButton>
        <DepthButton onPress={onRetry} disabled={retrying} style={s.splitButton}>
          {retrying ? "Đang thử..." : "Thử lại"}
        </DepthButton>
      </View>
    </View>
  );
}

export function GradingLoadingState({ label, accentColor }: { label: string; accentColor: string }) {
  const c = useThemeColors();
  return (
    <View style={s.center}>
      <View style={[s.loadingIcon, { backgroundColor: c.surfaceTint }]}>
        <Ionicons name="sparkles-outline" size={28} color={accentColor} />
      </View>
      <ActivityIndicator color={accentColor} size="large" />
      <Text style={[s.subtitle, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.extraBold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  actionButton: {
    marginTop: spacing.md,
  },
  errorActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  splitButton: {
    minWidth: 120,
  },
  loadingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
