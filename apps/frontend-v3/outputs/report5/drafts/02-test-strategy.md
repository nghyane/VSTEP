# 2. Test Strategy

## Strategy Overview

The test strategy combines source-based test design, component behavior validation, API integration checks, browser-based system tests, and acceptance verification.

Authentication is security-sensitive because it stores access/refresh tokens, initializes sessions, rejects non-learner roles, and redirects users into protected routes.

The exam room is reliability-sensitive because it manages paid session creation, timed progression, autosave, media playback/recording, irreversible skill transitions, and final submission.

Wallet and promo-code flows are financial/ledger-sensitive because they display spendable balance, start paid exam sessions, redirect to a payment provider, and grant coins from reward codes.

## Testing Types

| Testing Type | Objective | Technique | Completion Criteria |
|---|---|---|---|
| Unit Testing | Verify isolated frontend logic used by auth forms, auth store, exam state, timer, cost, draft payload, top-up package enrichment, and promo-code input behavior. | Test helper/state branches with mocked dependencies. | All planned unit cases pass with no unhandled critical branch. |
| Component/UI Testing | Verify login, registration, exam panels, dialogs, result pages, wallet top-up dialog, header coin pill, and promo-code card render correct controls and states. | Render components with mocked store/router/query/media APIs. | UI responds correctly to loading, validation, error, success, and disabled states. |
| API Integration Testing | Verify frontend calls correct auth, exam, and wallet endpoints and processes API responses correctly. | Mock or run backend API responses for `auth/*`, `exams`, `exam-sessions/*`, `wallet/*`. | Correct payloads are sent; errors and success states are handled safely. |
| System Testing | Validate complete browser workflows against a running backend. | Execute user journeys in desktop and mobile browser viewports. | Learner can register/login, start exam, submit, review result, top up, and redeem promo code. |
| Acceptance Testing | Confirm behavior satisfies learner-facing capstone requirements. | Scenario-based checks with representative accounts, exam fixtures, wallet fixtures, and promo codes. | No critical/high defect remains open for accepted flows. |
| Security Testing | Verify invalid, expired, and unauthorized sessions are not kept. | Test failed login, non-learner login, expired refresh token, and Google conflict. | Tokens/cache are cleared and protected routes remain protected. |
| Compatibility Testing | Confirm key flows work across common viewports/browsers. | Chromium/Chrome desktop and mobile viewport smoke tests. | Layout remains usable and no blocker occurs. |
| Regression Testing | Ensure future changes do not break existing auth/exam/wallet flows. | Re-run critical cases after changes to routes, auth store, exam state, API client, or wallet features. | Previously passed critical cases do not regress. |

## Test Levels

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

## Supporting Tools

| Purpose | Tool | Vendor/In-house | Version |
|---|---|---|---|
| Frontend runtime | Bun | Vendor | Project configured |
| Build server | Vite | Vendor | 8.0.8 |
| UI framework | React | Vendor | 19.2.5 |
| Routing/search params | TanStack Router | Vendor | 1.168.23 |
| Form state | TanStack React Form | Vendor | 1.29.0 |
| Server state/cache | TanStack Query | Vendor | 5.99.2 |
| HTTP client | ky | Vendor | 2.0.1 |
| Client auth state | Zustand | Vendor | 5.0.12 |
| Static checks | Biome | Vendor | 2.4.12 |
| Browser/system testing | Chrome / Chromium / Agent Browser | Vendor/Open Source | Test machine version |
| Backend API dependency | `apps/backend-v2` | In-house | Current workspace |
| Google Sign-In | Google Identity Services | Vendor | Runtime script |
| Browser media APIs | HTMLAudioElement, MediaRecorder, getUserMedia, AudioContext | Browser vendor | Test machine version |
