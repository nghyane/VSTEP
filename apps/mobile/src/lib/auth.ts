import * as SecureStore from "expo-secure-store";
import type { AuthUser, Profile } from "@/types/api";

const TOKEN_KEY = "vstep_access_token";
const REFRESH_KEY = "vstep_refresh_token";
const USER_KEY = "vstep_user";
const PROFILE_KEY = "vstep_profile";

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
  profile: Profile | null = null,
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  if (profile) {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  } else {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getStoredProfile(): Promise<Profile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}
