import { Redirect } from "expo-router";

// Classes tab handles this screen's content — redirect there
export default function ClassesIndex() {
  return <Redirect href="/(app)/(tabs)/classes" />;
}
