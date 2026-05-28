# Capstone Project Report

# Report 5 - Software Test Documentation

Feature under test: `apps/frontend-v3` learner authentication and exam room

Hanoi, May 2026

## I. Record of Changes

*A - Added M - Modified D - Deleted*

| Date | A* M, D | In charge | Change Description |
|---|---|---|---|
| 2026-05-28 | A | QA / Frontend Team | Created test documentation for learner login and registration in `apps/frontend-v3`. |
| 2026-05-28 | M | QA / Frontend Team | Added exam library and exam room test scope, test cases, risks, and report statistics. |

## II. Testing Documentation

## 1. Scope of Testing

This document defines the test scope for the learner authentication entry points and exam room workflow in the VSTEP frontend application located at `apps/frontend-v3`. The tested authentication feature set includes the landing authentication overlay, email/password login, email/password registration, onboarding profile setup during registration, Google Sign-In integration behavior, authenticated redirection, learner-only role enforcement, and session initialization through stored refresh tokens. The tested exam room feature set includes exam library filtering, exam detail and skill selection, session start and coin charging, device check, timed exam execution, Listening/Reading/Writing/Speaking panels, autosave draft, section transition locking, manual and automatic submission, result summary, and detailed answer/feedback review.

The main source files used to derive the authentication test scope are `src/routes/index.tsx`, `src/features/landing/components/LandingAuthOverlay.tsx`, `src/features/auth/AuthShell.tsx`, `src/features/auth/LoginForm.tsx`, `src/features/auth/RegisterForm.tsx`, `src/features/auth/GoogleButton.tsx`, `src/features/auth/PasswordInput.tsx`, `src/features/auth/DatePicker.tsx`, `src/lib/auth.ts`, and `src/lib/vstep.ts`. The main source files used to derive the exam room test scope are `src/routes/_app/thi-thu/index.tsx`, `src/routes/_app/thi-thu/$examId.tsx`, `src/routes/_focused/phong-thi/$sessionId.tsx`, `src/routes/_focused/phong-thi/$sessionId_.chi-tiet.tsx`, `src/features/exam/actions.ts`, `src/features/exam/queries.ts`, `src/features/exam/use-exam-session.ts`, `src/features/exam/components/ExamCard.tsx`, `src/features/exam/components/SectionSelector.tsx`, `src/features/exam/components/BottomActionBar.tsx`, `src/features/exam/components/DeviceCheckScreen.tsx`, `src/features/exam/components/ListeningPanel.tsx`, `src/features/exam/components/ReadingPanel.tsx`, `src/features/exam/components/WritingPanel.tsx`, `src/features/exam/components/SpeakingPanel.tsx`, and `src/features/practice/use-voice-recorder.ts`.

The following functions and behaviors are in scope:

