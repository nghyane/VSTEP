import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { PromoRedeemCard } from "@/features/wallet/PromoRedeemCard";
import { TopUpSheet } from "@/features/wallet/TopUpSheet";
import { TopUpSuccessPopup } from "@/features/wallet/TopUpSuccessPopup";
import { useWalletBalance, useWalletTransactions } from "@/features/wallet/queries";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

export default function WalletScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data: balanceData } = useWalletBalance();
  const { data: txData } = useWalletTransactions();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null);

  const balance = balanceData?.balance ?? 0;
  const transactions = txData?.data ?? [];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
    >
      <Text style={[styles.title, { color: c.foreground }]}>Ví điện tử</Text>

      <DepthCard style={styles.balanceCard}>
        <GameIcon name="coin" size={48} />
        <Text style={[styles.balanceLabel, { color: c.subtle }]}>Số dư hiện tại</Text>
        <Text style={[styles.balanceValue, { color: c.foreground }]}>
          {balance.toLocaleString("vi-VN")} xu
        </Text>
      </DepthCard>

      <DepthButton variant="coin" fullWidth onPress={() => setTopUpVisible(true)}>
        Nạp xu
      </DepthButton>

      <PromoRedeemCard />

      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lịch sử giao dịch</Text>

      {transactions.length === 0 ? (
        <DepthCard style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: c.subtle }]}>Chưa có giao dịch nào</Text>
        </DepthCard>
      ) : (
        transactions.map((tx) => (
          <DepthCard key={tx.id} style={styles.txCard}>
            <View style={styles.txRow}>
              <View>
                <Text style={[styles.txType, { color: c.foreground }]}>{formatType(tx.type)}</Text>
                <Text style={[styles.txSource, { color: c.subtle }]}>{tx.sourceType}</Text>
              </View>
              <Text
                style={[styles.txDelta, { color: tx.delta > 0 ? c.success : c.destructive }]}
              >
                {tx.delta > 0 ? "+" : ""}{tx.delta.toLocaleString("vi-VN")}
              </Text>
            </View>
            <Text style={[styles.txDate, { color: c.subtle }]}>{formatDate(tx.createdAt)}</Text>
          </DepthCard>
        ))
      )}

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

function formatType(type: string): string {
  const map: Record<string, string> = {
    topup: "Nạp xu",
    promo: "Khuyến mãi",
    enrollment: "Đăng ký khóa học",
    spending: "Chi tiêu",
    refund: "Hoàn tiền",
  };
  return map[type] ?? type;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.base },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  balanceCard: { padding: spacing["2xl"], alignItems: "center", gap: spacing.xs },
  balanceLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  balanceValue: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  emptyCard: { padding: spacing["3xl"], alignItems: "center" },
  emptyText: { fontSize: fontSize.sm },
  txCard: { padding: spacing.base },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txType: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  txSource: { fontSize: fontSize.xs },
  txDelta: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  txDate: { fontSize: 10, marginTop: spacing.xs },
});
