export const AUTH_MESSAGES = {
  invalidCredentials: "Invalid email or password",
  emailAlreadyRegistered: "Email already registered",
  tokenInvalid: "Invalid refresh token",
  tokenExpired: "Refresh token expired",
  tokenReuseDetected: "Refresh token reuse detected, all sessions revoked",
  userNotFound: "User not found",
} as const;
