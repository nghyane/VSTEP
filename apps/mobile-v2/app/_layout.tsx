import { useFonts } from "expo-font";
import { useEffect, useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, type AuthStatus } from "@/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from "@/lib/auth";
import { refreshSession } from "@/lib/api";
import { HapticsProvider } from "@/contexts/HapticsContext";
import { WelcomeGiftModal } from "@/features/onboarding/WelcomeGiftModal";
import { loadStreakData, resetStreakData } from "@/features/streak/streak-store";
import type { AuthUser, Profile } from "@/types/api";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [suggestedNickname, setSuggestedNickname] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito-Medium.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
  });

  useEffect(() => {
    (async () => {
      try {
        const session = await refreshSession();
        if (session.status === "ok") {
          setUser(session.user);
          setProfile(session.profile);
          setSuggestedNickname(null);
          setStatus("authenticated");
        } else {
          if (session.status === "expired") {
            Alert.alert(
              "Phiên đăng nhập đã hết hạn",
              "Vui lòng đăng nhập lại để tiếp tục.",
            );
          }
          setStatus("unauthenticated");
        }
        await loadStreakData().catch(() => undefined);
      } catch {
        setUser(null);
        setProfile(null);
        setSuggestedNickname(null);
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
      if (p) setSuggestedNickname(null);
      setStatus("authenticated");
    },
    [],
  );

  const switchSession = useCallback(
    async (accessToken: string, refreshToken: string, p: Profile) => {
      if (!user) return;
      await saveTokens(accessToken, refreshToken, user, p);
      queryClient.clear();
      resetStreakData();
      setProfile(p);
      setSuggestedNickname(null);
      setStatus("authenticated");
      void loadStreakData().catch(() => undefined);
    },
    [user],
  );

  const signOut = useCallback(async () => {
    await clearTokens().catch(() => undefined);
    setUser(null);
    setProfile(null);
    setSuggestedNickname(null);
    queryClient.clear();
    setStatus("unauthenticated");
  }, []);

  const updateUser = useCallback(async (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      (async () => {
        try {
          const [accessToken, refreshToken] = await Promise.all([
            getAccessToken(),
            getRefreshToken(),
          ]);
          if (accessToken && refreshToken) {
            await saveTokens(accessToken, refreshToken, next, profileRef.current);
          }
        } catch {
          // Persist best-effort only.
        }
      })();
      return next;
    });
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      (async () => {
        try {
          const [accessToken, refreshToken] = await Promise.all([
            getAccessToken(),
            getRefreshToken(),
          ]);
          if (accessToken && refreshToken && userRef.current) {
            await saveTokens(accessToken, refreshToken, userRef.current, next);
          }
        } catch {
          // Persist best-effort only.
        }
      })();
      return next;
    });
  }, []);

  const profileRef = useRef<Profile | null>(null);
  const userRef = useRef<AuthUser | null>(null);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "initializing" || !fontsLoaded) return;
    const currentPath = segments.join("/");
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = currentPath.includes("onboarding");
    if (status !== "authenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (status === "authenticated" && !profile && !inOnboarding) {
      router.replace("/(app)/onboarding");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [status, profile, fontsLoaded, segments, router]);

  if (!fontsLoaded || status === "initializing") return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            status,
            user,
            profile,
            isLoading: false,
            suggestedNickname,
            signIn,
            switchSession,
            signOut,
            updateUser,
            updateProfile,
            setSuggestedNickname,
          }}
        >
          <HapticsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="dark" />
            <WelcomeGiftModal />
          </HapticsProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
