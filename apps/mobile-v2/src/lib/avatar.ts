// Avatar helpers — DiceBear v9 avataaars seeds, mirror FE v3 `lib/avatar.ts`.
import type { AuthUser, AvatarKey } from "@/types/api";

const BG_COLORS = "b6e3f4,ffd5dc,c0aede,ffdfbf";

export const AVATAR_PRESETS: AvatarKey[] = [
  "Alex", "Jordan", "Sam", "Riley", "Casey", "Morgan", "Taylor", "Drew",
  "Quinn", "Avery", "Blake", "Cameron", "Dakota", "Emery", "Finley", "Hayden",
  "Indigo", "Jesse", "Kai", "Logan", "Mason", "Noah", "Oakley", "Parker",
  "Reese", "Sage", "Skyler", "Tatum", "Winter", "Zion",
];

/** DiceBear avataaars URL for a given seed. Returns PNG (RN <Image/> works without extra svg dep). */
export function getAvatarUrl(name: string): string {
  const firstName = extractFirstName(name);
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(firstName)}&backgroundColor=${BG_COLORS}&backgroundType=solid`;
}

/** Mirror FE v3 extractFirstName — strip display-name suffixes like "Alex (en-US)". */
export function extractFirstName(displayName: string): string {
  return displayName.split(/\s*[-–(]\s*/)[0].trim();
}

/** Pick the best image source for a user: uploaded URL → preset key → null. */
export function getUserAvatarSrc(user: Pick<AuthUser, "avatarKey" | "avatarUrl"> | null | undefined): string | null {
  if (!user) return null;
  if (user.avatarUrl) return user.avatarUrl;
  if (user.avatarKey) return getAvatarUrl(user.avatarKey);
  return null;
}
