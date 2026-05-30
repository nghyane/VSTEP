# Mobile V2 Test Cases

Review date: 2026-05-30
Scope: `apps/mobile-v2`

Reference documents:

- `D:/Download/99-TIENG-VIET-TONG-HOP.md`
- `D:/Download/100-TREE-DIAGRAM.md`
- Current mobile-v2 source code: routes in `app/`, hooks and features in `src/`

## Selection Criteria

This document keeps only learner-facing test cases that are implemented or observable in the mobile-v2 app:

- Expo Router screens in `apps/mobile-v2/app`.
- TanStack Query hooks and API clients in `apps/mobile-v2/src`.
- Mobile-native behavior such as SecureStore, bottom tabs, mobile navigation, device checks, audio/microphone recording, local exam draft, Android hardware back handling, top-up sheets, and notification sheets.

Excluded from this mobile-only pass:

- Admin, teacher, backend-only, internal AI pipeline, public payment callback, health/config backend tests.
- Web-specific behavior such as `AUTH-LOGIN-005` login overlay via search params and `NFT-COMP-001` Chrome compatibility.
- Frontend SSE cases where mobile-v2 currently uses polling instead of streaming.

## Executed Checks

| Check | Command | Result |
|---|---|---|
| TypeScript | `bun run typecheck` | PASS |
| Expo lint | `bun run lint` | PASS, with 8 existing `react-hooks/exhaustive-deps` warnings |
| Existing test files | `rg --files -g '*test*' -g '*spec*'` | No dedicated mobile-v2 test/spec files found |
| Parity path existence | Checked all `mobileV2` paths in `src/lib/learner-flow-parity.ts` | 1 missing path: `app/(app)/goal.tsx` |

Runtime note: this pass did not run the app on an emulator or physical device. Cases involving microphone/audio, photo picker, SecureStore persistence, app background/kill behavior, and payment redirect behavior still require Android/iOS runtime verification with seeded backend data.

## Status Legend

- `PASS-static`: verified by source review and available command checks.
- `NEEDS-device`: requires emulator/physical device and seeded API data before final pass/fail.
- `GAP`: mismatch between documentation/parity expectation and current mobile-v2 source.
- `N/A-mobile`: not a mobile-v2 test case.

