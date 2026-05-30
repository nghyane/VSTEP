// Notification type → visual map. Mirrors apps/frontend-v3/src/features/notifications/visuals.ts.
// BE pushes notifications with `type` field (commit 9343ca6 added `booking_cancelled`).
// Each row picks an Ionicons name + tint background + accent color based on type.
// Unknown types fall back to a generic coin look.
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { ThemeColors } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type NotifTone = "coin" | "warning" | "destructive" | "primary" | "info";

export interface NotifVisual {
  iconName: IoniconName;
  tone: NotifTone;
}

const VISUALS: Record<string, NotifVisual> = {
  topup_completed: { iconName: "wallet-outline", tone: "coin" },
  coin_received: { iconName: "gift-outline", tone: "coin" },
  grading_completed: { iconName: "trophy-outline", tone: "warning" },
  grading_failed: { iconName: "alert-circle-outline", tone: "destructive" },
  course_enrolled: { iconName: "book-outline", tone: "primary" },
  course_unenrolled: { iconName: "trash-outline", tone: "destructive" },
  booking_created: { iconName: "time-outline", tone: "info" },
  booking_cancelled: { iconName: "trash-outline", tone: "destructive" },
  study_reminder: { iconName: "alarm-outline", tone: "warning" },
};

const FALLBACK: NotifVisual = { iconName: "notifications-outline", tone: "coin" };

export function visualForType(type: string | null | undefined): NotifVisual {
  if (!type) return FALLBACK;
  return VISUALS[type] ?? FALLBACK;
}

export interface ToneColors {
  tint: string;
  accent: string;
}

export function toneColors(tone: NotifTone, c: ThemeColors): ToneColors {
  switch (tone) {
    case "coin":
      return { tint: c.coinTint, accent: c.coinDark };
    case "warning":
      return { tint: c.warningTint, accent: c.warning };
    case "destructive":
      return { tint: c.destructiveTint, accent: c.destructive };
    case "primary":
      return { tint: c.primaryTint, accent: c.primary };
    case "info":
      return { tint: c.infoTint, accent: c.info };
  }
}
