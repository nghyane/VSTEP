# LOG.md

## 2025-01-15 — Mobile v2 .agents setup (English translation)

Created `.agents/` structure for mobile-v2 with:
- 12 skills covering learner flow, UI patterns, state management, expo safety, navigation, practice flow, exam flow, anti-patterns, file organization, audio/video, handoff, commit-push
- 5 wiki entries for architecture, state, practice, exam, and session tracking

Key decisions:
- All skill content translated to English
- Commit messages must be in English with detailed body listing all changes
- handoff files excluded from commit messages
- Session rules added to AGENTS.md (before code, before handoff, before commit)
- Design tokens synced with frontend-v3 (`src/theme/colors.ts`)
- API contract follows Laravel backend-v2 conventions
- Auth uses expo-secure-store (not AsyncStorage)
- All API writes go through useMutation (global error handling)
- Route guards via useEffect, not render body
- No inline `.map()` for fixed UI sets — write explicit components
- Props ≤ 3, components ≤ 80 lines (route pages)

## 2026-04-27 — Mobile v2 parity, tooling, and support-flow fixes

Key decisions:
- Align exam draft persistence with backend using server draft autosave plus local file fallback.
- Replace forced active-session auto-resume on app launch with a visible resume/abandon flow inside the exams tab.
- Treat practice support as an unlock flow in UI state; writing keywords/sample answer, reading translation, and listening subtitles are now gated behind support actions instead of always visible.
- Upgrade `eslint` to v9 because `eslint-config-expo/flat` requires the flat-config runtime that breaks under the previous ESLint 8 setup.
- Keep notification tap behavior user-facing: unread items mark as read first, deletion moved to long press.