## Auth, Session, Onboarding, Profile

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| AUTH-REG-001 | Register a learner with valid email/password and create the initial session | `app/(auth)/register.tsx`, `src/lib/api.ts`, `welcome-gift-store.ts` | PASS-static, NEEDS-device | Register with a new email. Expect tokens to be saved, the app to enter onboarding/tabs according to the API response, and the welcome gift popup to appear when the backend grants a bonus. |
| AUTH-REG-002 | Show an error when registering with an existing email | `app/(auth)/register.tsx`, `registerApi` | PASS-static, NEEDS-device | Register with an existing email. Expect a form-level error and no route replacement. |
| AUTH-LOGIN-001 | Log in successfully with learner credentials | `app/(auth)/login.tsx`, `loginApi`, `useAuth` | PASS-static, NEEDS-device | Log in as a learner with a profile. Expect navigation to `/(app)/(tabs)`. |
| AUTH-LOGIN-003 | Reject login with an incorrect password | `app/(auth)/login.tsx` | PASS-static, NEEDS-device | Enter a wrong password. Expect an error banner and no saved authenticated session. |
| AUTH-LOGIN-006 | Route after login based on profile state | `app/(auth)/login.tsx` | PASS-static, NEEDS-device | A user with a profile should go to tabs; a user without a profile should go to `/(app)/onboarding`. |
| AUTH-LOGIN-008 | Reject non-learner accounts on mobile | `LEARNER_ROLE` guard in `app/(auth)/login.tsx` | PASS-static, NEEDS-device | Log in as admin/teacher. Expect the app to sign out and show the "learner only" message. |
| AUTH-GOOGLE-001 | Log in with Google as a learner | `app/(auth)/login.tsx`, `src/lib/google-auth.ts`, `googleLoginApi` | PASS-static, NEEDS-device | Use valid OAuth config. Expect learners with profiles to enter tabs and learners needing onboarding to enter onboarding. |
| AUTH-GOOGLE-003 | Show conflict message for Google email conflict | `app/(auth)/login.tsx` | PASS-static, NEEDS-device | Backend returns 409. Expect the conflict message and no authenticated navigation. |
| AUTH-SESS-001 | Restore session on app launch with a valid refresh token | `app/_layout.tsx`, `refreshSession`, `src/lib/auth.ts` | PASS-static, NEEDS-device | Open the app with a valid refresh token. Expect authenticated state restoration. |
| AUTH-SESS-002 | Clear stored tokens when refresh token is expired | `refreshSession`, `clearTokens` | PASS-static, NEEDS-device | Simulate refresh 401. Expect SecureStore values to be cleared and auth state to become unauthenticated. |
| AUTH-SESS-003 | Log out and clear session data | `app/_layout.tsx`, `src/lib/auth.ts`, profile tab signOut | PASS-static, NEEDS-device | Log out from profile. Reopen the app. Expect no session restoration. |
| AUTH-SESS-004 | Handle protected API calls without a valid token | `src/lib/api.ts` | PASS-static, NEEDS-device | Clear tokens and open a protected screen. Expect the request to fail safely and the app to return to auth flow. |
| AUTH-SESS-007 | Redirect unauthenticated users to login | `app/_layout.tsx`, `app/index.tsx` | PASS-static, NEEDS-device | Cold start with no token. Expect navigation to `/(auth)/login`. |
| PROF-001 | List learner profiles | `src/hooks/use-profiles.ts`, `app/(app)/(tabs)/profile.tsx` | PASS-static, NEEDS-device | Open the profile tab. Expect profiles from `/api/v1/profiles` to render. |
| PROF-002 | Create a new learning profile | `CreateProfileSheet`, `useCreateProfile` | PASS-static, NEEDS-device | Create a new target profile. Expect POST success and `profiles` query invalidation. |
| PROF-003 | Switch active profile | `useSwitchProfile`, `switchSession` | PASS-static, NEEDS-device | Select another profile. Expect new tokens/profile data and updated UI. |
| PROF-004 | Update profile nickname and deadline | `EditProfileSheet`, `useUpdateProfile` | PASS-static, NEEDS-device | Edit nickname/deadline. Expect PATCH success and refetched profile data. |
| PROF-008 | Complete onboarding and show bonus reward when granted | `app/(app)/onboarding.tsx`, `completeOnboardingApi`, `showWelcomeGift` | PASS-static, NEEDS-device | Complete onboarding as a new user. Expect profile creation and a coin popup if `onboardingBonus.granted` is true. |
| PROF-009 | Change password | `ChangePasswordDialog`, `/api/v1/me/change-password` | PASS-static, NEEDS-device | Submit wrong current password, then correct data. Expect error first, then success state. |
| PROF-010 | Update avatar by preset or photo upload | `AvatarPickerSheet`, `avatar-actions.ts`, `UserAvatar` | PASS-static, NEEDS-device | Choose a preset and upload a library photo. Expect user avatar data to update. |
| PROFILE-GOAL-ROUTE | Verify parity reference to goal route | `src/lib/learner-flow-parity.ts` | GAP | `app/(app)/goal.tsx` does not exist. Current goal/profile behavior appears to live in onboarding/profile sheets. |

## Dashboard, Progress, Streak

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| DASH-OV-001 | Fetch learner overview data | `useOverview`, dashboard tab | PASS-static, NEEDS-device | Load dashboard with seeded overview data. Expect profile, stats, streak, and scores to render. |
| DASH-OV-003 | Render dashboard cards | dashboard tab, `SpiderChart`, `ActivityHeatmap`, `GapAnalysis`, `ScoreTrend` | PASS-static, NEEDS-device | Open dashboard after login. Expect hero, skill cards, stats, next action, and analysis sections. |
| DASH-PROG-002 | Hide spider chart when data is insufficient | dashboard chart branch | PASS-static, NEEDS-device | Backend returns `scores.spider = null`. Expect a locked/empty chart message. |
| DASH-PROG-003 | Show spider chart when score data exists | `SpiderChart` | PASS-static, NEEDS-device | Backend returns spider values. Expect a four-skill radar chart. |
| DASH-STK-001 | Load streak state | `useStreak`, `StreakButton`, `streak-store.ts` | PASS-static, NEEDS-device | Dashboard should show the current streak count. |
| DASH-STK-003 | Claim streak milestone reward | `StreakButton`, `claimMilestone`, `showWelcomeGift` | PASS-static, NEEDS-device | With an unlocked milestone, tap claim. Expect a coin reward popup. |
| DASH-STK-005 | Open streak dialog | `StreakButton` | PASS-static, NEEDS-device | Tap the streak button. Expect weekly progress and milestone content. |
| DASH-LP-001 | Fetch learning-path recommendations | `use-learning-path.ts` | PASS-static, NEEDS-device | API returns recommendations. Expect weak-skill guidance data. |
| DASH-LP-004 | Render recommendation section on practice hub | `RecommendationSection`, practice tab | PASS-static, NEEDS-device | Open the practice tab. Expect recommendation cards when data exists. |