| Scope Item | Description | Evidence |
|---|---|---|
| Login overlay routing | Open login form from `/?auth=login`; close overlay by clearing search params. | `src/routes/index.tsx`, `LandingAuthOverlay.tsx`, `AuthShell.tsx` |
| Registration overlay routing | Open registration form from `/?auth=register`; support `onboarding=1` to skip credential step. | `src/routes/index.tsx`, `RegisterForm.tsx` |
| Email/password login | Submit email and password to `auth/login`; store tokens and user data on successful learner login. | `LoginForm.tsx`, `src/lib/auth.ts` |
| Registration step 1 | Validate password rules, confirm password, and email availability through `auth/email/check`. | `RegisterForm.tsx`, `src/lib/auth.ts` |
| Registration onboarding step | Capture nickname, current level, target level, and target deadline before calling `auth/register` or `auth/complete-onboarding`. | `RegisterForm.tsx`, `src/lib/vstep.ts` |
| Google authentication | Render Google Identity button when `VITE_GOOGLE_CLIENT_ID` exists; call `auth/google`; route users needing onboarding to registration onboarding step. | `GoogleButton.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `src/lib/auth.ts` |
| Learner-only access | Reject non-learner accounts, clear tokens and query cache, and set `roleRejected` state. | `src/lib/auth.ts` |
| Authenticated redirect | Redirect authenticated users from landing page to `/dashboard` or the requested redirect target. | `src/routes/index.tsx` |
| Session refresh | Initialize existing session through `auth/refresh`; clear invalid or expired sessions. | `src/lib/auth.ts` |

The following exam room functions and behaviors are in scope:

| Scope Item | Description | Evidence |
|---|---|---|
| Exam library | Load exam list, application config, user sessions, search by keyword, and filter by status `all`, `not-started`, `in-progress`, `submitted`. | `src/routes/_app/thi-thu/index.tsx`, `src/features/exam/queries.ts` |
| Exam card state | Display not-started, in-progress, and submitted states; continue active sessions; show latest score and session count where available. | `src/features/exam/components/ExamCard.tsx` |
| Exam detail | Load exam detail and session history; show section selector, duration panel, and result history. | `src/routes/_app/thi-thu/$examId.tsx` |
| Skill selection | Select no skill for full test, or custom Listening/Reading/Writing/Speaking combinations; expand skill rows to show parts, counts, and minutes. | `src/features/exam/components/SectionSelector.tsx` |
| Start exam session | Compute cost from full-test and per-skill pricing; check wallet balance; start session; abandon active same-exam session when user confirms reset. | `src/features/exam/components/BottomActionBar.tsx`, `src/features/exam/actions.ts` |
| Device check | Show exam structure, total duration, audio check for Listening, microphone check for Speaking, and start button before entering active phase. | `src/features/exam/components/DeviceCheckScreen.tsx` |
| Timer and phase control | Compute remaining seconds from `server_deadline_at`; move from device-check to active; trigger expired/submitting/submitted phases. | `src/features/exam/use-exam-session.ts` |
| Autosave and resume | Debounce draft save to `PUT exam-sessions/{id}/draft`; restore MCQ, writing, speaking marks, and skill index from draft. | `src/features/exam/use-exam-session.ts`, `src/features/exam/queries.ts` |
| Listening panel | Show readiness modal, play audio sequentially, log played sections, group questions by part, and track answered counts. | `src/features/exam/components/ListeningPanel.tsx` |
| Reading panel | Show passage/question split layout, passage navigation, highlightable passage, answer selection, and progress per passage. | `src/features/exam/components/ReadingPanel.tsx`, `HighlightablePassage.tsx` |
| Writing panel | Show prompt, editor, word count, minimum word progress, task tabs, and writing answer persistence in local exam state. | `src/features/exam/components/WritingPanel.tsx` |
| Speaking panel | Request microphone permission, record per part, show waveform/timer/audio playback, mark/unmark completed parts, and handle denied permission. | `src/features/exam/components/SpeakingPanel.tsx`, `src/features/practice/use-voice-recorder.ts` |
| Section transition locking | Confirm before moving to next skill; warn about unanswered/current incomplete items; prevent returning to previous skill after transition. | `src/routes/_focused/phong-thi/$sessionId.tsx`, `src/features/exam/use-exam-session.ts` |
| Submission | Submit MCQ and writing answers to `POST exam-sessions/{id}/submit`; auto-submit after timer expires; invalidate related caches after success. | `src/features/exam/use-exam-session.ts`, `src/features/exam/actions.ts` |
| Result summary | Display MCQ score, per-skill performance, pending AI grading badges for Writing/Speaking, and link to detailed result. | `src/routes/_focused/phong-thi/$sessionId.tsx` |
| Result detail | Show MCQ selected/correct answers, writing rubric/feedback/rewrites, speaking transcript/audio/rubric/pronunciation, and pending feedback state. | `src/routes/_focused/phong-thi/$sessionId_.chi-tiet.tsx` |

The following items are out of scope for this feature-level document:

| Out-of-scope Item | Reason |
|---|---|
| Backend authentication implementation internals | This document targets `frontend-v3` behavior and API consumption only. |
| Admin authentication UI | The learner frontend explicitly rejects non-learner accounts; admin/staff login belongs to the admin app. |
| Password reset implementation | The login form contains a `Quên mật khẩu?` button, but no completed reset flow is present in the inspected frontend code. |
| Course enrollment registration | Course registration is a separate domain flow from account registration. |
| Backend scoring and grading internals | This document validates frontend calls, result rendering, and pending/graded states; the grading algorithm itself belongs to backend/AI tests. |
| Uploading speaking audio to backend | The inspected frontend speaking flow records and marks parts as done, but the current submit payload builder sends MCQ and writing answers only. This is tracked as a risk for exam-room testing. |

Testing levels applied to this feature include unit, integration, system, and acceptance testing. Unit testing focuses on field-level and state-level behavior such as password visibility, password rules, target-level filtering, minimum target-date calculation, auth store state transitions, exam reducer transitions, timer calculation, draft payload construction, cost calculation, and answer-progress derivation. Integration testing focuses on API calls, token persistence, query cache clearing, Google Identity handoff, routing between login/registration/onboarding/dashboard, exam session creation, draft save/restore, listening-play logging, submit payloads, result polling, and wallet/session cache invalidation. System testing validates complete browser flows from landing page to authenticated dashboard and from exam library to exam room, device check, answering, submission, result summary, and detail review. Acceptance testing confirms that the learner can register, log in, start a test, complete selected skills, submit, and review results according to the project requirement.

Assumptions and constraints:

| Type | Description |
|---|---|
| Assumption | Backend API follows the frontend contract where responses are wrapped as `{ data: T }`. |
| Assumption | `VITE_GOOGLE_CLIENT_ID` is configured only in environments where Google authentication is expected to be available. |
| Assumption | Test accounts can be created and removed in a non-production environment. |
| Constraint | Google OAuth cannot be fully validated in an offline or mock-only environment without a valid Google ID token. |
| Constraint | The frontend currently relies on browser-native `required` and `type="email"` validation for login and email fields. |
| Constraint | Final pass/fail result requires execution against a running backend and configured test database. |
| Constraint | Full Speaking submission verification requires backend support for receiving/storing speaking audio answers; the inspected frontend currently marks speaking completion locally but does not include recorded audio in the submit payload builder. |
| Constraint | Listening audio playback tests require valid `audio_url` assets and browser audio autoplay behavior must be handled through user interaction. |
| Constraint | Microphone recording tests require HTTPS or localhost browser context and microphone permission. |

## 2. Test Strategy

The test strategy combines source-based test design, component behavior validation, API integration checks, browser-based end-to-end execution, and acceptance verification. The feature has security-sensitive behavior because it stores access and refresh tokens, initializes sessions, rejects non-learner roles, and redirects users into protected routes. Therefore, negative tests and session-state tests are required in addition to happy-path login and registration tests.

## 2.1 Testing Types

| Testing Type | Objective | Technique | Completion Criteria |
|---|---|---|---|
| Unit Testing | Verify isolated frontend logic used by authentication forms, auth store, exam state, timer, cost, progress, and draft payload behavior. | Test password rules, target-level filtering, date constraints, token handling branches, visible/hidden password input states, exam reducer transitions, timer expiration, draft payload construction, word count, and score/result helpers with mocked dependencies. | All planned unit cases pass; no unhandled state branch remains for learner, non-learner, onboarding, active exam, expired exam, submitted exam, and error cases. |
| Component/UI Testing | Verify the login, registration, exam library, exam detail, device check, exam panels, dialogs, result summary, and detail pages render correct controls, labels, disabled/loading states, validation messages, and navigation links. | Render components with mocked auth/exam stores, router, media APIs, and query responses; simulate user input, clicks, audio play events, and microphone states. | UI reacts correctly for required fields, invalid passwords, confirmation mismatch, loading states, exam status filters, skill selection, unanswered warnings, recording states, and result pending states. |
| API Integration Testing | Verify frontend calls the correct authentication and exam endpoints and processes API responses correctly. | Use controlled API responses for `auth/*`, `exams`, `exam-sessions`, `exam-sessions/{id}/draft`, `exam-sessions/{id}/submit`, `exam-sessions/{id}/results`, `exam-sessions/{id}/listening-played`, wallet balance, and app config. | Correct request payloads are sent; success stores session data; errors show expected messages or safe fallback states; related query caches are invalidated. |
| System Testing | Validate full browser workflows from landing page to dashboard, exam library, exam detail, exam room, submission, and result review. | Run the app against a test backend and execute user journeys in a browser on desktop and mobile viewport sizes with real audio/microphone where possible. | A learner can register, log in, start an exam, complete selected skills, submit, and review results; invalid users cannot enter protected learner routes. |
| Acceptance Testing | Confirm the delivered behavior satisfies learner authentication and exam-room requirements. | Execute scenario-based checks with product acceptance criteria, test accounts, test wallet balance, and representative exams. | Stakeholder accepts the tested flows and no critical or high authentication/exam-room defect remains open. |
| Security Testing | Verify authentication does not keep invalid, expired, or unauthorized role sessions. | Test failed login, non-learner login, expired refresh token, and Google conflict cases. | Tokens and query cache are cleared for rejected roles and invalid sessions; protected routes redirect unauthenticated users to login. |
| Compatibility Testing | Confirm the overlay and form steps work across common browser and viewport combinations. | Execute smoke flows in Chromium-based browser and responsive desktop/mobile sizes. | Login and registration remain usable on desktop and mobile layouts. |
| Regression Testing | Ensure future changes do not break existing learner authentication behavior. | Re-run the auth test suite after changes to routes, auth store, API client, or onboarding forms. | No previously passed critical auth scenario regresses. |

## 2.2 Test Levels

| Type of Tests | Unit | Integration | System | Acceptance |
|---|---|---|---|---|
| Unit Testing | X |  |  |  |
| Component/UI Testing | X | X |  |  |
| API Integration Testing |  | X | X |  |
| System Testing |  |  | X | X |
| Acceptance Testing |  |  | X | X |
| Security Testing | X | X | X | X |
| Compatibility Testing |  |  | X | X |
| Regression Testing | X | X | X |  |

## 2.3 Supporting Tools

| Purpose | Tool | Vendor/In-house | Version |
|---|---|---|---|
| Frontend runtime and package execution | Bun | Vendor | Project configured |
| Frontend build server | Vite | Vendor | 8.0.8 |
| UI framework | React | Vendor | 19.2.5 |
| Routing and auth search params | TanStack Router | Vendor | 1.168.23 |
| Form state for login | TanStack React Form | Vendor | 1.29.0 |
| Server state and cache | TanStack Query | Vendor | 5.99.2 |
| HTTP client | ky | Vendor | 2.0.1 |
| Client auth state | Zustand | Vendor | 5.0.12 |
| Static checks | Biome | Vendor | 2.4.12 |
| Browser manual/system testing | Chrome / Chromium browser | Vendor | Test environment version |
| Backend API dependency | `apps/backend-v2` authentication API | In-house | Current VSTEP backend |
| Exam session API dependency | `apps/backend-v2` exam/session API | In-house | Current VSTEP backend |
| Wallet API dependency | `apps/backend-v2` wallet API | In-house | Current VSTEP backend |
| Google Sign-In dependency | Google Identity Services | Vendor | Loaded from Google script at runtime |
| Browser media APIs | HTMLAudioElement, MediaRecorder, getUserMedia, AudioContext | Vendor | Browser implementation |

## 3. Test Plan

## 3.1 Human Resources

| Worker/Doer | Role | Specific Responsibilities/Comments |
|---|---|---|
| QA Engineer | Test designer and executor | Prepare auth test scenarios, execute manual/system tests, record defects and evidence. |
| Frontend Developer | Defect owner | Fix defects in `apps/frontend-v3` login, registration, routing, and auth state handling. |
| Backend Developer | API support | Provide stable auth API, test users, role data, and error responses for integration testing. |
| Exam Feature Developer | Defect owner | Fix defects in exam list/detail, session start, exam room panels, autosave, timer, submit, and result pages. |
| AI/Grading Developer | Grading support | Provide predictable Writing/Speaking grading states and feedback samples for result testing. |
| Product Owner / Mentor | Acceptance reviewer | Confirm that login and registration behavior matches capstone requirements and user expectations. |

## 3.2 Test Environment

| Purpose | Tool | Provider | Version |
|---|---|---|---|
| Frontend application | `apps/frontend-v3` | VSTEP project | Current workspace |
| Frontend runtime | Bun | Vendor | Project configured |
| Development server | Vite | Vendor | 8.0.8 |
| Browser execution | Chrome / Chromium | Vendor | Test machine version |
| API server | Laravel backend `apps/backend-v2` | VSTEP project | Current backend implementation |
| Authentication API base URL | `VITE_API_URL` | Environment variable | Test environment value |
| Exam data | Published exam with Listening, Reading, Writing, and Speaking content | VSTEP backend seed/test data | Test environment value |
| Test wallet balance | Learner wallet with enough and insufficient coin scenarios | VSTEP backend seed/test data | Test environment value |
| Google OAuth client | `VITE_GOOGLE_CLIENT_ID` | Environment variable | Test environment value |
| Audio playback | Browser audio subsystem and valid Listening `audio_url` assets | Browser / VSTEP content | Test environment value |
| Microphone recording | Browser `getUserMedia` and `MediaRecorder` APIs | Browser | Test machine version |
| Local session storage | Browser local storage / token storage wrapper | Browser / VSTEP frontend | Current implementation |
| Static analysis | Biome | Vendor | 2.4.12 |

## 3.3 Test Milestones

| Milestone Task | Start Date | End Date |
|---|---|---|
| Analyze current login/register implementation and derive test scope | 2026-05-28 | 2026-05-28 |
| Prepare feature-level test cases and acceptance criteria | 2026-05-28 | 2026-05-28 |
| Analyze current exam library and exam room implementation and derive test scope | 2026-05-28 | 2026-05-28 |
| Prepare exam-room test cases and acceptance criteria | 2026-05-28 | 2026-05-28 |
| Execute unit/component tests for auth UI and auth store | TBD | TBD |
| Execute unit/component tests for exam room state, panels, and result views | TBD | TBD |
| Execute integration tests against backend authentication API | TBD | TBD |
| Execute integration tests against backend exam/session/wallet APIs | TBD | TBD |
| Execute system and acceptance tests on desktop/mobile browser viewports | TBD | TBD |
| Consolidate test report, defects, and evidence | TBD | TBD |

## 4. Test Cases

Unit Test Cases: `Report5_FrontendV3_Auth_Unit_Test.xlsx` or equivalent test-case appendix.

Other Test Cases (IT, ST, AT): `Report5_FrontendV3_Auth_Test_Report.xlsx` or equivalent test-case appendix.

### 4.1 Unit Test Cases

| Test Case ID | Test Case Name | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| UT-AUTH-001 | Password visibility toggle | `PasswordInput` is rendered with a password value. | Click the visibility button once, then click it again. | Input type changes from `password` to `text`, then back to `password`; accessible label changes between `Hiện mật khẩu` and `Ẩn mật khẩu`. | High |
| UT-AUTH-002 | Registration rejects short password | Registration step 1 is open. | Enter valid email, enter password shorter than 8 characters, confirm it, submit. | Error message `Mật khẩu tối thiểu 8 ký tự.` is displayed and email availability API is not called. | High |
| UT-AUTH-003 | Registration rejects password without uppercase/lowercase mix | Registration step 1 is open. | Enter valid email, enter password without both uppercase and lowercase characters, submit. | Error message `Mật khẩu phải có cả chữ hoa và chữ thường.` is displayed. | High |
| UT-AUTH-004 | Registration rejects password without number | Registration step 1 is open. | Enter valid email, enter password with uppercase and lowercase characters but no digit, submit. | Error message `Mật khẩu phải có ít nhất một chữ số.` is displayed. | High |
| UT-AUTH-005 | Registration rejects mismatched confirmation | Registration step 1 is open. | Enter valid email, enter a valid password, enter a different confirmation password, submit. | Error message `Mật khẩu nhập lại không khớp.` is displayed. | High |
| UT-AUTH-006 | Registration step 2 rejects empty nickname | User is on onboarding step. | Leave nickname blank, choose or keep valid level fields, choose date if needed, submit. | Error message `Nickname không được để trống.` is displayed and registration API is not called. | High |
| UT-AUTH-007 | Registration step 2 rejects missing deadline | User is on onboarding step. | Enter nickname and keep level selections, do not select target deadline, submit. | Error message `Vui lòng chọn ngày thi dự kiến.` is displayed. | High |
| UT-AUTH-008 | Target levels are filtered by entry level | `availableTargets` is called with each entry level. | Evaluate returned target options for A1, A2, B1, B2, and C1. | Returned targets include only B1, B2, C1 values whose rank is greater than or equal to entry rank. | Medium |
| UT-AUTH-009 | Minimum target date is calculated from entry-target gap | `computeMinDate` and `minPrepMonths` are called with entry and target combinations. | Validate A1 to C1, A2 to B2, B2 to B2, and C1 to C1. | Minimum preparation months follow `MIN_PREP_MONTHS` and date output is ISO `YYYY-MM-DD`. | Medium |
| UT-AUTH-010 | Google button shows configuration fallback | `VITE_GOOGLE_CLIENT_ID` is missing. | Render `GoogleButton`. | Fallback message `Google OAuth chưa được cấu hình` is displayed. | Medium |
| UT-AUTH-011 | Google button shows script-load fallback | Google Identity script fails to load. | Render `GoogleButton` with client id configured and simulate load failure. | Fallback message `Không tải được Google Sign-In` is displayed. | Medium |
| UT-AUTH-012 | Non-learner login is rejected in auth store | Mock `auth/login` response with user role other than `learner`. | Call `login(email, password)`. | Tokens are cleared, query cache is cleared, auth state is unauthenticated, and `roleRejected` contains role and email. | Critical |
| UT-AUTH-013 | Login requiring onboarding does not authenticate immediately | Mock `auth/login` response with learner role and `profile: null`. | Call `login(email, password)`. | Function returns `needsOnboarding: true`; auth state is not set to authenticated. | High |
| UT-AUTH-014 | Expired refresh token clears session | Mock `auth/refresh` failure with status 422. | Call `initAuth()` with a stored refresh token. | Tokens are cleared, state becomes unauthenticated, and an expiration toast is shown. | High |

### 4.2 Integration Test Cases

| Test Case ID | Test Case Name | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| IT-AUTH-001 | Open login overlay using search param | Frontend app is running. | Navigate to `/?auth=login`. | Landing page remains visible behind the full-screen overlay; login form title `Đăng nhập` is displayed. | High |
| IT-AUTH-002 | Close auth overlay | Login or registration overlay is open. | Click the close button with aria-label `Đóng`. | URL search params are cleared and overlay disappears. | Medium |
| IT-AUTH-003 | Switch from login to registration | Login overlay is open. | Click `Đăng ký`. | URL changes to registration mode and `Tạo tài khoản` form is displayed. | High |
| IT-AUTH-004 | Switch from registration to login | Registration step 1 is open. | Click `Đăng nhập`. | URL changes to login mode and `Đăng nhập` form is displayed. | High |
| IT-AUTH-005 | Successful password login stores session and redirects | Learner account with profile exists. | Navigate to `/?auth=login`, submit valid email and password. | Frontend calls `POST auth/login`, stores access and refresh tokens, clears query cache, shows success toast, and redirects to `/dashboard`. | Critical |
| IT-AUTH-006 | Password login with invalid credentials displays backend error | Backend returns authentication error for submitted credentials. | Submit invalid email or password on login form. | User remains unauthenticated and sees backend error message or default error toast. | Critical |
| IT-AUTH-007 | Login redirect parameter is preserved | Protected route redirects unauthenticated user to `/?auth=login&redirect=<path>`. | Submit valid learner login. | User is redirected to the requested path instead of the default dashboard. | High |
| IT-AUTH-008 | Registration step 1 checks email availability | Registration step 1 is open. | Enter valid password and confirmation, submit with available email. | Frontend calls `POST auth/email/check`; on success, onboarding step is displayed. | High |
| IT-AUTH-009 | Registration step 1 displays email validation error | Backend rejects email in `auth/email/check`. | Submit registration step 1 with unavailable or invalid email. | Error from `errors.email[0]` or backend message is displayed in the form. | High |
| IT-AUTH-010 | Registration creates account with onboarding data | Email has passed availability check and onboarding step is open. | Enter nickname, select entry level, target level, valid deadline, submit. | Frontend calls `POST auth/register` with email, password, nickname, entry level, target level, and target deadline. User becomes authenticated. | Critical |
| IT-AUTH-011 | Google login for existing learner succeeds | Google Identity returns a valid ID token for existing learner with profile. | Click Google sign-in and complete Google flow. | Frontend calls `POST auth/google`, stores tokens, sets authenticated state, and redirects to dashboard. | High |
| IT-AUTH-012 | Google registration requiring onboarding proceeds to step 2 | Google Identity returns a valid ID token for learner without profile. | Click Google sign-up and complete Google flow. | Registration form switches to onboarding step with suggested nickname if provided. | High |
| IT-AUTH-013 | Google conflict is handled safely | Backend returns HTTP 409 from `auth/google`. | Attempt Google sign-in with a conflicting email. | User remains unauthenticated and sees message `Email này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu.` or backend-provided equivalent. | High |
| IT-AUTH-014 | Complete onboarding for existing token | URL is `/?auth=register&onboarding=1` and a valid token exists. | Fill onboarding step and submit. | Frontend calls `POST auth/complete-onboarding`, stores new access token, sets authenticated state with profile, and shows success or welcome gift. | High |
| IT-AUTH-015 | Non-learner Google login is rejected | Google auth response contains user role other than `learner`. | Complete Google sign-in with non-learner account. | Tokens and cache are cleared; user remains unauthenticated; role rejection state is set. | Critical |

### 4.3 System Test Cases

| Test Case ID | Test Case Name | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| ST-AUTH-001 | New learner registration happy path | Frontend and backend are running with a clean test email. | Open landing page, click register CTA, complete credential step, complete onboarding step. | User account and first profile are created; user lands on authenticated learner area. | Critical |
| ST-AUTH-002 | Existing learner login happy path | Existing learner has valid email, password, and profile. | Open login overlay and submit credentials. | User is authenticated and redirected to `/dashboard`. | Critical |
| ST-AUTH-003 | Protected route redirects unauthenticated user to login | No session tokens are present. | Navigate directly to a protected learner route such as `/dashboard`. | User is redirected to landing login overlay with redirect search param. | Critical |
| ST-AUTH-004 | Session refresh restores valid session | Browser has valid refresh token from a previous login. | Reload the application. | `auth/refresh` succeeds and the user remains authenticated. | High |
| ST-AUTH-005 | Expired session requires login again | Browser has expired or invalid refresh token. | Reload the application. | Tokens are cleared and user is unauthenticated; expired-session message is displayed for 422 refresh failure. | High |
| ST-AUTH-006 | Desktop registration layout remains usable | Desktop viewport is active. | Complete registration and onboarding flow. | Brand panel, mascot, form controls, scroll area, and submit button are usable without clipped required content. | Medium |
| ST-AUTH-007 | Mobile registration layout remains usable | Mobile viewport is active. | Complete registration and onboarding flow. | Mobile logo, close button, scroll area, date picker, and submit button remain visible and usable. | Medium |
| ST-AUTH-008 | Non-learner account cannot enter learner frontend | Non-learner account exists. | Attempt login using non-learner credentials. | Learner frontend rejects the account and does not navigate to `/dashboard`. | Critical |

### 4.4 Acceptance Test Cases

| Test Case ID | Scenario | Acceptance Criteria | Expected Result | Priority |
|---|---|---|---|---|
| AT-AUTH-001 | Learner can create a new account | Given a new learner email, when the learner completes credential and onboarding steps, then the system creates an account and profile. | Learner reaches authenticated dashboard and receives success/welcome feedback. | Critical |
| AT-AUTH-002 | Learner can log in with password | Given an existing learner account, when correct credentials are submitted, then the learner enters the app. | Learner is redirected to dashboard or requested redirect path. | Critical |
| AT-AUTH-003 | Invalid login does not authenticate | Given wrong credentials, when login is submitted, then the system rejects access. | User stays on login form and receives an error. | Critical |
| AT-AUTH-004 | Registration enforces password quality | Given an invalid password, when registration step 1 is submitted, then the system explains why it is invalid. | User cannot proceed until password has at least 8 characters, uppercase, lowercase, and number. | High |
| AT-AUTH-005 | Registration requires goal setup | Given a learner creating an account, when onboarding fields are missing, then the system blocks completion. | Nickname and target deadline must be provided before account/profile completion. | High |
| AT-AUTH-006 | Google learner can sign in or continue onboarding | Given Google OAuth is configured, when a learner signs in with Google, then existing learners enter the app and new/incomplete learners complete onboarding. | Existing learner reaches dashboard; incomplete learner sees onboarding step. | High |
| AT-AUTH-007 | Non-learner roles are blocked from learner app | Given an admin, teacher, or staff account, when the user attempts to log in to learner frontend, then access is rejected. | No learner session is established and tokens/cache are cleared. | Critical |

### 4.5 Exam Room Unit Test Cases

| Test Case ID | Test Case Name | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| UT-EXAM-001 | Exam timer calculates remaining time | `server_deadline_at` is in the future. | Initialize timer and advance time by one second. | Remaining seconds decrease and never become negative. | High |
| UT-EXAM-002 | Expired deadline starts without draft restore | `server_deadline_at` is in the past and an old draft exists. | Initialize exam session state. | Draft is ignored and session enters expired/submitting behavior instead of active resume. | High |
| UT-EXAM-003 | Existing draft resumes active exam | Valid draft contains `skill_idx`, MCQ answers, writing answers, and speaking marks. | Initialize exam session state. | Phase is `active`; skill index and saved answers are restored. | Critical |
| UT-EXAM-004 | MCQ answer updates state | Active exam state exists. | Dispatch answer action for an item. | `mcqAnswers` contains the selected item and selected index. | High |
| UT-EXAM-005 | Writing answer updates state and word count source | Active exam state exists. | Dispatch writing answer action with text. | `writingAnswers` stores text for the task; writing panel can derive correct word count. | High |
| UT-EXAM-006 | Speaking done mark can be toggled | Active speaking part exists. | Mark a speaking part done, then unmark it. | `speakingDone` adds then removes the part id. | High |
| UT-EXAM-007 | Draft payload is built from current exam state | Active state has MCQ, writing, and speaking marks. | Trigger debounced autosave payload build. | Payload contains `skill_idx`, `mcq_answers`, `writing_answers`, and `speaking_marks`. | Critical |
| UT-EXAM-008 | Submit payload includes MCQ and writing answers | Active session has MCQ and writing answers. | Trigger manual submit. | Payload includes `mcq_answers` for listening/reading and non-empty `writing_answers` with word count. | Critical |
| UT-EXAM-009 | Next skill action locks previous skill | Current skill is not last. | Confirm next skill. | `skillIdx` increments and confirm dialog closes. | High |
| UT-EXAM-010 | Submit warning counts unanswered MCQ | Current skill is listening or reading with unanswered items. | Open submit/next confirmation. | Warning text reports remaining unanswered questions for the current skill. | Medium |
| UT-EXAM-011 | Writing submit warning counts under-minimum tasks | Current skill is writing and one task is below `min_words`. | Open submit/next confirmation. | Warning text reports incomplete writing parts. | Medium |
| UT-EXAM-012 | Speaking submit warning counts incomplete parts | Current skill is speaking and not all parts are marked done. | Open submit/next confirmation. | Warning text reports speaking parts not recorded. | Medium |
| UT-EXAM-013 | Cost is full-test price when no skill selected | Pricing config is loaded and selected set is empty. | Compute bottom action cost. | Full-test cost is used. | High |
| UT-EXAM-014 | Cost is per-skill price for custom selection | Pricing config is loaded and selected set has 1-3 skills. | Compute bottom action cost. | Cost is `custom_per_skill_coins * selected.size`, capped by full-test cost. | High |
| UT-EXAM-015 | Voice recorder handles microphone denial | Browser rejects `getUserMedia`. | Start recording. | Recorder state becomes `denied` and error message is set. | High |

### 4.6 Exam Room Integration Test Cases

| Test Case ID | Test Case Name | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| IT-EXAM-001 | Load exam library with session states | Learner is authenticated; backend returns exams, config, and sessions. | Navigate to `/thi-thu`. | Frontend calls `GET exams`, `GET config`, and `GET exam-sessions`; cards show correct not-started/in-progress/submitted states. | High |
| IT-EXAM-002 | Search exam by title | Exam library has multiple exams. | Type keyword in search box. | URL search `q` is updated after debounce; visible cards match normalized title search. | Medium |
| IT-EXAM-003 | Filter exam by status | Exam library has not-started, in-progress, and submitted exams. | Switch status tabs. | URL search `status` is updated; count and cards match selected status. | Medium |
| IT-EXAM-004 | Open exam detail and select skills | Learner opens an exam detail page. | Toggle Listening/Reading/Writing/Speaking checkboxes and expand rows. | Selected count, skill rows, duration panel, and bottom action bar update. | High |
| IT-EXAM-005 | Start full test with enough coins | Learner wallet balance is greater than full-test cost. | Click `Làm full test`. | Frontend calls `POST exams/{examId}/sessions` with mode `full`, invalidates wallet/session queries, and navigates to `/phong-thi/{sessionId}?examId=...`. | Critical |
| IT-EXAM-006 | Start custom test with selected skills | Learner selected 1-3 skills and has enough coins. | Click `Bắt đầu luyện tập`. | Frontend calls `POST exams/{examId}/sessions` with mode `custom` and selected skills. | Critical |
| IT-EXAM-007 | Insufficient coins opens top-up dialog | Wallet balance is lower than computed cost. | Click start action. | Start session API is not called; top-up dialog opens. | High |
| IT-EXAM-008 | Active same-exam session can continue | Backend returns active non-expired session for the same exam. | Open exam detail or exam card and click continue. | User navigates to existing `/phong-thi/{sessionId}` without creating a new session. | High |
| IT-EXAM-009 | Reset active same-exam session requires confirmation | Active same-exam session exists. | Click `Làm mới`, then confirm. | Frontend calls `POST exam-sessions/{oldSessionId}/abandon`, then creates a new session. | High |
| IT-EXAM-010 | Device check shows required media checks | Session includes Listening and Speaking. | Enter exam room before starting. | Device check shows audio test, microphone test, exam structure, total duration, notes, and start button. | High |
| IT-EXAM-011 | Draft autosave sends debounced payload | Active exam state changes. | Answer MCQ and write text, wait for debounce. | Frontend calls `PUT exam-sessions/{id}/draft` with current answers and skill index. | Critical |
| IT-EXAM-012 | Resume active draft skips device check | Backend returns an active session and existing draft. | Navigate back to the same exam room. | Exam opens directly in active phase with restored skill and answers. | Critical |
| IT-EXAM-013 | Listening audio play is logged once per section | Listening section audio starts playing. | Click `Phát audio` and allow section transition. | Frontend calls `POST exam-sessions/{id}/listening-played` once per section id. | Medium |
| IT-EXAM-014 | Manual submit posts answers and invalidates caches | Learner reaches last selected skill. | Click `Nộp bài`, confirm submit. | Frontend calls `POST exam-sessions/{id}/submit`, invalidates exam, session, streak, heatmap, overview, courses, and booking queries, then shows result screen. | Critical |
| IT-EXAM-015 | Auto-submit after time expired | Active exam timer reaches zero. | Wait for remaining seconds to become 0. | Expired overlay appears and submit is triggered automatically within backend grace period. | Critical |
| IT-EXAM-016 | Submitted session renders server result | Session status is submitted/graded instead of active. | Navigate to `/phong-thi/{sessionId}?examId=...`. | Frontend fetches `exam-sessions/{id}/results` and displays result summary instead of active room. | High |
| IT-EXAM-017 | Result polling continues while AI feedback is pending | Writing or speaking feedback has `overall_band: null`. | Open submitted result page. | `sessionResultsQuery` refetches every 5 seconds until all AI feedback has band scores. | High |
| IT-EXAM-018 | Result detail displays MCQ and AI feedback | Submitted session has MCQ detail and writing/speaking feedback. | Click `Xem chi tiết`. | Page shows selected/correct MCQ answers, writing feedback, speaking feedback, pending cards where applicable, and back link to result summary. | High |

### 4.7 Exam Room System Test Cases

| Test Case ID | Test Case Name | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| ST-EXAM-001 | Full exam happy path with all four skills | Learner is authenticated, wallet has enough coins, and exam has all four skills. | Open `/thi-thu`, start full test, pass device check, answer Listening/Reading, write answers, record Speaking parts, submit. | Result summary appears and selected skills are included in performance rows. | Critical |
| ST-EXAM-002 | Custom Reading-only exam path | Learner selects only Reading. | Start custom session, answer reading questions, submit. | Device check does not require audio/mic; reading panel appears; result summary shows Reading only. | High |
| ST-EXAM-003 | Listening flow with sequential audio | Exam includes multiple listening sections/parts. | Start Listening, confirm readiness, play audio, answer questions, switch parts. | Audio progresses sequentially, played sections are logged, answered counters update, and part navigation works. | High |
| ST-EXAM-004 | Writing flow with word-count feedback | Exam includes writing tasks. | Type below and above minimum word count for each task. | Word count, progress bar, missing-word message, and achieved requirement message update correctly. | High |
| ST-EXAM-005 | Speaking flow with microphone permission granted | Browser has microphone permission. | Record, stop, play back, confirm, redo one speaking part. | Recording states, waveform, audio playback, done marks, and redo behavior work. | High |
| ST-EXAM-006 | Speaking flow with microphone permission denied | Browser blocks microphone. | Attempt to start recording. | User sees microphone error and cannot mark a valid recording through normal recording path. | High |
| ST-EXAM-007 | Exit exam confirmation protects active session | Active exam is in progress. | Click exit, cancel once, then confirm after countdown. | Cancel keeps user in exam; confirm navigates to `/thi-thu` with warning behavior. | Medium |
| ST-EXAM-008 | Refresh/resume active exam | Active exam has saved draft. | Answer questions, wait for autosave, refresh browser. | Exam resumes from saved draft with previous answers and current skill index. | Critical |
| ST-EXAM-009 | Submitted result and detail review | Exam has been submitted. | Open result summary and detail page. | Summary shows score/pending AI status; detail shows MCQ answers and writing/speaking feedback or pending cards. | High |
| ST-EXAM-010 | Mobile exam-room usability smoke test | Mobile viewport is active. | Open device check, answer at least one skill, use footer actions. | Key controls remain visible and usable; no required action is blocked by layout. | Medium |

### 4.8 Exam Room Acceptance Test Cases

| Test Case ID | Scenario | Acceptance Criteria | Expected Result | Priority |
|---|---|---|---|---|
| AT-EXAM-001 | Learner can find and start an exam | Given an authenticated learner with enough coins, when the learner selects an exam and starts it, then a valid exam session is created. | Learner reaches the exam-room device check and then active exam after clicking start. | Critical |
| AT-EXAM-002 | Learner can choose full test or custom skills | Given an exam with four skills, when the learner selects no skill or selected skills, then cost and session mode match the choice. | No selection starts full mode; selected skills start custom mode. | High |
| AT-EXAM-003 | Exam progress is protected by autosave | Given a learner is doing an exam, when answers change and the page is refreshed after autosave, then the learner can resume without losing saved MCQ and Writing answers. | Draft data is restored and device check is skipped for resumed sessions. | Critical |
| AT-EXAM-004 | Learner is warned before irreversible transitions | Given a learner is leaving a skill or submitting the test, when incomplete answers exist, then the system warns the learner before proceeding. | Confirmation dialog appears with unresolved answer warning. | High |
| AT-EXAM-005 | Timed exam submits automatically | Given the exam timer reaches zero, when the learner is still in the room, then the system submits automatically. | Expired overlay appears and the learner is taken to submitted/result state. | Critical |
| AT-EXAM-006 | Learner can review results after submission | Given a submitted exam session, when the learner opens result summary and detail, then the system shows score, per-skill performance, answers, and available AI feedback. | Results and details are visible; pending AI grading is clearly indicated. | Critical |
| AT-EXAM-007 | Learner cannot start without enough coins | Given learner wallet balance is lower than the computed exam cost, when the learner clicks start, then the system asks for top-up instead of creating a session. | Top-up dialog opens and no session is created. | High |

## 5. Test Reports

This report is prepared from the current `apps/frontend-v3` implementation and is ready for execution. No automated or manual test execution evidence is attached in this document yet, so pass/fail status is recorded as `Not Executed` until the test cases are run against a configured test environment. The exam-room test cases were derived from the inspected frontend implementation and should be executed with seeded exam content, wallet balance scenarios, valid listening audio assets, and browser microphone permission scenarios.

| Test Level | Planned Cases | Passed | Failed | Blocked | Not Executed | Notes |
|---|---:|---:|---:|---:|---:|---|
| Unit | 29 | 0 | 0 | 0 | 29 | Requires component/store/hook test harness and mocked API/media dependencies. |
| Integration | 33 | 0 | 0 | 0 | 33 | Requires backend auth, exam, session, wallet APIs or API mock server. |
| System | 18 | 0 | 0 | 0 | 18 | Requires running frontend, backend, browser, test accounts, test wallet, test exams, audio assets, and microphone scenarios. |
| Acceptance | 14 | 0 | 0 | 0 | 14 | Requires stakeholder review after execution. |
| Total | 94 | 0 | 0 | 0 | 94 | Initial auth and exam-room test design completed. |

Initial risk analysis:

| Risk ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-AUTH-001 | Google OAuth behavior depends on external script and configured client ID. | Google auth tests may be blocked in local environments. | Provide fallback checks and execute full OAuth tests only in configured test/staging environment. |
| R-AUTH-002 | Password reset button exists without a completed flow in inspected frontend code. | Users may expect password reset capability. | Track as out-of-scope or separate requirement/defect depending on product decision. |
| R-AUTH-003 | Registration date picker limits years to 2025-2028. | Users needing later exam dates cannot select them. | Validate against product requirement; add separate defect if beyond accepted range. |
| R-AUTH-004 | Login form relies on browser-native validation for required and email format. | Validation UX may vary by browser. | Include browser compatibility smoke tests. |
| R-AUTH-005 | Session and role rejection logic is security-sensitive. | Incorrect handling can leak session state or allow wrong role access. | Prioritize unit and integration tests for token clearing, query cache clearing, refresh failure, and role rejection. |
| R-EXAM-001 | Speaking recordings are marked done in frontend state, but inspected submit payload builder currently sends MCQ and Writing answers only. | Speaking answers may not be submitted for grading even when UI shows completed parts. | Verify backend/API expectation; add or fix speaking answer upload before marking Speaking full flow as passed. |
| R-EXAM-002 | Autosave is debounced and backend draft query uses infinite stale time. | Resume may load stale draft if query cache is not updated correctly. | Prioritize draft cache sync and refresh/resume tests. |
| R-EXAM-003 | Timer and auto-submit depend on client time and backend grace period. | Late or duplicate submit behavior can confuse learners. | Test expired session, backend already-submitted response, and manual submit near deadline. |
| R-EXAM-004 | Listening playback depends on browser audio behavior and valid media URLs. | Audio may fail or not log played sections in some environments. | Test with real audio assets and include browser compatibility smoke tests. |
| R-EXAM-005 | Microphone recording depends on browser permissions and `MediaRecorder` support. | Speaking test may be blocked for users with denied permission or unsupported browser. | Test granted, denied, and unavailable recorder scenarios; document supported browsers. |
| R-EXAM-006 | Leaving the exam room uses frontend confirmation but does not save speaking audio in draft. | Learner may lose unsubmitted speaking recordings after refresh/exit. | Confirm intended behavior and add persistence/upload if required by product scope. |

Execution evidence to attach after running tests:

| Evidence Type | Expected Artifact |
|---|---|
| Automated unit/component result | Test runner output or CI job link. |
| Integration result | API mock logs or backend request logs showing auth endpoint calls. |
| System result | Browser screenshots/video for login, registration, onboarding, redirect, non-learner rejection, exam start, device check, answering, autosave/resume, submit, result summary, and result detail. |
| Defect log | Issue IDs, severity, owner, status, and retest result. |
