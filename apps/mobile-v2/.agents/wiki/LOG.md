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