## Vocabulary and Grammar

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| VOC-001 | List vocabulary topics | `vocabulary/index.tsx`, `useVocabTopics` | PASS-static, NEEDS-device | Open vocabulary index. Expect topic list. |
| VOC-002 | View vocabulary topic detail | `vocabulary/[id].tsx`, `useVocabTopicDetail` | PASS-static, NEEDS-device | Tap a topic. Expect words, progress, and actions. |
| VOC-EX-004 | Complete vocabulary exercise flow | `vocabulary/[id]/exercise.tsx`, `useVocabExerciseSession` | PASS-static, NEEDS-device | Answer MCQ/fill-blank items and submit. Expect per-question results. |
| VOC-SRS-001 | Load SRS review queue | `vocabulary/srs-review.tsx`, `useVocabSrsQueue` | PASS-static, NEEDS-device | Open SRS review with due cards. Expect a review queue. |
| VOC-SRS-002 | Submit SRS rating | `useSrsReviewMutation`, `SrsRatingButtons` | PASS-static, NEEDS-device | Flip a card and rate it. Expect the card to leave the queue and queries to invalidate. |
| VOC-SRS-004 | Complete SRS review flow | `SrsFlipCard`, `SrsRatingButtons` | PASS-static, NEEDS-device | Flip, rate, and finish all cards. Expect completion/empty state. |
| VOC-SRS-006 | Verify FSRS scheduling interval | Backend/domain logic | N/A-mobile | Mobile only sends the rating; scheduler correctness belongs to backend/domain tests. |
| GRAM-001 | List grammar points | `practice/grammar/index.tsx`, grammar hooks | PASS-static, NEEDS-device | Open grammar. Expect grammar point list. |
| GRAM-002 | View grammar point detail | `practice/grammar/[pointId].tsx` | PASS-static, NEEDS-device | Tap a grammar point. Expect details, examples, and exercise action. |
| GRAM-EX-002 | Complete grammar exercise | `practice/grammar/[pointId]/exercise.tsx` | PASS-static, NEEDS-device | Submit answers. Expect result feedback. |
| GRAM-EX-004 | Retry grammar exercise | grammar exercise screen/session reducer | PASS-static, NEEDS-device | After result, retry if action is available. Expect the session to reset. |

## Practice Listening and Reading

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| PRAC-SKILLS-001 | Show practice hub with all major learning areas | practice tab, `practice/skills.tsx`, `foundation/index.tsx` | PASS-static, NEEDS-device | Open the practice tab. Expect listening, reading, writing, speaking, vocabulary, and grammar entry points. |
| PRAC-LIS-001 | List listening exercises | `practice/listening/index.tsx`, `useListeningExercises` | PASS-static, NEEDS-device | Open listening list. Expect exercises. |
| PRAC-LIS-002 | View listening detail with audio/transcript/questions | `practice/listening/[exerciseId].tsx` | PASS-static, NEEDS-device | Open a seeded listening exercise. Expect audio or TTS fallback plus questions. |
| PRAC-LIS-004 | Submit listening answers | listening session hooks | PASS-static, NEEDS-device | Select answers and submit. Expect correct/incorrect scoring. |
| PRAC-LIS-006 | Filter listening list by level | `LevelFilters`, listening index | PASS-static, NEEDS-device | Switch B1/B2/C1 filters. Expect filtered results. |
| PRAC-LIS-007 | Show listening result after submit | `McqResultCard` | PASS-static, NEEDS-device | Submit an exercise. Expect score and explanations. |
| PRAC-REA-001 | List reading exercises | `practice/reading/index.tsx`, `useReadingExercises` | PASS-static, NEEDS-device | Open reading list. Expect exercises. |
| PRAC-REA-002 | View reading detail with passage and questions | `practice/reading/[exerciseId].tsx`, `PassageWordView` | PASS-static, NEEDS-device | Open a reading exercise. Expect passage and MCQ items. |
| PRAC-REA-004 | Submit reading answers | reading session hooks | PASS-static, NEEDS-device | Select answers and submit. Expect correct/incorrect scoring. |
| PRAC-REA-005 | Render passage in mobile layout | `PassageWordView`, reading screen | PASS-static, NEEDS-device | Inspect passage display on mobile. Expect no layout overflow. |
| PRAC-REA-007 | Show reading result after submit | `McqResultCard` | PASS-static, NEEDS-device | Submit an exercise. Expect score and explanations. |

