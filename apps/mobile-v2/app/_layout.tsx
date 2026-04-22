import { useFonts } from "expo-font";
import { useEffect, useState, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext } from "@/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import { saveTokens, clearTokens } from "@/lib/auth";
import { HapticsProvider } from "@/contexts/HapticsContext";
import { loadCoins } from "@/features/coin/coin-store";
import { loadStreakData } from "@/features/streak/streak-store";
import { loadNotifications } from "@/features/notification/notification-store";
import type { AuthUser, Profile } from "@/types/api";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    "Nunito-Regular":   require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-Medium":    require("../assets/fonts/Nunito-Medium.ttf"),
    "Nunito-SemiBold":  require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-Bold":      require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
  });

  useEffect(() => {
    (async () => {
      try {
        await clearTokens();
        await loadCoins();
        await loadStreakData();
        await loadNotifications();
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isLoading, fontsLoaded]);

  const signIn = useCallback(
    async (accessToken: string, refreshToken: string, u: AuthUser, p: Profile | null) => {
      await saveTokens(accessToken, refreshToken, u, p);
      setUser(u);
      setProfile(p);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setProfile(null);
    queryClient.clear();
  }, []);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [user, isLoading, fontsLoaded]);

  if (!fontsLoaded || isLoading) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, profile, isLoading, signIn, signOut }}>
          <HapticsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="dark" />
          </HapticsProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
