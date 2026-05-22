import { Redirect, useLocalSearchParams } from "expo-router";
import type { Skill } from "@/types/api";

const VALID_SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function PracticeSkillRedirect() {
  const { skill } = useLocalSearchParams<{ skill: string }>();
  const next = VALID_SKILLS.includes(skill as Skill) ? skill : "listening";

  return <Redirect href={`/(app)/practice/${next}` as never} />;
}
