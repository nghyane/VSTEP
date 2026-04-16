import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

// ─── Types (aligned with frontend-v2 onboarding/types.ts) ────────

type Level = "A1" | "A2" | "B1" | "B2" | "C1";
type Skill = "listening" | "reading" | "writing" | "speaking";
type Motivation = "graduation" | "job_requirement" | "scholarship" | "personal" | "certification";

interface OnboardingData {
  entryLevel: Level;
  examDate: string | null;
  targetBand: Level;
  weaknesses: Skill[];
  motivation: Motivation | null;
}

// ─── Step config ──────────────────────────────────────────────────

const STEPS = [
  { label: "Trình độ", description: "Đánh giá đầu vào" },
  { label: "Ngày thi", description: "Lên kế hoạch" },
  { label: "Mục tiêu", description: "Band đích" },
  { label: "Điểm yếu", description: "Lựa chọn của bạn" },
  { label: "Xác nhận", description: "Hoàn tất" },
];

// ─── Screen ───────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ entryLevel: "A2", examDate: null, targetBand: "B2", weaknesses: [], motivation: null });

  const total = STEPS.length;
  const canBack = step > 0;

  function handleComplete() {
    // Save to local state — in Phase 7 this will call API
    router.replace("/(app)/(tabs)");
  }

  return (
    <View style={[s.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.stepCount, { color: c.mutedForeground }]}>Bước {step + 1} / {total}</Text>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={c.mutedForeground} />
        </HapticTouchable>
      </View>
      <Text style={[s.stepTitle, { color: c.foreground }]}>{STEPS[step].label}</Text>
      <Text style={[s.stepDesc, { color: c.mutedForeground }]}>{STEPS[step].description}</Text>

      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[s.progressFill, { backgroundColor: c.primary, width: `${((step + 1) / total) * 100}%` }]} />
      </View>

      {/* Step content */}
      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        {step === 0 && <LevelStep value={data.entryLevel} onChange={(v) => setData((p) => ({ ...p, entryLevel: v }))} />}
        {step === 1 && <ExamDateStep value={data.examDate} onChange={(v) => setData((p) => ({ ...p, examDate: v }))} />}
        {step === 2 && <GoalBandStep value={data.targetBand} entry={data.entryLevel} onChange={(v) => setData((p) => ({ ...p, targetBand: v }))} />}
        {step === 3 && <MotivationStep data={data} onChange={(partial) => setData((p) => ({ ...p, ...partial }))} />}
        {step === 4 && <ConfirmationStep data={data} />}
      </ScrollView>

      {/* Footer nav */}
      <View style={[s.footer, { borderTopColor: c.border, paddingBottom: insets.bottom + spacing.base }]}>
        <HapticTouchable onPress={() => setStep((s) => Math.max(0, s - 1))} disabled={!canBack} style={{ opacity: canBack ? 1 : 0.4 }}>
          <Text style={[s.backBtn, { color: c.mutedForeground }]}>← Quay lại</Text>
        </HapticTouchable>

        {/* Dots */}
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, { backgroundColor: i === step ? c.primary : i < step ? c.primary + "66" : c.muted }]} />
          ))}
        </View>

        {step < total - 1 ? (
          <HapticTouchable style={[s.nextBtn, { backgroundColor: c.primary }]} onPress={() => setStep((s) => s + 1)}>
            <Text style={s.nextBtnText}>Tiếp tục →</Text>
          </HapticTouchable>
        ) : (
          <HapticTouchable style={[s.nextBtn, { backgroundColor: c.primary }]} onPress={handleComplete}>
            <Ionicons name="rocket" size={14} color="#fff" />
            <Text style={s.nextBtnText}>Bắt đầu!</Text>
          </HapticTouchable>
        )}
      </View>
    </View>
  );
}

// ─── Step 1: Level ────────────────────────────────────────────────

