// CreateProfileSheet — create new profile (mục tiêu mới). Mirror FE v3
// CreateProfileForm: entry_level → target_level → deadline with min date.
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useCreateProfile } from "@/hooks/use-profiles";
import { getApiErrorMessage } from "@/lib/api";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";
import type { Profile } from "@/types/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (profile: Profile) => Promise<void> | void;
}

// ─── Level constants (mirror FE v3 lib/vstep.ts) ───

const ENTRY_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type EntryLevel = (typeof ENTRY_LEVELS)[number];

const TARGET_LEVELS = ["B1", "B2", "C1"] as const;
type TargetLevel = (typeof TARGET_LEVELS)[number];

const LEVEL_RANK: Record<EntryLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };
const MIN_PREP_MONTHS = [1, 3, 6, 12, 18] as const;
const MAX_TARGET_DEADLINE = new Date(2028, 11, 31);

const TARGET_LEVEL_INFO: Record<TargetLevel, string> = {
  B1: "Giao tiếp cơ bản",
  B2: "Phổ biến nhất",
  C1: "Nâng cao",
};

function availableTargets(entry: EntryLevel): readonly TargetLevel[] {
  const minRank = LEVEL_RANK[entry];
  return TARGET_LEVELS.filter((l) => LEVEL_RANK[l as EntryLevel] >= minRank);
}

function minPrepMonths(entry: EntryLevel, target: TargetLevel): number {
  const gap = Math.max(0, LEVEL_RANK[target] - LEVEL_RANK[entry]);
  return MIN_PREP_MONTHS[gap] ?? MIN_PREP_MONTHS[MIN_PREP_MONTHS.length - 1];
}

