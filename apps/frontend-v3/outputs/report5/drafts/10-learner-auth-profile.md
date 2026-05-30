# 10. Learner Auth & Profile Test Cases (24 cases — đã lọc)

**Module:** Authentication, Registration, Session, Profile  
**Source:** `apps/backend-v2/routes/api.php` L30–65, AuthController, ProfileController; `apps/frontend-v3` auth features, landing overlay, ho-so  
**Backend tests:** `Auth/LoginTest.php`, `Auth/RegisterTest.php`, `Auth/GoogleLoginTest.php`, `Auth/SwitchProfileTest.php`, `Profile/ProfileCrudTest.php`, `Middleware/RoleHierarchyTest.php`

## Guest: Register

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| AUTH-REG-001 | Register learner with valid email, password, onboarding data | Clean test email | POST `auth/register` with valid payload | 201, account + first profile created, tokens returned | Critical |
| AUTH-REG-002 | Register rejects existing email | Email already registered | POST `auth/register` with duplicate email | 422, error message returned | Critical |

## Guest: Login

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| AUTH-LOGIN-001 | Login learner with correct credentials | Learner account exists | POST `auth/login` with valid email/password | 200, access_token, refresh_token, user, profile returned | Critical |
| AUTH-LOGIN-002 | Login returns null profile for admin | Admin account exists | POST `auth/login` with admin credentials | 200, profile field is null | High |
| AUTH-LOGIN-003 | Login rejects wrong password | Learner account exists | POST `auth/login` with wrong password | 422, invalid credentials error | Critical |
| AUTH-LOGIN-005 | Login frontend overlay opens via search param | Frontend app running | Navigate to `/?auth=login` | Landing overlay shows login form | High |
| AUTH-LOGIN-006 | Login frontend redirects to dashboard after success | Valid learner in login form | Submit login | Redirect to `/dashboard` | Critical |
| AUTH-LOGIN-008 | Login frontend rejects non-learner role | Admin account | Submit admin login on learner frontend | Tokens cleared, `roleRejected` set, user stays unauthenticated | Critical |

## Guest: Google Auth

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| AUTH-GOOGLE-001 | Google login for existing learner with profile | Google ID token valid, learner exists with profile | POST `auth/google` with valid token | 200, tokens + user + profile returned | High |
| AUTH-GOOGLE-003 | Google login conflict account exists with different method | Email already registered via password | POST `auth/google` | 409, conflict error | High |

## Authenticated: Session and Refresh

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| AUTH-SESS-001 | Refresh token returns new access token | Valid refresh token | POST `auth/refresh` | 200, new access_token + refresh_token | Critical |
| AUTH-SESS-002 | Expired/invalid refresh token clears session | Invalid refresh token | POST `auth/refresh` | 422, frontend clears tokens and shows expiration toast | High |
| AUTH-SESS-003 | Logout invalidates tokens | Authenticated user | POST `auth/logout` | 204 or 200, tokens no longer accepted | High |
| AUTH-SESS-004 | Protected API rejects missing token | No token | GET `wallet/balance` | 401 | Critical |
| AUTH-SESS-007 | Frontend redirects unauthenticated user to login | No tokens | Navigate to `/dashboard` | Redirect to `/?auth=login&redirect=/dashboard` | Critical |

## Authenticated: Profile

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| PROF-001 | List profiles for authenticated account | Account with multiple profiles | GET `profiles` | 200, list of owned profiles | High |
| PROF-002 | Create new learning profile | Authenticated account | POST `profiles` with target/level/deadline | 201, new profile created | High |
| PROF-003 | Switch active profile | Multiple profiles exist | POST `auth/switch-profile` | 200, active profile changes, subsequent API calls use new profile context | Critical |
| PROF-004 | Update profile info via frontend | Profile exists | Open ho-so, edit profile, save | Profile updated, data persisted | High |
| PROF-006 | Cannot access another account's profile | Account A has profile | Account B tries to update account A's profile | 403 or 404 | Critical |
| PROF-008 | Complete onboarding via API | Authenticated without active profile | POST `profiles/{id}/onboarding` with nickname/level/deadline | 200, onboarding bonus granted if applicable (100 coins) | Critical |
| PROF-009 | Change password | Authenticated | POST `me/change-password` with old + new password | 200, password updated, re-login required | Medium |
| PROF-010 | Avatar upload | Authenticated with active profile | POST `me/avatar` with valid image | 200, avatar URL updated | Medium |
