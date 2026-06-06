import { Redirect, useLocalSearchParams } from "expo-router";

export default function CoursePaymentReturnScreen() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();

  if (typeof courseId === "string" && courseId.length > 0) {
    return <Redirect href={`/(app)/courses/${courseId}`} />;
  }

  return <Redirect href="/(app)/(tabs)/classes" />;
}
