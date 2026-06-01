import { StyleSheet, View } from "react-native";
import { useSkillColor, radius } from "@/theme";
import type { Skill } from "@/types/api";
import { GameIcon } from "@/components/GameIcon";

const SKILL_ICONS: Record<Skill, "listening" | "reading" | "writing" | "speaking"> = {
  listening: "listening",
  reading: "reading",
  writing: "writing",
  speaking: "speaking",
};

const SKILL_LABELS: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

interface SkillIconProps {
  skill: Skill;
  size?: number;
  bare?: boolean;
}

export function SkillIcon({ skill, size = 20, bare = false }: SkillIconProps) {
  const color = useSkillColor(skill);
  if (bare) {
    return <GameIcon name={SKILL_ICONS[skill]} size={size} />;
  }
  return (
    <View style={[styles.container, { backgroundColor: color + "20" }]}>
      <GameIcon name={SKILL_ICONS[skill]} size={size} />
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
