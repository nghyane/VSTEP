import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { getBookingStatusLabel, groupSlotsByDay } from "@/features/course/booking-utils";
import type { BookingSlot } from "@/features/course/types";
import { formatTime, formatWeekdayDate } from "@/lib/utils";
import { fontFamily, fontSize, radius, spacing, type ThemeColors, useThemeColors } from "@/theme";

interface BookingSlotListProps {
  slots: BookingSlot[];
  locked: boolean;
  onSelect: (slot: BookingSlot) => void;
}

export function BookingSlotList({ slots, locked, onSelect }: BookingSlotListProps) {
  const c = useThemeColors();
  const groups = groupSlotsByDay(slots);

  if (slots.length === 0) {
    return (
      <DepthCard style={styles.emptyCard}>
        <Text style={[styles.emptyTitle, { color: c.foreground }]}>Chưa có lịch trống</Text>
        <Text style={[styles.emptyDesc, { color: c.subtle }]}>Giảng viên sẽ mở thêm slot trong thời gian tới.</Text>
      </DepthCard>
    );
  }

  return (
    <View style={styles.list}>
      {groups.map((group) => (
        <DepthCard key={group.key} style={styles.dayCard}>
          <Text style={[styles.dayTitle, { color: c.foreground }]}>{formatWeekdayDate(group.titleIso)}</Text>
          <View style={styles.slotWrap}>
            {group.slots.map((slot) => (
              <SlotPill key={slot.id} slot={slot} locked={locked} onSelect={onSelect} />
            ))}
          </View>
        </DepthCard>
      ))}
    </View>
  );
}

interface SlotPillProps {
  slot: BookingSlot;
  locked: boolean;
  onSelect: (slot: BookingSlot) => void;
}

function SlotPill({ slot, locked, onSelect }: SlotPillProps) {
  const c = useThemeColors();
  const selectable = slot.status === "booked_me" || (slot.status === "available" && !locked);
  const tone = getSlotTone(slot.status, c);

  return (
    <HapticTouchable disabled={!selectable} onPress={() => onSelect(slot)} activeOpacity={0.8} scalePress>
      <View style={[styles.slot, { backgroundColor: tone.bg, borderColor: tone.border, opacity: selectable ? 1 : 0.58 }]}>
        <Text style={[styles.slotTime, { color: tone.text }]}>{formatTime(slot.startsAt)}</Text>
        <Text style={[styles.slotStatus, { color: tone.text }]}>{getBookingStatusLabel(slot.status)}</Text>
      </View>
    </HapticTouchable>
  );
}

function getSlotTone(status: BookingSlot["status"], c: ThemeColors) {
  switch (status) {
    case "available":
      return { bg: c.surface, border: c.primary, text: c.primaryDark };
    case "booked_me":
      return { bg: c.primaryTint, border: c.primary, text: c.primaryDark };
    case "booked_other":
      return { bg: c.muted, border: c.border, text: c.subtle };
    case "past":
      return { bg: c.borderLight, border: c.border, text: c.subtle };
  }
}

const styles = StyleSheet.create({
  list: { gap: spacing.base },
  emptyCard: { gap: spacing.xs, marginBottom: spacing.base },
  emptyTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  emptyDesc: { fontSize: fontSize.sm, lineHeight: 20 },
  dayCard: { gap: spacing.md },
  dayTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, textTransform: "capitalize" },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: { width: 104, minHeight: 58, borderWidth: 2, borderRadius: radius.lg, padding: spacing.sm, justifyContent: "center" },
  slotTime: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, textAlign: "center" },
  slotStatus: { fontSize: 10, fontFamily: fontFamily.bold, textAlign: "center", marginTop: 2 },
});