const LEVELS: { value: Level; title: string; desc: string }[] = [
  { value: "A1", title: "Mới bắt đầu (A1)", desc: "Chưa biết hoặc biết rất ít tiếng Anh" },
  { value: "A2", title: "Sơ cấp (A2)", desc: "Giao tiếp đơn giản trong cuộc sống hàng ngày" },
  { value: "B1", title: "Trung cấp (B1)", desc: "Hiểu ý chính khi nghe/đọc, viết đoạn văn ngắn" },
  { value: "B2", title: "Khá (B2)", desc: "Đọc hiểu báo chí, viết luận có cấu trúc" },
  { value: "C1", title: "Nâng cao (C1)", desc: "Sử dụng thành thạo, đọc tài liệu học thuật" },
];

function LevelStep({ value, onChange }: { value: Level; onChange: (v: Level) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[s.questionText, { color: c.foreground }]}>Trình độ tiếng Anh hiện tại của bạn?</Text>
      {LEVELS.map((lv) => (
        <HapticTouchable key={lv.value} style={[s.optionCard, { borderColor: value === lv.value ? c.primary : c.border, backgroundColor: value === lv.value ? c.primary + "0D" : "transparent" }]} onPress={() => onChange(lv.value)}>
          <View style={[s.radio, value === lv.value ? { borderColor: c.primary, backgroundColor: c.primary } : { borderColor: c.border }]}>
            {value === lv.value && <View style={s.radioInner} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.optionTitle, { color: c.foreground }]}>{lv.title}</Text>
            <Text style={[s.optionDesc, { color: c.mutedForeground }]}>{lv.desc}</Text>
          </View>
        </HapticTouchable>
      ))}
    </View>
  );
}

// ─── Step 2: Exam Date ────────────────────────────────────────────

const DATE_OPTIONS = [
  { label: "1 tháng", months: 1 },
  { label: "3 tháng", months: 3 },
  { label: "6 tháng", months: 6 },
  { label: "1 năm", months: 12 },
  { label: "Chưa biết", months: null as number | null },
];

function ExamDateStep({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[s.questionText, { color: c.foreground }]}>Bạn dự định thi VSTEP khi nào?</Text>
      {DATE_OPTIONS.map((opt) => {
        const dateStr = opt.months ? new Date(Date.now() + opt.months * 30 * 86400000).toISOString().slice(0, 10) : null;
        const selected = value === dateStr;
        return (
          <HapticTouchable key={opt.label} style={[s.optionCard, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary + "0D" : "transparent" }]} onPress={() => onChange(dateStr)}>
            <View style={[s.radio, selected ? { borderColor: c.primary, backgroundColor: c.primary } : { borderColor: c.border }]}>
              {selected && <View style={s.radioInner} />}
            </View>
            <Text style={[s.optionTitle, { color: c.foreground }]}>{opt.label}</Text>
          </HapticTouchable>
        );
      })}
    </View>
  );
}

// ─── Step 3: Goal Band ────────────────────────────────────────────

const BANDS: Level[] = ["B1", "B2", "C1"];

function GoalBandStep({ value, entry, onChange }: { value: Level; entry: Level; onChange: (v: Level) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[s.questionText, { color: c.foreground }]}>Mục tiêu band VSTEP của bạn?</Text>
      <Text style={[s.hintText, { color: c.mutedForeground }]}>Trình độ hiện tại: {entry}</Text>
      {BANDS.map((band) => (
        <HapticTouchable key={band} style={[s.optionCard, { borderColor: value === band ? c.primary : c.border, backgroundColor: value === band ? c.primary + "0D" : "transparent" }]} onPress={() => onChange(band)}>
          <View style={[s.radio, value === band ? { borderColor: c.primary, backgroundColor: c.primary } : { borderColor: c.border }]}>
            {value === band && <View style={s.radioInner} />}
          </View>
          <Text style={[s.optionTitle, { color: c.foreground }]}>Band {band}</Text>
        </HapticTouchable>
      ))}
    </View>
  );
}

// ─── Step 4: Motivation + Weaknesses ──────────────────────────────

const WEAKNESSES: { key: Skill; label: string; icon: string }[] = [
  { key: "listening", label: "Nghe", icon: "headset" },
  { key: "reading", label: "Đọc", icon: "book" },
  { key: "writing", label: "Viết", icon: "create" },
  { key: "speaking", label: "Nói", icon: "mic" },
];

