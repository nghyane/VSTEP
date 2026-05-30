import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ??
  "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

type GoogleSigninError = {
  code?: string;
  message?: string;
};

type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");
type GoogleSigninApi = GoogleSigninModule["GoogleSignin"];
type GoogleSigninStatusCodes = GoogleSigninModule["statusCodes"];

export type GoogleAuthResult =
  | { status: "success"; idToken: string }
  | { status: "cancel" }
  | { status: "error"; message: string };

const FALLBACK_STATUS_CODES = {
  IN_PROGRESS: "IN_PROGRESS",
  PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
} as const;

let googleSigninModule: GoogleSigninModule | null = null;
let configured = false;

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function configureGoogleSignin(GoogleSignin: GoogleSigninApi) {
  if (configured) return;

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: hasText(IOS_CLIENT_ID) ? IOS_CLIENT_ID : undefined,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });

  configured = true;
}

function missingConfig(): GoogleAuthResult {
  return {
    status: "error",
    message:
      "Google OAuth chưa được cấu hình trên mobile. Thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (hoặc EXPO_PUBLIC_GOOGLE_CLIENT_ID).",
  };
}

function nativeModuleUnavailable(): GoogleAuthResult {
  if (isExpoGo()) {
    return {
      status: "error",
      message: "Google Sign-In không chạy trong Expo Go. Hãy mở development build/custom APK để dùng đăng nhập Google.",
    };
  }

  return {
    status: "error",
    message: "Bản app đang cài chưa có RNGoogleSignin. Hãy rebuild và cài lại app bằng `bun run android` hoặc build APK mới.",
  };
}

function missingIdToken(): GoogleAuthResult {
  return {
    status: "error",
    message: "Không lấy được id_token từ Google. Vui lòng kiểm tra Web Client ID và thử lại.",
  };
}

function developerError(): GoogleAuthResult {
  return {
    status: "error",
    message: "Google chưa khớp OAuth Android. Kiểm tra package/SHA-1 trong Google Cloud rồi cài lại APK.",
  };
}

function normalizeError(error: unknown): GoogleSigninError {
  if (error && typeof error === "object") {
    const entry = error as Record<string, unknown>;
    return {
      code: typeof entry.code === "string" ? entry.code : undefined,
      message: typeof entry.message === "string" ? entry.message : undefined,
    };
  }
  return {};
}

function isStatusCode(code: string | undefined, nativeCode: string | undefined, fallbackCode: string): boolean {
  return code === nativeCode || code === fallbackCode;
}

function isCancelled(code: string | undefined, statusCodes: GoogleSigninStatusCodes | undefined): boolean {
  return (
    isStatusCode(code, statusCodes?.SIGN_IN_CANCELLED, FALLBACK_STATUS_CODES.SIGN_IN_CANCELLED) ||
    isStatusCode(code, statusCodes?.IN_PROGRESS, FALLBACK_STATUS_CODES.IN_PROGRESS)
  );
}

function isPlayServicesError(code: string | undefined, statusCodes: GoogleSigninStatusCodes | undefined): boolean {
  return isStatusCode(
    code,
    statusCodes?.PLAY_SERVICES_NOT_AVAILABLE,
    FALLBACK_STATUS_CODES.PLAY_SERVICES_NOT_AVAILABLE,
  );
}

function isNativeModuleUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return message.includes("RNGoogleSignin") && (message.includes("could not be found") || message.includes("getEnforcing"));
}

async function loadGoogleSignin(): Promise<GoogleSigninModule | null> {
  if (googleSigninModule) return googleSigninModule;

  try {
    googleSigninModule = await import("@react-native-google-signin/google-signin");
    return googleSigninModule;
  } catch (error) {
    if (isNativeModuleUnavailableError(error)) return null;
    throw error;
  }
}

export function hasGoogleAuthConfig(): boolean {
  return hasText(WEB_CLIENT_ID);
}

export function getGoogleAuthUnavailableReason(): string | null {
  if (!hasGoogleAuthConfig()) return "Thiếu cấu hình Google OAuth cho mobile.";
  if (isExpoGo()) return "Google Sign-In không chạy trong Expo Go. Hãy mở development build/custom APK.";
  return null;
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (!hasGoogleAuthConfig()) return missingConfig();

  let statusCodes: GoogleSigninStatusCodes | undefined;

  try {
    const googleSignin = await loadGoogleSignin();
    if (!googleSignin) return nativeModuleUnavailable();

    statusCodes = googleSignin.statusCodes;
    configureGoogleSignin(googleSignin.GoogleSignin);

    if (Platform.OS === "android") {
      await googleSignin.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    await googleSignin.GoogleSignin.signOut().catch(() => undefined);
    const response = await googleSignin.GoogleSignin.signIn();
    if (response.type === "cancelled") return { status: "cancel" };

    const idToken = response.data.idToken;
    if (!idToken) return missingIdToken();
    return { status: "success", idToken };
  } catch (error) {
    if (isNativeModuleUnavailableError(error)) return nativeModuleUnavailable();

    const normalized = normalizeError(error);

    if (isCancelled(normalized.code, statusCodes)) {
      return { status: "cancel" };
    }

    if (isPlayServicesError(normalized.code, statusCodes)) {
      return {
        status: "error",
        message: "Thiết bị chưa có Google Play Services để đăng nhập Google.",
      };
    }

    if (normalized.code === "DEVELOPER_ERROR" || normalized.message?.includes("DEVELOPER_ERROR")) {
      return developerError();
    }

    return {
      status: "error",
      message:
        normalized.message ??
        "Không thể mở đăng nhập Google. Vui lòng kiểm tra cấu hình Google Cloud.",
    };
  }
}