## Practice Writing

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| WRI-001 | List writing prompts | `practice/writing/index.tsx`, writing hooks | PASS-static, NEEDS-device | Open writing list. Expect prompts. |
| WRI-004 | Submit writing answer and trigger grading | `practice/writing/[promptId].tsx`, writing submit mutation | PASS-static, NEEDS-device | Enter enough words and submit. Expect submission ID/grading route. |
| WRI-005 | Block writing submission below `min_words` | `WritingWordProgress`, writing prompt screen | PASS-static, NEEDS-device | Enter too few words. Expect disabled submit or validation feedback. |
| WRI-010 | Show word count and progress | `WritingWordProgress` | PASS-static, NEEDS-device | Type text. Expect live word count/progress update. |
| WRI-011 | Show grading state from pending to feedback | `grading/writing/[submissionId].tsx`, `WritingReviewSheet` | PASS-static, NEEDS-device | Submit writing and wait for grading. Expect pending state then result. |
| WRI-012 | Render strengths, improvements, and rewrites | writing grading/result components | PASS-static, NEEDS-device | Backend returns full feedback. Expect all sections to render. |
| WRI-008 | Receive feedback via SSE stream | Mobile uses polling, not SSE | N/A-mobile | Do not include in mobile-v2 runtime pass unless SSE is added to mobile. |

## Practice Speaking

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| SPK-DRL-004 | Submit pronunciation drill audio and receive feedback | `practice/speaking/drill/[drillId].tsx`, practice hooks | PASS-static, NEEDS-device | Grant microphone permission, record, and submit. Expect feedback/result. |
| SPK-DRL-006 | Filter speaking drill list | `practice/speaking/drills.tsx`, `LevelFilters`, `StatusFilters` | PASS-static, NEEDS-device | Change level/status filters. Expect filtered drills. |
| SPK-VST-004 | Submit VSTEP speaking answer with audio upload | `practice/speaking/[taskId].tsx`, `/api/v1/audio/presign-upload` | PASS-static, NEEDS-device | Record each part and submit. Expect grading submission. |
| SPK-VST-006 | Complete mobile VSTEP speaking recording flow | `practice/speaking/[taskId].tsx`, `expo-av` | PASS-static, NEEDS-device | Test permission denied/granted, countdown, playback, and submit behavior. |
| SPK-CONV-003 | Start AI conversation session | `use-conversation-session.ts`, conversation route | PASS-static, NEEDS-device | Open a scenario. Expect the first AI turn/session. |
| SPK-CONV-004 | Send an AI conversation turn | conversation route/hooks | PASS-static, NEEDS-device | Record or transcribe a user turn and submit. Expect next turn/feedback. |
| SPK-CONV-006 | View AI conversation review | conversation hooks/components | PASS-static, NEEDS-device | End the conversation. Expect review content. |
| SPK-CONV-008 | Complete mobile roleplay flow | `ConversationTurnView`, `ConversationFeedback` | PASS-static, NEEDS-device | Run a scenario end to end. Expect turns and feedback to render. |
| SPK-SHA-003 | Complete shadowing segment flow | `practice/speaking/shadowing/*`, `use-shadowing-session`, `word-compare.ts` | PASS-static, NEEDS-device | Open a lesson, play/speak a segment, compare words, and mark progress. |