const MOTIVATIONS: { key: Motivation; label: string }[] = [
  { key: "graduation", label: "Tốt nghiệp" },
  { key: "job_requirement", label: "Yêu cầu công việc" },
  { key: "scholarship", label: "Học bổng" },
  { key: "personal", label: "Phát triển bản thân" },
  { key: "certification", label: "Chứng chỉ" },
];

function MotivationStep({ data, onChange }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={[s.questionText, { color: c.foreground }]}>Kỹ năng nào bạn cần cải thiện?</Text>
        <Text style={[s.hintText, { color: c.mutedForeground }]}>Có thể chọn nhiều</Text>
        <View style={s.chipGrid}>
          {WEAKNESSES.map((w) => {
            const sel = data.weaknesses.includes(w.key);
            return (
              <HapticTouchable key={w.key} style={[s.chipBtn, { borderColor: sel ? c.primary : c.border, backgroundColor: sel ? c.primary + "0D" : "transparent" }]} onPress={() => onChange({ weaknesses: sel ? data.weaknesses.filter((k) => k !== w.key) : [...data.weaknesses, w.key] })}>
                <Ionicons name={w.icon as any} size={20} color={sel ? c.primary : c.mutedForeground} />
                <Text style={[s.chipLabel, { color: sel ? c.primary : c.mutedForeground }]}>{w.label}</Text>
              </HapticTouchable>
            );
          })}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text style={[s.questionText, { color: c.foreground }]}>Lý do bạn học VSTEP?</Text>
        <View style={s.chipGrid}>
          {MOTIVATIONS.map((m) => {
            const sel = data.motivation === m.key;
            return (
              <HapticTouchable key={m.key} style={[s.chipBtn, { borderColor: sel ? c.primary : c.border, backgroundColor: sel ? c.primary + "0D" : "transparent" }]} onPress={() => onChange({ motivation: sel ? null : m.key })}>
                <Text style={[s.chipLabel, { color: sel ? c.primary : c.mutedForeground }]}>{m.label}</Text>
              </HapticTouchable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Step 5: Confirmation ─────────────────────────────────────────

function ConfirmationStep({ data }: { data: OnboardingData }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.base, alignItems: "center" }}>
      <Ionicons name="rocket" size={48} color={c.primary} />
      <Text style={[s.confirmTitle, { color: c.foreground }]}>Sẵn sàng chinh phục!</Text>
      <View style={[s.confirmCard, { backgroundColor: c.muted }]}>
        <ConfirmRow label="Trình độ" value={data.entryLevel} />
        <ConfirmRow label="Mục tiêu" value={`Band ${data.targetBand}`} />
        <ConfirmRow label="Ngày thi" value={data.examDate ? new Date(data.examDate).toLocaleDateString("vi-VN") : "Chưa xác định"} />
        <ConfirmRow label="Cần cải thiện" value={data.weaknesses.length > 0 ? data.weaknesses.map((w) => WEAKNESSES.find((x) => x.key === w)?.label).join(", ") : "Chưa chọn"} />
        <ConfirmRow label="Lý do" value={MOTIVATIONS.find((m) => m.key === data.motivation)?.label ?? "Chưa chọn"} />
      </View>
    </View>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={s.confirmRow}>
      <Text style={[s.confirmLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[s.confirmValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  stepCount: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  stepTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, paddingHorizontal: spacing.xl, marginTop: spacing.xs },
  stepDesc: { fontSize: fontSize.xs, paddingHorizontal: spacing.xl, marginTop: 2 },
  progressTrack: { height: 2, marginHorizontal: spacing.xl, marginTop: spacing.md },
  progressFill: { height: 2 },
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backBtn: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.sm },
  nextBtnText: { color: "#fff", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  // Shared
  questionText: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, marginBottom: spacing.sm },
  hintText: { fontSize: fontSize.xs, marginBottom: spacing.xs },
  optionCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optionTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  optionDesc: { fontSize: fontSize.xs, marginTop: 1 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chipBtn: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, alignItems: "center", gap: 4, minWidth: "45%" },
  chipLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  // Confirmation
  confirmTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  confirmCard: { width: "100%", borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  confirmRow: { flexDirection: "row", justifyContent: "space-between" },
  confirmLabel: { fontSize: fontSize.sm },
  confirmValue: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
});
