# 1. Scope of Testing

## Feature Under Test

`apps/frontend-v3` learner authentication, exam room, wallet top-up, and promo-code redemption.

## In Scope

### Authentication

- Landing authentication overlay opened by search params.
- Email/password login.
- Email/password registration.
- Onboarding profile setup during registration.
- Google Sign-In integration behavior.
- Authenticated redirection.
- Learner-only role enforcement.
- Session initialization through refresh token.

### Exam Room

- Exam library search and status filtering.
- Exam detail page and skill selection.
- Full-test and custom-skill session start.
- Coin charging and insufficient-coin handling.
- Device check before exam entry.
- Timed active exam phase.
- Listening, Reading, Writing, and Speaking panels.
- Draft autosave and resume.
- Section transition locking.
- Manual submit and auto-submit after timer expiry.
- Result summary and detailed result review.

### Wallet and Promo Code

- Header wallet balance display.
- Top-up package list.
- Top-up payment-order creation.
- Payment redirect from returned `payment_url`.
- Insufficient coin prompt from exam start.
- Wallet balance/session cache invalidation after paid actions.
- Promo-code redemption from profile page.
- Promo redeem success feedback and coin-gain animation.

## Out of Scope

- Backend authentication internals.
- Admin app authentication UI.
- Password reset, because the inspected frontend does not contain a completed reset flow.
- Backend scoring and grading algorithms.
- Payment provider settlement/webhook internals.
- Promo-code campaign generation and backend eligibility rules.
- Full backend ledger reconciliation.
- Backend speaking audio storage if not supported by current submit payload.

## Main Evidence Files

### Authentication Evidence

- `src/routes/index.tsx`
- `src/features/landing/components/LandingAuthOverlay.tsx`
- `src/features/auth/AuthShell.tsx`
- `src/features/auth/LoginForm.tsx`
- `src/features/auth/RegisterForm.tsx`
- `src/features/auth/GoogleButton.tsx`
- `src/features/auth/PasswordInput.tsx`
- `src/features/auth/DatePicker.tsx`
- `src/lib/auth.ts`
- `src/lib/vstep.ts`

### Exam Evidence

- `src/routes/_app/thi-thu/index.tsx`
- `src/routes/_app/thi-thu/$examId.tsx`
- `src/routes/_focused/phong-thi/$sessionId.tsx`
- `src/routes/_focused/phong-thi/$sessionId_.chi-tiet.tsx`
- `src/features/exam/actions.ts`
- `src/features/exam/queries.ts`
- `src/features/exam/use-exam-session.ts`
- `src/features/exam/components/ExamCard.tsx`
- `src/features/exam/components/SectionSelector.tsx`
- `src/features/exam/components/BottomActionBar.tsx`
- `src/features/exam/components/DurationPanel.tsx`
- `src/features/exam/components/DeviceCheckScreen.tsx`
- `src/features/exam/components/ListeningPanel.tsx`
- `src/features/exam/components/ReadingPanel.tsx`
- `src/features/exam/components/WritingPanel.tsx`
- `src/features/exam/components/SpeakingPanel.tsx`
- `src/features/practice/use-voice-recorder.ts`

### Wallet Evidence

- `src/components/Header.tsx`
- `src/routes/_app/ho-so.tsx`
- `src/features/wallet/TopUpDialog.tsx`
- `src/features/wallet/use-topup-dialog.ts`
- `src/features/wallet/PromoRedeemCard.tsx`
- `src/features/wallet/PromoRedeemSuccessPopup.tsx`
- `src/features/wallet/TopUpSuccessPopup.tsx`
- `src/features/wallet/actions.ts`
- `src/features/wallet/queries.ts`
- `src/features/wallet/types.ts`
