import { useFonts } from "expo-font";
import { useEffect, useState, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, type AuthStatus } from "@/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import { saveTokens, clearTokens } from "@/lib/auth";
import { refreshSession } from "@/lib/api";
import { HapticsProvider } from "@/contexts/HapticsContext";
import { loadCoins } from "@/features/coin/coin-store";
import { loadStreakData } from "@/features/streak/streak-store";
import { loadNotifications } from "@/features/notification/notification-store";
import type { AuthUser, Profile } from "@/types/api";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("initializing");

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
        const session = await refreshSession();
        if (session) {
          setUser(session.user);
          setProfile(session.profile);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
        await Promise.all([loadCoins(), loadStreakData(), loadNotifications()]).catch(() => undefined);
      } catch {
        setUser(null);
        setProfile(null);
        setStatus("unauthenticated");
      }
    })();
  }, []);

  useEffect(() => {
    if (status !== "initializing" && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status, fontsLoaded]);

  const signIn = useCallback(
    async (accessToken: string, refreshToken: string, u: AuthUser, p: Profile | null) => {
      await saveTokens(accessToken, refreshToken, u, p);
      queryClient.clear();
      setUser(u);
      setProfile(p);
      setStatus("authenticated");
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearTokens().catch(() => undefined);
    setUser(null);
    setProfile(null);
    queryClient.clear();
    setStatus("unauthenticated");
  }, []);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "initializing" || !fontsLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (status !== "authenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (status === "authenticated" && !profile && segments[1] !== "onboarding") {
      router.replace("/(app)/onboarding");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [status, profile, fontsLoaded, segments, router]);

  if (!fontsLoaded || status === "initializing") return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ status, user, profile, isLoading: false, signIn, signOut }}>
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
