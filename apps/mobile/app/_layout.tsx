import { useEffect, useState, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext } from "@/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import {
  saveTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
} from "@/lib/auth";
import { logoutApi } from "@/lib/api";
import type { AuthUser } from "@/types/api";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredUser();
        if (stored) setUser(stored);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  const signIn = useCallback(
    async (accessToken: string, refreshToken: string, u: AuthUser) => {
      await saveTokens(accessToken, refreshToken, u);
      setUser(u);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      const at = await getAccessToken();
      const rt = await getRefreshToken();
      if (at && rt) await logoutApi(rt, at);
    } catch {
      // ignore
    } finally {
      await clearTokens();
      setUser(null);
      queryClient.clear();
    }
  }, []);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [user, isLoading]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
          <StatusBar style="dark" />
        </AuthContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
