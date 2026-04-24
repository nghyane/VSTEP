# Google Sign-In (auth)

## Flow

Google login có thể **chưa** authenticated ngay — user mới chưa có Profile.

```
Click Google button
  → GSI renderButton callback → id_token (JWT RS256)
  → POST /auth/google { id_token }
  → BE verify JWKS → find/create User → resolve initial profile
  → Response:
      { user, profile, access_token, refresh_token, needs_onboarding, suggested_nickname }

needs_onboarding = true  → FE lưu tokens, KHÔNG set authenticated,
                            hiển thị Step2 (nickname + level + deadline)
                          → POST /auth/complete-onboarding (Bearer access_token)
                          → BE tạo initial Profile, reissue access_token với active_profile_id
                          → FE set authenticated

needs_onboarding = false → FE set authenticated ngay
```

## Backend

- **Verify**: `app/Services/GoogleTokenVerifier.php` — fetch `https://www.googleapis.com/oauth2/v3/certs` (cache 1h), match kid, JWK → PEM bằng ASN.1 DER, `openssl_verify` SHA256. Không dùng lib ngoài.
- **Claims bắt buộc**: `iss ∈ [accounts.google.com, https://accounts.google.com]`, `aud == GOOGLE_CLIENT_ID`, `exp > now`, `iat <= now + 60s`.
- **Email verified**: reject nếu `email_verified != true`.
- **User merge**: lookup by `google_id` → fallback lookup by `email` (link tài khoản cũ). Nếu lookup bằng email và chưa có `google_id`, set luôn.
- **Password column**: nullable (user Google không có password). Migration `2026_04_24_000001_add_google_auth_to_users`.
- **Endpoints**: `POST /auth/google` (public, throttle 10/min), `POST /auth/complete-onboarding` (auth:api).

## Frontend

- **Script**: load `https://accounts.google.com/gsi/client` một lần (preload trong `index.html` + fallback loader trong `lib/google-identity.ts`).
- **Button**: `google.accounts.id.renderButton` — không tự vẽ button, để Google render đúng brand guideline.
- **Env**: `VITE_GOOGLE_CLIENT_ID` — cùng giá trị với BE `GOOGLE_CLIENT_ID`.
- **Form logic**: `RegisterForm` có `flow: "password" | "google"`. `googleMode=true` skip Step1, Step2 hiển thị title "Chào mừng!" (không có back button — user đã authenticated một phần ở BE).
- **Login vs Register**: Google button xuất hiện cả 2 form. Trong `LoginForm`, nếu Google trả `needs_onboarding` → navigate sang `?auth=register` để user hoàn tất Step2.

## Anti-patterns

- **KHÔNG** dùng `ux_mode: "redirect"` — vỡ SPA state.
- **KHÔNG** auto-tạo Profile với defaults khi Google signup. Vi phạm data rule: *user tự chọn target*.
- **KHÔNG** tin `email_verified` ở FE — verify ở BE sau khi decode JWT.
- **KHÔNG** lưu `id_token` dài hạn ở FE — dùng xong gửi BE là bỏ.

## Gotchas

- **Authorized JavaScript origins** trong Google Cloud Console phải khớp chính xác protocol+host+port (kể cả `http://localhost:5175`). Sai 1 port là button load nhưng callback fail silently.
- **3rd-party cookies**: `renderButton` hoạt động ngay cả khi cookies bị block — tốt hơn `prompt()` (One Tap).
- **JWKS rotation**: Google rotate key ~mỗi vài ngày. Verifier có logic retry 1 lần khi `kid` không match (force cache bust).
- **Client ID không bí mật**: nhúng FE thoải mái. Chỉ Client Secret mới là bí mật (và ở flow này KHÔNG dùng Client Secret).