## Exam Room

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| EXAM-LIB-001 | Load exam library with status | `app/(app)/(tabs)/exams.tsx`, `useExams` | PASS-static, NEEDS-device | Open exam tab. Expect exam cards with status. |
| EXAM-LIB-003 | Filter exams by status | `StatusFilters`, exams tab | PASS-static, NEEDS-device | Change status filter. Expect filtered exams. |
| EXAM-DET-001 | View exam detail | `app/(app)/exam/[id].tsx`, `useExam` | PASS-static, NEEDS-device | Tap an exam. Expect sections/history/details. |
| EXAM-DET-002 | Select skills and expand part information | exam detail screen | PASS-static, NEEDS-device | Toggle custom skills and expand parts. Expect selection/cost changes. |
| EXAM-DET-003 | Show full/custom test price | exam detail labels/config | PASS-static, NEEDS-device | Inspect full and custom mode. Expect price from config/API behavior. |
| EXAM-START-001 | Start a full test and charge coins | `useStartExamSession` | PASS-static, NEEDS-device | Start full test with enough coins. Expect session creation and coin charge. |
| EXAM-START-002 | Start a custom test and charge coins by skill | `useStartExamSession` | PASS-static, NEEDS-device | Select 1-3 skills and start. Expect custom session. |
| EXAM-START-003 | Reject start when coins are insufficient | exam detail insufficient branch | PASS-static, NEEDS-device | Use low wallet balance. Expect no session start. |
| EXAM-START-004 | Open top-up flow when coins are insufficient | `TopUpSheet`, `CoinButton`, insufficient actions | PASS-static, NEEDS-device | Tap the insufficient-coins CTA. Expect top-up route/sheet. |
| EXAM-START-005 | Continue an active exam session | `useActiveExamSession`, exam detail/session route | PASS-static, NEEDS-device | With an active session for the exam, tap continue. Expect resume route. |
| EXAM-DC-001 | Run device check before exam | `session/[id].tsx`, `DeviceTestWidgets` | PASS-static, NEEDS-device | Start a session. Test audio/mic and enter the exam room. |
| EXAM-DRAFT-001 | Save local and server exam draft | `exam-draft.ts`, `useSaveExamDraft` | PASS-static, NEEDS-device | Answer questions, background the app, reopen/resume. Expect answers to persist. |
| EXAM-DRAFT-003 | Autosave exam draft with mobile debounce | `SERVER_DRAFT_SYNC_MS = 1_500`, local save 250ms | PASS-static, NEEDS-device | Change an answer. Expect local draft quickly and server draft after about 1.5s. The general report says 5s, but mobile code currently uses 1.5s. |
| EXAM-DRAFT-004 | Resume from draft and skip device check | `resume === "1"` in `session/[id].tsx` | PASS-static, NEEDS-device | Resume an active session. Expect active phase without device check. |
| EXAM-PANEL-001 | Show listening readiness/play flow and log play event | `ListeningPanel`, `useLogListeningPlayed` | PASS-static, NEEDS-device | Play listening audio. Expect play log endpoint call. |
| EXAM-PANEL-004 | Render reading panel with passage and questions | `ReadingPanel` | PASS-static, NEEDS-device | Open reading skill in exam. Expect split content/questions. |
| EXAM-PANEL-006 | Render writing editor with word count/progress | `WritingPanel` | PASS-static, NEEDS-device | Type into writing task. Expect word count update. |
| EXAM-PANEL-008 | Record, stop, play back, and upload speaking answer | `SpeakingPanel`, `expo-av` | PASS-static, NEEDS-device | Grant microphone permission, record, play back, and confirm. |
| EXAM-PANEL-009 | Handle denied microphone permission | `SpeakingPanel`, `DeviceTestWidgets` | PASS-static, NEEDS-device | Deny microphone permission. Expect a safe error state. |
| EXAM-TRANS-001 | Confirm skill transition with unanswered count | `ConfirmModal`, `getCurrentSkillPending` | PASS-static, NEEDS-device | Leave unanswered items and tap next skill. Expect warning count. |
| EXAM-TRANS-002 | Prevent returning to previous skill after transition | `NEXT_SKILL`, sequential `skillIdx` state | PASS-static, NEEDS-device | Move to the next skill. Expect no UI path back to previous skill. |
| EXAM-SUBMIT-001 | Submit exam manually | `showConfirmSubmit`, `useSubmitExamSession`, `ResultScreen` | PASS-static, NEEDS-device | Tap submit and confirm. Expect result screen/session result route. |
| EXAM-SUBMIT-002 | Auto-submit when timer reaches zero | `remaining === 0` effect in `session/[id].tsx` | PASS-static, NEEDS-device | Use a near-deadline session and wait. Expect automatic submit. |
| EXAM-SUBMIT-003 | Calculate MCQ score accurately | Backend/domain result | N/A-mobile | Mobile renders the returned score; scoring correctness belongs to backend/API tests. |
| EXAM-RESULT-001 | Show exam result summary with pending AI state | `exam-result/[id].tsx`, `useExamSessionResults` | PASS-static, NEEDS-device | Open result after submit. Expect score summary and pending AI indicators if needed. |
| EXAM-RESULT-002 | Show writing feedback after grading | `useExamSessionResults`, result screen | PASS-static, NEEDS-device | Backend returns writing `overallBand`. Expect feedback section. |
| EXAM-RESULT-004 | Poll result every 5 seconds while grading is pending | `useExamSessionResults` refetch interval | PASS-static, NEEDS-device | Mock pending writing/speaking feedback. Expect 5s polling until complete. |
| EXAM-RESULT-005 | Show detailed result with MCQ grid and feedback | `exam-result/[id].tsx` | PASS-static, NEEDS-device | Open result for a session with MCQ detail. Expect selected/correct grid and feedback. |

