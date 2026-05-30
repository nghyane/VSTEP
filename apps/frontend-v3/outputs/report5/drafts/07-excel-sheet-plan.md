# 5. Excel Sheet Plan

## Final Excel Filename

`Report5_VSTEP_FrontendV3_Test_Report.xlsx`

## Required Sheets

| No | Sheet Name | Purpose | Approx. Cases |
|---|---|---|---:|
| 1 | Cover | Project metadata and record of changes | N/A |
| 2 | Test Cases | Index of all function sheets | 25 rows |
| 3 | Test Statistics | Summary of Passed/Failed/Pending/N/A by function | 25 rows |
| 4 | Login Overlay | Search-param overlay, close, switch login/register | 5 |
| 5 | Password Login | Password login success/failure/redirect | 6 |
| 6 | Registration Step 1 | Password rules, confirm password, email availability | 7 |
| 7 | Registration Onboarding | Nickname, level, target deadline, onboarding API | 6 |
| 8 | Google Authentication | Config missing, script fail, login, onboarding, conflict | 6 |
| 9 | Session Refresh | Refresh success, expired token, invalid token, protected route | 5 |
| 10 | Role Enforcement | Non-learner rejection and cache/token clearing | 5 |
| 11 | Exam Library | Exam loading, search, status filters, card states | 7 |
| 12 | Exam Detail | Detail loading, history, duration panel, section selector | 6 |
| 13 | Skill Selection | Full test, custom skills, expanded rows, cost updates | 6 |
| 14 | Start Exam Session | Enough coins, insufficient coins, active session, reset | 7 |
| 15 | Device Check | Exam structure, audio check, microphone check, start active phase | 6 |
| 16 | Exam Timer | Remaining time, warning state, expiry, auto-submit | 6 |
| 17 | Draft Autosave Resume | Draft save, debounce, restore, expired draft ignore | 7 |
| 18 | Listening Panel | Readiness modal, audio play, logging, part navigation | 7 |
| 19 | Reading Panel | Passage display, navigation, highlight, answer progress | 6 |
| 20 | Writing Panel | Prompt display, editor, word count, min-word warning | 6 |
| 21 | Speaking Panel | Permission granted/denied, recording, playback, redo | 7 |
| 22 | Section Transition | Next skill confirmation, unanswered warnings, lock previous skill | 6 |
| 23 | Submit Exam | Manual submit, auto-submit, payload, cache invalidation | 7 |
| 24 | Result Summary | MCQ score, pending AI badges, skill rows, detail link | 6 |
| 25 | Result Detail | MCQ detail, writing feedback, speaking feedback, pending states | 7 |
| 26 | Wallet Balance | Header balance, loading/error, post-action refresh | 5 |
| 27 | Top-up Dialog | Package list, package metadata, empty state, selection | 6 |
| 28 | Top-up Payment | Create order, redirect, missing payment URL, error | 6 |
| 29 | Insufficient Coins | Start exam blocked by low balance, dialog opens | 5 |
| 30 | Promo Redeem | Valid, invalid, expired, used, uppercase normalization | 7 |

## Status Convention

- `Pending`: test case is defined but not executed.
- `Passed`: executed and actual result matches expected result.
- `Failed`: executed and actual result does not match expected result.
- `N/A`: not applicable for current build/environment.

## Tester Assignment Rule

| Area | Main Tester |
|---|---|
| Auth, backend contract, session refresh | Hoàng Văn Anh Nghĩa |
| Learner web auth/register/profile promo | Nguyễn Nhật Phát |
| Exam library/detail/room/result/wallet header | Nguyễn Trần Tấn Phát |
| Speaking/microphone/mobile viewport/media behavior | Nguyễn Minh Khôi |
