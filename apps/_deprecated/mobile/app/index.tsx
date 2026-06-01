import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Index() {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);

  if (isLoading) return <LoadingScreen />;

  if (user) return <Redirect href="/(app)/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
