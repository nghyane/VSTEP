import { useState } from "react";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { TopUpSheet } from "@/features/wallet/TopUpSheet";
import { TopUpSuccessPopup } from "@/features/wallet/TopUpSuccessPopup";
import { useWalletBalance } from "@/features/wallet/queries";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

export default function TopUpScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: balanceData } = useWalletBalance();
  const [topUpVisible, setTopUpVisible] = useState(true);
  const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null);

  const balance = balanceData?.balance ?? 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: c.primary }]}>Quay lại</Text>
        </Pressable>
      </View>

      <DepthCard style={styles.balanceCard}>
        <Text style={[styles.balanceLabel, { color: c.subtle }]}>Số dư hiện tại</Text>
        <Text style={[styles.balanceValue, { color: c.coinDark }]}>
          {balance.toLocaleString("vi-VN")} xu
        </Text>
      </DepthCard>

      <DepthButton variant="coin" fullWidth onPress={() => setTopUpVisible(true)}>
        Chọn gói nạp
      </DepthButton>

      <Text style={[styles.helperText, { color: c.subtle }]}>Thanh toán mở bằng cổng PayOS. Sau khi hoàn tất, quay lại app để ví tự đồng bộ.</Text>

      <TopUpSheet
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        onSuccess={(coins, bal) => setSuccess({ coins, balance: bal })}
      />
      <TopUpSuccessPopup
        visible={success !== null}
        coinsAdded={success?.coins ?? 0}
        newBalance={success?.balance ?? 0}
        onClose={() => setSuccess(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.base },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.base },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  balanceCard: { padding: spacing["2xl"], alignItems: "center", marginBottom: spacing.base },
  balanceLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  balanceValue: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold, marginTop: spacing.xs },
  helperText: { fontSize: fontSize.sm, lineHeight: 20, textAlign: "center" },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