## Wallet, Top-up, Promo, Notifications

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| WALL-BAL-001 | Fetch wallet balance | `useWalletBalance`, `CoinButton`, wallet screen | PASS-static, NEEDS-device | Open dashboard/wallet. Expect current coin balance. |
| WALL-BAL-003 | Show coin balance in mobile header/dashboard | `CoinButton` | PASS-static, NEEDS-device | Inspect dashboard top-right area. Expect coin badge. |
| WALL-TOP-001 | Fetch active top-up packages | `useTopupPackages` | PASS-static, NEEDS-device | Open top-up. Expect package list from API. |
| WALL-TOP-002 | Show mobile top-up package picker | `TopUpSheet`, `app/(app)/topup.tsx` | PASS-static, NEEDS-device | Tap coin/top-up. Expect package selection UI. |
| WALL-PAY-001 | Create top-up order | `TopUpSheet`, `useCreateTopup` | PASS-static, NEEDS-device | Select a package and buy. Expect order creation. |
| WALL-PAY-002 | Confirm top-up and update wallet balance | `TopUpSheet`, `useConfirmTopup`, wallet invalidation | PASS-static, NEEDS-device | Confirm order. Expect balance and transactions to refresh. |
| WALL-PAY-004 | Redirect to payment URL | Current source confirms top-up directly, no redirect found | GAP | If payment URL redirect is required, mobile implementation or expectation needs adjustment. |
| WALL-PROMO-001 | Redeem valid promo code | `PromoRedeemCard`, `useRedeemPromo` | PASS-static, NEEDS-device | Enter a valid code. Expect success popup and balance refresh. |
| WALL-PROMO-002 | Reject invalid promo code | `PromoRedeemCard` | PASS-static, NEEDS-device | Enter an invalid code. Expect error message. |
| WALL-PROMO-005 | Show promo redeem card on profile/wallet surface | `PromoRedeemCard`, profile integration | PASS-static, NEEDS-device | Open profile. Expect redeem card where integrated. |
| WALL-PROMO-006 | Show promo error state | `PromoRedeemCard` | PASS-static, NEEDS-device | Backend returns validation error. Expect visible error. |
| NOTIF-001 | List notifications | notification screen, `NotificationButton`, notification queries | PASS-static, NEEDS-device | Open notification sheet/screen. Expect notification list. |
| NOTIF-007 | Show notification bell with unread badge | `NotificationButton`, `useUnreadCount` | PASS-static, NEEDS-device | Backend returns unread count > 0. Expect badge, capped at `9+`. |