function computeMinDate(entry: EntryLevel, target: TargetLevel): Date {
  const months = minPrepMonths(entry, target);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Helpers ───

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDisplayDate(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return "";
  const [y, m, d] = input.split("-");
  return `${d}/${m}/${y}`;
}

function parseDateInput(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(input + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOnOrAfter(date: Date | null, minDate: Date): boolean {
  return date !== null && startOfDay(date).getTime() >= startOfDay(minDate).getTime();
}

function isOnOrBefore(date: Date | null, maxDate: Date): boolean {
  return date !== null && startOfDay(date).getTime() <= startOfDay(maxDate).getTime();
}

function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  if (startOfDay(date).getTime() < startOfDay(minDate).getTime()) return minDate;
  if (startOfDay(date).getTime() > startOfDay(maxDate).getTime()) return maxDate;
  return date;
}

// ─── Component ───

export function CreateProfileSheet({ visible, onClose, onCreated }: Props) {
  const c = useThemeColors();
  const createMutation = useCreateProfile();
  const [nickname, setNickname] = useState("");
  const [entryLevel, setEntryLevel] = useState<EntryLevel>("A2");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("B2");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const targets = availableTargets(entryLevel);
  const trimmed = nickname.trim();
  const minDate = computeMinDate(entryLevel, targetLevel);
  const parsedDeadline = parseDateInput(targetDeadline);
  const dateValid = isOnOrAfter(parsedDeadline, minDate) && isOnOrBefore(parsedDeadline, MAX_TARGET_DEADLINE);
  const isSubmitting = createMutation.isPending || finishing;
  const canSubmit = trimmed.length > 0 && dateValid && !isSubmitting;

  function reset() {
    setNickname("");
    setEntryLevel("A2");
    setTargetLevel("B2");
    setTargetDeadline("");
    setShowDatePicker(false);
    setErrorText(null);
    setFinishing(false);
    createMutation.reset();
  }

  function handleClose() {
    if (isSubmitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setErrorText(null);
    setFinishing(true);
    try {
      const profile = await createMutation.mutateAsync({
        nickname: trimmed,
        entryLevel,
        targetLevel,
        targetDeadline,
      });
      await onCreated?.(profile);
      reset();
      onClose();
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    } finally {
      setFinishing(false);
    }
  }

  function handleDateChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setTargetDeadline(toDateInput(selectedDate));
  }

  function handleEntryChange(lvl: EntryLevel) {
    setEntryLevel(lvl);
    setTargetDeadline("");
    setErrorText(null);
    // Auto-fallback target if invalid for new entry
    const newTargets = availableTargets(lvl);
    if (!newTargets.includes(targetLevel)) {
      setTargetLevel(newTargets[0]);
    }
  }

  function handleTargetChange(lvl: TargetLevel) {
    setTargetLevel(lvl);
    setTargetDeadline("");
    setErrorText(null);
  }

  const dateDisplay = toDisplayDate(targetDeadline);
  const dateValue = parseDateInput(targetDeadline) ?? new Date();
  const pickerDate = clampDate(dateValue, minDate, MAX_TARGET_DEADLINE);
  const prepMonths = minPrepMonths(entryLevel, targetLevel);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
      >
        <Pressable style={s.backdrop} onPress={handleClose} />
        <View style={[s.box, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[s.header, { backgroundColor: c.primaryTint }]}>
            <View style={[s.avatarPreview, { backgroundColor: c.primary }]}>
              <Text style={s.avatarText}>{trimmed.charAt(0).toUpperCase() || "?"}</Text>
            </View>
            <Text style={[s.title, { color: c.foreground }]}>Tạo mục tiêu mới</Text>
            <Text style={[s.sub, { color: c.subtle }]}>Mỗi mục tiêu là một lộ trình riêng</Text>
          </View>

          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[s.label, { color: c.mutedForeground }]}>Nickname</Text>
            <TextInput
              style={[s.input, { backgroundColor: c.surface, color: c.foreground, borderColor: c.border }]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="VD: Mục tiêu B2 tháng 6"
              placeholderTextColor={c.placeholder}
              maxLength={32}
            />
            <Text style={[s.hint, { color: c.subtle }]}>
              Tên hiển thị trên hồ sơ — tối đa 32 ký tự
            </Text>

            <Text style={[s.label, { color: c.mutedForeground }]}>
              Trình độ hiện tại (tự đánh giá)
            </Text>
            <View style={s.levelRow}>
              {ENTRY_LEVELS.map((lvl) => {
                const active = entryLevel === lvl;
                return (
                  <HapticTouchable
                    key={lvl}
                    onPress={() => handleEntryChange(lvl)}
                    style={[
                      s.levelChipSmall,
                      {
                        borderColor: active ? c.primary : c.border,
                        backgroundColor: active ? c.primaryTint : c.surface,
                        borderBottomColor: active ? c.primaryDark : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.levelChipTextSmall,
                        { color: active ? c.primary : c.mutedForeground },
                      ]}
                    >
                      {lvl}
                    </Text>
                  </HapticTouchable>
                );
              })}
            </View>
            <Text style={[s.hint, { color: c.subtle }]}>
              {"Dùng để gợi ý lộ trình ban đầu. \u201CDự đoán\u201D sẽ tự cập nhật sau 5 bài thi thử."}
            </Text>

            <Text style={[s.label, { color: c.mutedForeground }]}>Mục tiêu trình độ</Text>
            <View style={s.levelRow}>
              {targets.map((lvl) => {
                const active = targetLevel === lvl;
                return (
                  <HapticTouchable
                    key={lvl}
                    onPress={() => handleTargetChange(lvl)}
                    style={[
                      s.levelChip,
                      {
                        borderColor: active ? c.primary : c.border,
                        backgroundColor: active ? c.primaryTint : c.surface,
                        borderBottomColor: active ? c.primaryDark : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.levelChipText,
                        { color: active ? c.primary : c.mutedForeground },
                      ]}
                    >
                      {lvl}
                    </Text>
                    <Text
                      style={[
                        s.levelChipHint,
                        { color: active ? c.primaryDark : c.subtle },
                      ]}
                    >
                      {TARGET_LEVEL_INFO[lvl]}
                    </Text>
                  </HapticTouchable>
                );
              })}
            </View>

            <Text style={[s.label, { color: c.mutedForeground }]}>Ngày thi dự kiến</Text>
            <HapticTouchable
              onPress={() => setShowDatePicker(true)}
              style={[
                s.dateField,
                { backgroundColor: c.surface, borderColor: dateValid ? c.primary : c.border },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color={c.mutedForeground} />
              <Text
                style={[
                  s.dateFieldText,
                  { color: dateDisplay ? c.foreground : c.placeholder },
                ]}
              >
                {dateDisplay || "Chọn ngày thi..."}
              </Text>
            </HapticTouchable>
            {showDatePicker && (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={minDate}
                maximumDate={MAX_TARGET_DEADLINE}
                onChange={handleDateChange}
              />
            )}
            <Text style={[s.hint, { color: c.subtle }]}>
              Tối thiểu {prepMonths} tháng để đạt {entryLevel} → {targetLevel}. Chọn ngày không quá 31/12/2028.
            </Text>

            {errorText ? (
              <Text style={[s.error, { color: c.destructive }]}>
                {errorText}
              </Text>
            ) : null}
          </ScrollView>

          <View style={[s.footer, { borderTopColor: c.borderLight }]}>
            <View style={{ flex: 1 }}>
              <DepthButton
                variant="secondary"
                fullWidth
                onPress={handleClose}
                disabled={isSubmitting}
              >
                Hủy
              </DepthButton>
            </View>
            <View style={{ flex: 1 }}>
              <DepthButton fullWidth onPress={handleSubmit} disabled={!canSubmit}>
                {isSubmitting ? "Đang tạo..." : "Tạo"}
              </DepthButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  box: {
    width: "100%",
    maxWidth: 480,
    flex: 1,
    maxHeight: "92%",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  header: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.xs },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  avatarText: { color: "#FFFFFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  title: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, textAlign: "center" },
  sub: { fontSize: fontSize.xs, textAlign: "center" },
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md },
  label: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, marginTop: spacing.sm },
  input: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  hint: { fontSize: 11, fontFamily: fontFamily.medium },
  levelRow: { flexDirection: "row", gap: spacing.xs },
  levelChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  levelChipText: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  levelChipHint: { fontSize: 9, fontFamily: fontFamily.bold, marginTop: 2 },
  levelChipSmall: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  levelChipTextSmall: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dateFieldText: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  error: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, marginTop: spacing.sm },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    flexShrink: 0,
  },
});
