import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
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

export type GoogleAuthResult =
  | { status: "success"; idToken: string }
  | { status: "cancel" }
  | { status: "error"; message: string };

let configured = false;

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function configureGoogleSignin() {
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

function missingIdToken(): GoogleAuthResult {
  return {
    status: "error",
    message: "Không lấy được id_token từ Google. Vui lòng kiểm tra Web Client ID và thử lại.",
  };
}

function developerError(): GoogleAuthResult {
  return {
    status: "error",
    message:
      "Google Login chưa khớp cấu hình Android OAuth. Kiểm tra package name com.vstep.mobile.v2 và SHA-1 debug trong Google Cloud, sau đó rebuild development build.",
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

function isCancelled(code?: string): boolean {
  return code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS;
}

function isPlayServicesError(code?: string): boolean {
  return code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE;
}

export function hasGoogleAuthConfig(): boolean {
  return hasText(WEB_CLIENT_ID);
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (!hasGoogleAuthConfig()) return missingConfig();

  try {
    configureGoogleSignin();
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") return { status: "cancel" };

    const idToken = response.data.idToken;
    if (!idToken) return missingIdToken();
    return { status: "success", idToken };
  } catch (error) {
    const normalized = normalizeError(error);

    if (isCancelled(normalized.code)) {
      return { status: "cancel" };
    }

    if (isPlayServicesError(normalized.code)) {
      return {
        status: "error",
        message: "Thiết bị này chưa có Google Play Services khả dụng để đăng nhập Google.",
      };
    }

    if (normalized.code === "DEVELOPER_ERROR" || normalized.message?.includes("DEVELOPER_ERROR")) {
      return developerError();
    }

    return {
      status: "error",
      message:
        normalized.message ??
        "Không thể mở đăng nhập Google. Hãy dùng development build và kiểm tra cấu hình Google Cloud.",
    };
  }
}
