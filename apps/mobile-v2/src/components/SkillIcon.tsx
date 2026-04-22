import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSkillColor, radius } from "@/theme";
import type { Skill } from "@/types/api";

const SKILL_ICONS: Record<Skill, keyof typeof Ionicons.glyphMap> = {
  listening: "headset",
  reading:   "book",
  writing:   "create",
  speaking:  "mic",
};

const SKILL_LABELS: Record<Skill, string> = {
  listening: "Listening",
  reading:   "Reading",
  writing:   "Writing",
  speaking:  "Speaking",
};

interface SkillIconProps {
  skill: Skill;
  size?: number;
  /** Render icon trần, không có khung nền. Dùng trong SkillCard, chip inline. */
  bare?: boolean;
}

export function SkillIcon({ skill, size = 20, bare = false }: SkillIconProps) {
  const color = useSkillColor(skill);
  if (bare) {
    return <Ionicons name={SKILL_ICONS[skill]} size={size} color={color} />;
  }
  return (
    <View style={[styles.container, { backgroundColor: color + "20" }]}>
      <Ionicons name={SKILL_ICONS[skill]} size={size} color={color} />
    </View>
  );
}

export { SKILL_ICONS, SKILL_LABELS };

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