## Courses and Booking

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| COURSE-EN-001 | List courses | `ClassesContent`, `useCourses` | PASS-static, NEEDS-device | Open classes tab. Expect enrolled and available courses. |
| COURSE-EN-003 | Create enrollment order | `useCreateEnrollmentOrder` | PASS-static, NEEDS-device | Tap enroll on a course. Expect order creation. |
| COURSE-EN-005 | Complete mobile enrollment flow | `courses/[courseId].tsx`, wallet balance branch | PASS-static, NEEDS-device | Enroll with enough/insufficient coins. Expect success or top-up prompt. |
| COURSE-BK-002 | Book a 1-on-1 slot | `CourseBookingContent`, `useBookSlot` | PASS-static, NEEDS-device | Open booking page and select an available slot. Expect booking success. |
| COURSE-BK-003 | Deduct coins after booking | `useBookSlot` wallet cache update | PASS-static, NEEDS-device | Book a slot. Expect wallet balance to decrease. |
| COURSE-BK-004 | Prevent booking beyond max limit | `reachedLimit` branch | PASS-static, NEEDS-device | Backend returns `myBookingsCount >= maxBookingsPerStudent`. Expect locked slot list/limit card. |
| COURSE-BK-010 | Block booking when commitment is not satisfied | `BookingCommitmentGate`, locked branch | PASS-static, NEEDS-device | Backend returns unmet commitment. Expect booking disabled with gate message. |

## Mobile Non-functional

| ID | Test case | Evidence | Status | Test steps / expected result |
|---|---|---|---|---|
| NFT-SEC-001 | Reject expired token and clear session after failed refresh | `src/lib/api.ts`, `refreshSession` | PASS-static, NEEDS-device | Simulate refresh failure. Expect stored session cleared. |
| NFT-SEC-005 | Prevent reading another user's profile | Backend authorization | N/A-mobile | Mobile only calls current-user `/profiles`; authorization belongs to backend/API tests. |
| NFT-SEC-007 | Do not expose password in response/UI | API types and UI do not render password | PASS-static, NEEDS-device | Inspect real network response and UI. Expect no password field display. |
| NFT-USE-003 | Confirm before exiting exam room | `session/[id].tsx`, `BackHandler`, `Alert` | PASS-static, NEEDS-device | Tap exit or Android hardware back during an exam. Expect confirmation dialog. |
| NFT-USE-005 | Show useful empty states | `MascotEmpty`, notification empty branches, list empty branches | PASS-static, NEEDS-device | API returns empty lists. Expect non-crashing empty-state copy. |
| NFT-REL-001 | Keep data consistent after submit | invalidation/refetch paths in hooks | PASS-static, NEEDS-device | Submit practice/exam. Expect result/dashboard/wallet data to refresh where applicable. |
| NFT-REL-002 | Restore draft after app background/kill | `exam-draft.ts`, AppState flush, resume route | PASS-static, NEEDS-device | Answer in exam, kill/background app, reopen active session. Expect draft recovery. |

## Manual Device Smoke Checklist

Use this checklist once a development/staging backend has seeded learner data:

1. Auth: register, wrong-password login, learner login, non-learner rejection, Google missing/configured OAuth.
2. Onboarding/profile: complete onboarding, create/switch/edit/delete profile, avatar preset/photo, change password.
3. Dashboard: overview, streak dialog, coin badge, notification badge, spider chart hidden/visible.
4. Practice: vocabulary topic/exercise/SRS, grammar exercise, listening audio/TTS, reading passage, writing submit/polling, speaking drill/VSTEP/conversation/shadowing.
5. Exam: list/detail, full/custom start, insufficient-coin top-up, device check, listening play log, reading/writing/speaking panels, section transition confirmation, autosave/resume, manual submit, auto-submit, result polling.
6. Wallet/course/notification: top-up, promo redeem, wallet transactions, course enrollment, booking gate/limit/slot, notification read/delete.

## Follow-up Items

- Add an automated test runner if component/unit automation is required. `package.json` currently has no `test` script.
- Fix or confirm the stale `app/(app)/goal.tsx` reference in `src/lib/learner-flow-parity.ts`.
- Decide the mobile expectation for `WALL-PAY-004`: current source confirms top-up directly and does not redirect to a payment URL.
- Align `EXAM-DRAFT-003`: the general report says 5 seconds, but mobile-v2 currently syncs server draft after 1.5 seconds and local draft after 250ms.
