import type { BookingSlot, BookingSlotStatus } from "@/features/course/types";
import { toDateKey } from "@/lib/utils";

export interface SlotGroup {
  key: string;
  titleIso: string;
  slots: BookingSlot[];
}

export function groupSlotsByDay(slots: BookingSlot[]): SlotGroup[] {
  return slots.reduce<SlotGroup[]>((groups, slot) => {
    const key = toDateKey(slot.startsAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.slots.push(slot);
      return groups;
    }
    groups.push({ key, titleIso: slot.startsAt, slots: [slot] });
    return groups;
  }, []);
}

export function getBookingStatusLabel(status: BookingSlotStatus): string {
  switch (status) {
    case "available":
      return "Còn trống";
    case "booked_me":
      return "Đã đặt";
    case "booked_other":
      return "Có người đặt";
    case "past":
      return "Đã qua";
  }
}
