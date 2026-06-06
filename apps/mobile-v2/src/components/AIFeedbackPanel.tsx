// AIFeedbackPanel — inline AI coaching feedback for writing grading.
// Mirrors apps/frontend-v3/src/features/grading/components/WritingAssessmentLayout.tsx FeedbackPanel.
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BrandIcon } from "@/components/BrandIcon";
import { DepthButton } from "@/components/DepthButton";
import type { FeedbackRequestState, AssessmentFeedback } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface Props {
  attemptId: string | null;
  feedbackRequest: FeedbackRequestState | null;
  feedbackBase: AssessmentFeedback | null;
  feedbackGenerated: AssessmentFeedback | null;
  pending: boolean;
  error: string | null;
  accentColor: string;
  onRequest: () => void;
  /** True when the base grading result already contains feedback (strengths/improvements/rewrites). */
  hasBaseFeedback?: boolean;
}

export function AIFeedbackPanel({
  attemptId,
  feedbackRequest,
  feedbackBase,
  feedbackGenerated,
  pending,
  error,
  accentColor,
  onRequest,
  hasBaseFeedback = false,
}: Props) {
  const c = useThemeColors();
  const canRequest = feedbackRequest?.canRequest === true;
  const requested = feedbackRequest?.requested === true;
  const cost = feedbackRequest?.costCoins ?? 0;
  const aiFeedback = feedbackGenerated ?? (hasBaseFeedback ? feedbackBase : null);
  const hasGenerated = feedbackGenerated !== null;

  // Mirrors fe v3 FeedbackPanel: paid feedback OR base result feedback = "hasFeedback"
  const hasFeedback = aiFeedback !== null;

  if (!attemptId || !canRequest) return null;

  const strengths = normalizeTextItems(aiFeedback?.strengths);
  const improvements = normalizeImprovementItems(
    hasFeedbackItems(aiFeedback?.improvements)
      ? aiFeedback?.improvements
      : aiFeedback?.evidenceNotes,
  );
  const rewrites = normalizeRewriteItems(aiFeedback?.rewrites);

  // When base result already has feedback (strengths/improvements/rewrites shown above),
  // only show the generated AI feedback content (or the base feedback if no generated yet).
  // When neither base nor generated has content, don't show empty sections.
  const hasContent = hasGenerated || (hasBaseFeedback && (strengths.length > 0 || improvements.length > 0 || rewrites.length > 0));

  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderLeftColor: accentColor }]}>
      <View style={[s.headerRow]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.overline, { color: c.subtle }]}>AI COACH</Text>
          <Text style={[s.title, { color: c.foreground }]}>
            {hasFeedback ? "Nhận xét AI" : "AI Coach"}
          </Text>
          <Text style={[s.description, { color: c.mutedForeground }]}>
            {hasFeedback
              ? "Phân tích điểm mạnh, điểm yếu và câu viết lại."
              : requested
                ? "Đã thanh toán. AI đang phân tích bài viết..."
                : "Mở phân tích điểm mạnh, điểm yếu và câu viết lại."}
          </Text>
        </View>
      </View>

      {!hasFeedback ? (
        <View style={s.requestRow}>
          {requested ? (
            <Text style={[s.statusText, { color: c.mutedForeground }]}>Đã thanh toán.</Text>
          ) : (
            <View style={[s.coinLabel, { backgroundColor: c.coinTint, borderColor: c.coin }]}>
              <BrandIcon name="coin" size={12} />
              <Text style={[s.coinText, { color: c.coinDark }]}>{cost} xu</Text>
            </View>
          )}
          <DepthButton variant="coin" onPress={onRequest} disabled={pending}>
            {pending ? "Đang xử lý..." : requested ? "Tải nhận xét AI" : "Nhận xét từ AI"}
          </DepthButton>
        </View>
      ) : null}

      {hasFeedback && !hasGenerated ? (
        <View style={[s.statusRow, { backgroundColor: c.surfaceTint }]}>
          <Ionicons name="checkmark-circle" size={16} color={accentColor} />
          <Text style={[s.statusText, { color: c.mutedForeground }]}>Đã có nhận xét.</Text>
        </View>
      ) : null}

      {pending ? (
        <View style={[s.loadingRow, { backgroundColor: c.surfaceTint }]}>
          <ActivityIndicator color={accentColor} size="small" />
          <Text style={[s.loadingText, { color: c.mutedForeground }]}>AI đang phân tích bài viết...</Text>
        </View>
      ) : null}

      {requested && !hasFeedback ? (
        <View style={[s.statusRow, { backgroundColor: c.surfaceTint }]}>
          <Ionicons name="time-outline" size={16} color={c.coinDark} />
          <Text style={[s.statusText, { color: c.mutedForeground }]}>Đã thanh toán. Đang chờ AI phản hồi...</Text>
        </View>
      ) : null}

      {hasContent ? (
        <View style={s.feedbackContent}>
          {strengths.length > 0 ? (
            <FeedbackBlock title="ĐIỂM MẠNH" tone="success" items={strengths} />
          ) : null}
          {improvements.length > 0 ? (
            <FeedbackBlock title="CẦN CẢI THIỆN" tone="warning" items={improvements.map((item) => item.message)} />
          ) : null}
          {rewrites.length > 0 ? (
            <View style={s.rewriteSection}>
              <Text style={[s.feedbackTitle, { color: c.info }]}>GỢI Ý VIẾT LẠI</Text>
              {rewrites.map((item, index) => (
                <View key={`${item.original}-${item.improved}-${index}`} style={[s.rewriteBlock, { borderColor: c.borderLight }]}>
                  {item.original ? <Text style={[s.rewriteText, { color: c.destructive }]}>Gốc: {item.original}</Text> : null}
                  {item.improved ? <Text style={[s.rewriteText, { color: c.foreground }]}>Cải thiện: {item.improved}</Text> : null}
                  {item.reason ? <Text style={[s.rewriteReason, { color: c.subtle }]}>{item.reason}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text style={[s.errorText, { color: c.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

function FeedbackBlock({ title, tone, items }: { title: string; tone: "success" | "warning"; items: string[] }) {
  const c = useThemeColors();
  const color = tone === "success" ? c.primary : c.warning;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[s.feedbackTitle, { color }]}>{title}</Text>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={s.feedRow}>
          <Ionicons name={tone === "success" ? "checkmark-circle" : "alert-circle"} size={14} color={color} style={{ marginTop: 2 }} />
          <Text style={[s.feedText, { color: c.foreground }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function normalizeTextItems(items: unknown): string[] {
  return normalizeFeedbackItems(items)
    .map((item) => {
      if (typeof item === "string") return item;
      if (!isRecord(item)) return "";
      return stringValue(item.message) ?? stringValue(item.label) ?? "";
    })
    .filter((item) => item.trim().length > 0);
}

function normalizeImprovementItems(items: unknown): { message: string; explanation: string }[] {
  return normalizeFeedbackItems(items)
    .map((item) => {
      if (typeof item === "string") return { message: item, explanation: "" };
      if (!isRecord(item)) return { message: "", explanation: "" };
      return {
        message: stringValue(item.message) ?? stringValue(item.label) ?? "",
        explanation: stringValue(item.explanation) ?? stringValue(item.detail) ?? "",
      };
    })
    .filter((item) => item.message.trim().length > 0);
}

function normalizeRewriteItems(items: unknown): { original: string; improved: string; reason: string }[] {
  return normalizeFeedbackItems(items)
    .map((item) => {
      if (typeof item === "string") return { original: "", improved: item, reason: "" };
      if (!isRecord(item)) return { original: "", improved: "", reason: "" };
      return {
        original: stringValue(item.original) ?? "",
        improved: stringValue(item.improved) ?? "",
        reason: stringValue(item.reason) ?? "",
      };
    })
    .filter((item) => item.original.trim().length > 0 || item.improved.trim().length > 0);
}

function hasFeedbackItems(items: unknown): boolean {
  return normalizeFeedbackItems(items).length > 0;
}

function normalizeFeedbackItems(items: unknown): unknown[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (!isRecord(items)) return [items];
  if (isFeedbackItemRecord(items)) return [items];
  return Object.values(items);
}

function isFeedbackItemRecord(item: Record<string, unknown>): boolean {
  return (
    typeof item.message === "string" ||
    typeof item.explanation === "string" ||
    typeof item.label === "string" ||
    typeof item.detail === "string" ||
    typeof item.original === "string" ||
    typeof item.improved === "string" ||
    typeof item.reason === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

const s = StyleSheet.create({
  card: { borderWidth: 2, borderLeftWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  overline: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, marginTop: 2 },
  description: { fontSize: fontSize.xs, lineHeight: 18, marginTop: spacing.xs },
  requestRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  coinLabel: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  coinText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  statusRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderRadius: radius.lg, padding: spacing.md,
  },
  statusText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  loadingRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderRadius: radius.lg, padding: spacing.md,
  },
  loadingText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  feedbackContent: { gap: spacing.lg },
  feedbackTitle: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 0.8 },
  feedRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  feedText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  rewriteSection: { gap: spacing.sm },
  rewriteBlock: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.xs },
  rewriteText: { fontSize: fontSize.xs, lineHeight: 18 },
  rewriteReason: { fontSize: fontSize.xs, fontStyle: "italic" },
  errorText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
