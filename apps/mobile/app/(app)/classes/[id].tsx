import { Redirect } from "expo-router";

// Classes feature not yet available — redirect to tab
export default function ClassDetail() {
  return <Redirect href="/(app)/(tabs)/classes" />;
}
