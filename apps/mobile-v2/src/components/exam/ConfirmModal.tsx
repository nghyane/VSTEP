import { Modal, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ visible, title, message, warning, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  const c = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[s.modalIcon, { backgroundColor: c.warningTint }]}>
            <Ionicons name="warning-outline" size={24} color={c.warning} />
          </View>
          <Text style={[s.modalTitle, { color: c.foreground }]}>{title}</Text>
          <Text style={[s.modalMsg, { color: c.mutedForeground }]}>{message}</Text>
          {warning && (
            <View style={[s.modalWarning, { backgroundColor: c.warningTint }]}>
              <Text style={[s.modalWarningText, { color: c.warning }]}>{warning}</Text>
            </View>
          )}
          <View style={s.modalBtns}>
            <HapticTouchable
              onPress={onCancel}
              style={[s.modalBtn, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: c.border }]}
            >
              <Text style={[s.modalBtnText, { color: c.foreground }]}>Ở lại</Text>
            </HapticTouchable>
            <HapticTouchable
              onPress={onConfirm}
              style={[s.modalBtn, { backgroundColor: c.primary, borderColor: c.primary, borderBottomColor: c.primaryDark }]}
            >
              <Text style={[s.modalBtnText, { color: c.primaryForeground }]}>{confirmLabel}</Text>
            </HapticTouchable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ResultScreen({
  result,
  sessionId,
  examTitle,
  onGoToResult,
  onGoToExams,
}: {
  result: { mcq?: { score: number; total: number }; mcqScore?: number; mcqTotal?: number; sessionId: string };
  sessionId: string;
  examTitle: string;
  onGoToResult: () => void;
  onGoToExams: () => void;
}) {
  const c = useThemeColors();
  const mcqScore = result.mcq?.score ?? result.mcqScore ?? 0;
  const mcqTotal = result.mcq?.total ?? result.mcqTotal ?? 0;
  const pct = mcqTotal > 0 ? Math.round((mcqScore / mcqTotal) * 100) : 0;

  return (
    <View style={[s.center, { backgroundColor: c.background, paddingHorizontal: spacing.xl }]}>
      <View style={[s.resultIcon, { backgroundColor: c.primaryTint }]}>
        <Ionicons name="checkmark" size={40} color={c.primary} />
      </View>
      <Text style={[s.resultTitle, { color: c.foreground }]}>Nộp bài thành công!</Text>
      <Text style={[s.resultExam, { color: c.mutedForeground }]}>{examTitle}</Text>
      <View style={[s.resultCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
        <Text style={[s.resultScoreLabel, { color: c.mutedForeground }]}>Điểm MCQ (Nghe + Đọc)</Text>
        <Text style={[s.resultScore, { color: c.primary }]}>{mcqScore}<Text style={[s.resultTotal, { color: c.subtle }]}>/{mcqTotal}</Text></Text>
        <View style={[s.resultBar, { backgroundColor: c.muted }]}>
          <View style={[s.resultFill, { backgroundColor: c.primary, width: `${pct}%` }]} />
        </View>
        <Text style={[s.resultAiNote, { color: c.subtle }]}>Writing và Speaking đang được AI chấm điểm</Text>
      </View>
      <DepthButton fullWidth onPress={onGoToResult} style={{ marginTop: spacing.xl }}>Xem chi tiết kết quả</DepthButton>
      <DepthButton variant="secondary" fullWidth onPress={onGoToExams} style={{ marginTop: spacing.sm }}>Về danh sách đề thi</DepthButton>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalBox: { width: "100%", borderWidth: 2, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  modalIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  modalTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, textAlign: "center" },
  modalMsg: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  modalWarning: { borderRadius: radius.md, padding: spacing.sm },
  modalWarningText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  modalBtns: { flexDirection: "row", gap: spacing.md },
  modalBtn: { flex: 1, minHeight: 48, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.button, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  modalBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, textAlign: "center", textTransform: "uppercase" },
  resultIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  resultTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  resultExam: { fontSize: fontSize.sm, marginTop: spacing.xs },
  resultCard: { width: "100%", borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.md, marginTop: spacing.xl },
  resultScoreLabel: { fontSize: fontSize.sm },
  resultScore: { fontSize: 56, fontFamily: fontFamily.extraBold },
  resultTotal: { fontSize: fontSize.xl },
  resultBar: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  resultFill: { height: "100%", borderRadius: 4 },
  resultAiNote: { fontSize: fontSize.xs, textAlign: "center" },
});
