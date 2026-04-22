// Route dispatcher — redirects to skill-specific screens
// listening → /practice/listening/index
// reading   → /practice/reading/index
// writing/speaking → handled by [skill].tsx legacy (phase 6)
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function SkillDispatchScreen() {
  const { skill } = useLocalSearchParams<{ skill: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!skill) return;
    if (skill === "listening") {
      router.replace("/(app)/practice/listening");
    } else if (skill === "reading") {
      router.replace("/(app)/practice/reading");
    } else {
      // writing/speaking — stay on legacy screen (to be done in phase 6)
      // for now show loading until implemented
    }
  }, [skill]);

  return <LoadingScreen />;
}
