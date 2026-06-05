// Promo redeem card — input mã quà tặng + popup chúc mừng khi nhận thành công
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { PromoRedeemSuccessPopup } from "@/features/wallet/PromoRedeemSuccessPopup";
import { syncWalletBalanceCache, useRedeemPromo } from "@/features/wallet/queries";
import { ApiError } from "@/lib/api";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

export function PromoRedeemCard() {
  const c = useThemeColors();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null);
  const mutation = useRedeemPromo();

  const trimmed = code.trim();
  const disabled = trimmed === "" || mutation.isPending;

  function handleSubmit() {
    if (disabled) return;
    mutation.mutate(trimmed.toUpperCase(), {
      onSuccess: (data) => {
        setCode("");
        setFieldError(null);
        syncWalletBalanceCache(queryClient, data.balanceAfter);
        setSuccess({ coins: data.coinsGranted, balance: data.balanceAfter });
      },
      onError: (err) => {
        let message = "Mã không hợp lệ hoặc đã hết hạn.";
        if (err instanceof ApiError) {
          const body = err.body as { message?: string; errors?: Record<string, string[]> } | null;
          const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
          message = firstFieldError ?? body?.message ?? message;
        }
        setFieldError(message);
      },
    });
  }

  function handleCloseSuccess() {
    setSuccess(null);
  }

  return (
    <>
      <DepthCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: c.coinTint }]}>
            <GameIcon name="gift" size={28} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: c.foreground }]}>Nhập mã quà tặng</Text>
            <Text style={[styles.subtitle, { color: c.subtle }]}>
              Nhập mã khuyến mãi hoặc đối tác để nhận xu vào ví tài khoản.
            </Text>
          </View>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.surface,
              color: c.foreground,
              borderColor: fieldError ? c.destructive : c.border,
            },
          ]}
          value={code}
          onChangeText={(v) => {
            setCode(v.toUpperCase());
            if (fieldError) setFieldError(null);
          }}
          placeholder="VD: NEWYEAR2026"
          placeholderTextColor={c.placeholder}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={50}
        />
        {fieldError ? (
          <Text style={[styles.errorText, { color: c.destructive }]}>{fieldError}</Text>
        ) : null}

        <DepthButton variant="primary" fullWidth onPress={handleSubmit} disabled={disabled}>
          {mutation.isPending ? "Đang nhận..." : "Nhận xu"}
        </DepthButton>
      </DepthCard>

      <PromoRedeemSuccessPopup
        visible={success !== null}
        coinsAdded={success?.coins ?? 0}
        newBalance={success?.balance ?? 0}
        onClose={handleCloseSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, lineHeight: 18 },
  input: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: -spacing.xs },
});
