// UserAvatar — circular avatar with image or color-tinted initial fallback.
// Mirrors FE v3 ProfileAvatar visual: rounded, border, color from primary tint.
import { Image, StyleSheet, Text, View } from "react-native";

import { getUserAvatarSrc } from "@/lib/avatar";
import { fontFamily, useThemeColors } from "@/theme";
import type { AuthUser } from "@/types/api";

interface Props {
  user: Pick<AuthUser, "avatarKey" | "avatarUrl" | "email" | "fullName"> | null | undefined;
  fallbackName?: string;
  fallbackColor?: string;
  size?: number;
  /** Optional explicit URI — for previewing pending picks in the picker. */
  uriOverride?: string | null;
}

export function UserAvatar({ user, fallbackName, fallbackColor, size = 64, uriOverride }: Props) {
  const c = useThemeColors();
  const src = uriOverride ?? getUserAvatarSrc(user);
  const initial = (fallbackName ?? user?.fullName ?? user?.email ?? "L").charAt(0).toUpperCase();
  const bg = fallbackColor ?? c.primary;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2, borderColor: c.border },
        ]}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { color: "#FFFFFF", fontFamily: fontFamily.extraBold },
});
