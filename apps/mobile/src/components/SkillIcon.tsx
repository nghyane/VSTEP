import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSkillColor, radius } from "@/theme";
import type { Skill } from "@/types/api";

const SKILL_ICONS: Record<Skill, keyof typeof Ionicons.glyphMap> = {
  listening: "headset",
  reading: "book",
  writing: "create",
  speaking: "mic",
};

const SKILL_LABELS: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

interface Props {
  skill: Skill;
  size?: number;
}

export function SkillIcon({ skill, size = 20 }: Props) {
  const color = useSkillColor(skill);
  return (
    <View style={[styles.container, { backgroundColor: color + "20" }]}>
      <Ionicons name={SKILL_ICONS[skill]} size={size} color={color} />
    </View>
  );
}

export { SKILL_ICONS, SKILL_LABELS };

const styles = StyleSheet.create({
  container: { width: 36, height: 36, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
});
