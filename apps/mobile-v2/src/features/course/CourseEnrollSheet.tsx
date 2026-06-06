import { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { BottomSheet } from "@/components/BottomSheet";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { formatNumber, formatVnd } from "@/lib/utils";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { CourseWithRelations } from "@/features/course/types";
import type { Profile } from "@/types/api";

const SIGNATURE_WIDTH = 320;
const SIGNATURE_HEIGHT = 140;

interface Props {
  visible: boolean;
  course: CourseWithRelations;
  profile: Profile | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (signatureSvg: string) => void;
}

export function CourseEnrollSheet({ visible, course, profile, submitting, onClose, onConfirm }: Props) {
  const c = useThemeColors();
  const [agreed, setAgreed] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [draftPath, setDraftPath] = useState("");
  const [signatureSize, setSignatureSize] = useState({ width: SIGNATURE_WIDTH, height: SIGNATURE_HEIGHT });
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const hasSignature = paths.length > 0;
  const canSubmit = agreed && hasSignature && !submitting;

  useEffect(() => {
    if (!visible) {
      setAgreed(false);
      clearSignature();
    }
  }, [visible]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        currentPoints.current = [pointFromEvent(event, signatureSize)];
      },
      onPanResponderMove: (event) => {
        currentPoints.current = [...currentPoints.current.slice(-700), pointFromEvent(event, signatureSize)];
        setDraftPath(pathFromPoints(currentPoints.current));
      },
      onPanResponderRelease: () => {
        const path = pathFromPoints(currentPoints.current);
        if (path) setPaths((prev) => [...prev.filter(Boolean), path]);
        setDraftPath("");
        currentPoints.current = [];
      },
      onPanResponderTerminate: () => {
        setDraftPath("");
        currentPoints.current = [];
      },
    }),
    [signatureSize],
  );

  function clearSignature() {
    setPaths([]);
    setDraftPath("");
    currentPoints.current = [];
  }

  function handleAgreeToggle() {
    setAgreed((value) => {
      const next = !value;
      if (!next) clearSignature();
      return next;
    });
  }

  function handleConfirm() {
    if (!canSubmit) return;
    onConfirm(signatureSvg(paths));
  }

  return (
    <BottomSheet visible={visible} onClose={submitting ? () => undefined : onClose}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View>
          <Text style={[styles.title, { color: c.foreground }]}>Đăng ký khóa học</Text>
          <Text style={[styles.subtitle, { color: c.subtle }]}>Thanh toán một lần qua PayOS cho toàn khóa.</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <InfoRow label="Khóa học" value={course.title} />
          <InfoRow label="Hồ sơ" value={profile ? `${profile.nickname} — ${profile.targetLevel}` : "Chưa chọn hồ sơ"} />
          <InfoRow label="Tổng thanh toán" value={formatVnd(course.priceVnd)} strong />
          {course.bonusCoins > 0 ? (
            <InfoRow label="Xu tặng kèm" value={`+${formatNumber(course.bonusCoins)} xu`} strong />
          ) : null}
        </View>

        <View style={[styles.commitCard, { backgroundColor: c.warningTint, borderColor: c.warning }]}>
          <Text style={[styles.commitTitle, { color: c.foreground }]}>Cam kết kỷ luật</Text>
          <Text style={[styles.commitText, { color: c.foreground }]}>
            Để giữ cam kết đầu ra, bạn cần hoàn thành tối thiểu {course.requiredFullTests} bài thi full-test trong {course.commitmentWindowDays} ngày đầu của khóa.
          </Text>
          <HapticTouchable onPress={handleAgreeToggle} disabled={submitting} style={styles.agreeRow}>
            <View style={[styles.checkbox, { borderColor: agreed ? c.primary : c.border, backgroundColor: agreed ? c.primary : c.surface }]}>
              {agreed ? <Text style={styles.checkText}>✓</Text> : null}
            </View>
            <Text style={[styles.agreeText, { color: c.foreground }]}>Tôi đã đọc và đồng ý với điều khoản kỷ luật của khóa học.</Text>
          </HapticTouchable>
        </View>

        <View style={[styles.signatureSection, !agreed && styles.signatureDisabled]}>
          <View style={styles.signatureHeader}>
            <View>
              <Text style={[styles.sectionLabel, { color: c.subtle }]}>Ký xác nhận</Text>
              <Text style={[styles.signatureSub, { color: c.mutedForeground }]}>Cần ký sau khi đồng ý cam kết.</Text>
            </View>
            <HapticTouchable onPress={clearSignature} disabled={submitting || !hasSignature}>
              <Text style={[styles.clearText, { color: hasSignature ? c.destructive : c.subtle }]}>Vẽ lại</Text>
            </HapticTouchable>
          </View>
          <View
            style={[styles.signaturePad, { backgroundColor: c.surface, borderColor: agreed ? c.warning : c.border }]}
            onLayout={(event) => setSignatureSize(event.nativeEvent.layout)}
            {...(agreed && !submitting ? panResponder.panHandlers : {})}
          >
            <Svg width="100%" height="100%" viewBox={`0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`}>
              {[...paths, draftPath].filter(Boolean).map((path, index) => (
                <Path key={`${path}-${index}`} d={path} stroke={c.foreground} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </Svg>
            {!hasSignature ? (
              <Text style={[styles.signatureHint, { color: agreed ? c.warning : c.subtle }]}>Ký tên của bạn vào đây</Text>
            ) : null}
            <View style={[styles.signatureLine, { borderColor: agreed ? c.warning : c.border }]} />
          </View>
          <Text style={[styles.signatureStatus, { color: hasSignature ? c.primaryDark : c.subtle }]}>
            {hasSignature ? "Đã ký, bạn có thể tiếp tục thanh toán." : "Dùng ngón tay để ký xác nhận cam kết."}
          </Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <DepthButton variant="secondary" fullWidth onPress={onClose} disabled={submitting}>Hủy</DepthButton>
          </View>
          <View style={styles.actionItem}>
            <DepthButton fullWidth onPress={handleConfirm} disabled={!canSubmit}>
              {submitting ? "Đang tạo thanh toán..." : `Thanh toán ${formatVnd(course.priceVnd)}`}
            </DepthButton>
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const c = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[strong ? styles.infoValueStrong : styles.infoValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

function pointFromEvent(
  event: GestureResponderEvent,
  size: { width: number; height: number },
): { x: number; y: number } {
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  return {
    x: clamp((event.nativeEvent.locationX / width) * SIGNATURE_WIDTH, 0, SIGNATURE_WIDTH),
    y: clamp((event.nativeEvent.locationY / height) * SIGNATURE_HEIGHT, 0, SIGNATURE_HEIGHT),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pathFromPoints(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`, ...rest.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)].join(" ");
}

function signatureSvg(paths: string[]): string {
  const pathMarkup = paths
    .filter(Boolean)
    .map((path) => `<path d="${path}" stroke="#111827" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}">${pathMarkup}</svg>`;
}

const styles = StyleSheet.create({
  scroll: { maxHeight: "100%" },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.medium, marginTop: 2 },
  summaryCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  infoLabel: { flexShrink: 0, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  infoValue: { flex: 1, textAlign: "right", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  infoValueStrong: { flex: 1, textAlign: "right", fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  commitCard: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
  commitTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 1 },
  commitText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium, lineHeight: 21 },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingTop: spacing.xs },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderRadius: 6, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkText: { color: "#FFFFFF", fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, lineHeight: 18 },
  agreeText: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.medium, lineHeight: 20 },
  signatureSection: { gap: spacing.sm },
  signatureDisabled: { opacity: 0.72 },
  signatureHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 1 },
  signatureSub: { marginTop: 2, fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  clearText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  signaturePad: { height: SIGNATURE_HEIGHT, borderWidth: 2, borderStyle: "dashed", borderRadius: radius.lg, overflow: "hidden" },
  signatureHint: { position: "absolute", alignSelf: "center", top: SIGNATURE_HEIGHT / 2 - 10, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  signatureLine: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.lg, borderBottomWidth: 1, borderStyle: "dashed", opacity: 0.55 },
  signatureStatus: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  actions: { flexDirection: "row", gap: spacing.md, paddingBottom: spacing.md },
  actionItem: { flex: 1 },
});
