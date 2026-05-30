# 3. Test Plan

## Human Resources

| Worker/Doer | Role | Specific Responsibilities/Comments |
|---|---|---|
| Hoàng Văn Anh Nghĩa | Leader / Backend & API Support / QA Lead | Prepare test plan, verify API contracts, auth/session behavior, exam/session backend support, wallet and promo-code backend responses. |
| Nguyễn Nhật Phát | Frontend Tester | Test learner auth overlay, login/register UI, profile promo-code UI, writing/reading-related frontend flows. |
| Nguyễn Trần Tấn Phát | Frontend Tester | Test exam library, exam detail, exam room UI, result pages, dashboard/header wallet visibility. |
| Nguyễn Minh Khôi | Mobile/Speaking/Media Tester | Test speaking and microphone-related behavior, media permission scenarios, responsive/mobile viewport checks. |

## Test Environment

| Purpose | Tool | Provider | Version |
|---|---|---|---|
| Frontend application | `apps/frontend-v3` | VSTEP project | Current workspace |
| Frontend runtime | Bun | Vendor | Project configured |
| Development server | Vite | Vendor | 8.0.8 |
| Browser execution | Chrome / Chromium / Edge | Vendor | Test machine version |
| API server | Laravel backend `apps/backend-v2` | VSTEP project | Current backend implementation |
| API base URL | `VITE_API_URL` | Environment variable | Test environment value |
| Google OAuth client | `VITE_GOOGLE_CLIENT_ID` | Environment variable | Test environment value |
| Exam data | Published exam with Listening, Reading, Writing, Speaking content | VSTEP backend seed/test data | Test environment value |
| Wallet data | Learner wallet with enough and insufficient coin scenarios | VSTEP backend seed/test data | Test environment value |
| Top-up packages | Active top-up package fixtures | VSTEP backend seed/test data | Test environment value |
| Promo-code fixtures | Valid, invalid, expired, and already-used reward codes | VSTEP backend seed/test data | Test environment value |
| Payment sandbox | PayOS/test payment redirect URL returned by backend | Payment provider / VSTEP backend | Test environment value |
| Audio playback | Browser audio subsystem and valid `audio_url` assets | Browser / VSTEP content | Test environment value |
| Microphone recording | Browser `getUserMedia` and `MediaRecorder` APIs | Browser | Test machine version |
| Static analysis | Biome | Vendor | 2.4.12 |

## Test Milestones

| Milestone Task | Start Date | End Date |
|---|---|---|
| Analyze current login/register implementation and derive test scope | 2026-05-28 | 2026-05-28 |
| Analyze current exam library and exam room implementation | 2026-05-28 | 2026-05-28 |
| Analyze wallet, top-up, coin charging, and profile promo-code implementation | 2026-05-29 | 2026-05-29 |
| Prepare feature-level test cases and acceptance criteria | 2026-05-29 | 2026-05-29 |
| Execute unit/component tests for auth UI and auth store | TBD | TBD |
| Execute unit/component tests for exam room state, panels, and result views | TBD | TBD |
| Execute unit/component tests for wallet top-up and promo-code UI | TBD | TBD |
| Execute integration tests against backend auth/exam/wallet APIs | TBD | TBD |
| Execute system and acceptance tests on desktop/mobile browser viewports | TBD | TBD |
| Consolidate test report, defects, and evidence | TBD | TBD |

## Assumptions and Constraints

| Type | Description |
|---|---|
| Assumption | Backend API follows frontend contract where responses are wrapped as `{ data: T }`. |
| Assumption | `VITE_GOOGLE_CLIENT_ID` is configured only where Google authentication is expected. |
| Assumption | Test accounts and test promo codes can be created in a non-production environment. |
| Constraint | Google OAuth cannot be fully validated without a valid Google ID token. |
| Constraint | Full pass/fail result requires execution against running backend and configured test database. |
| Constraint | Listening audio playback tests require valid `audio_url` assets and user interaction. |
| Constraint | Microphone recording tests require HTTPS or localhost browser context and microphone permission. |
| Constraint | Full top-up completion requires configured PayOS/test payment environment. |
| Constraint | Promo-code execution requires valid backend fixtures for active learner profile. |
