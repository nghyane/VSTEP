---
name: commit-push
description: "Git commit message conventions (ENGLISH), branch rules, push workflow. MANDATORY to read before commit/push. Commit message must list ALL changes in body. DO NOT commit handoff files."
---

# Git Commit & Push Rules

## Commit Message Format

**MANDATORY** use Conventional Commits format — **ENGLISH ONLY**:

```
<type>: <subject>

<body: detailed list of ALL changes>

[optional footer(s)]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting (whitespace, semicolons) — NO logic change |
| `refactor` | Code restructuring — NO new feature, NO bug fix |
| `test` | Add or fix tests |
| `perf` | Performance improvement |
| `chore` | Build process, tooling, dependencies |
| `ci` | Continuous Integration changes |
| `build` | Build system changes |
| `revert` | Revert a previous commit |

### Subject Rules

1. **ENGLISH only** — no Vietnamese in subject line
2. **Lowercase** first letter after type (feat: add..., not feat: Add...)
3. **No period** at end of subject
4. **≤ 72 characters** — keep it concise
5. **Specific** — no vague words like "update", "fix stuff", "changes"
6. **Imperative mood** — "add", "fix", "remove" (not "added", "fixed", "removes")

### Body Rules (MANDATORY — not optional)

**MUST list ALL changes made**, using bullet points:

- Each changed file → 1 line description
- Group by category: files created, files modified, files deleted
- Use imperative mood: "add", "update", "fix", "remove", "rename"
- Clear format, easy to read
- **EXCLUDE** handoff/session files (`.agents/skills/handoff/`, `HANDOFF.md`) — these are not code changes and should not clutter commits

### Footer (optional)

- `Refs: #123` — reference issue/PR
- `BREAKING CHANGE:` — if breaking change

---

### Examples

**✅ Correct:**
```
feat: add .agents skills and session rules for mobile-v2

Files created:
- .agents/skills/mobile-learner-flow/SKILL.md — end-to-end learner flow documentation
- .agents/skills/mobile-ui-patterns/SKILL.md — design tokens, components guide
- .agents/skills/mobile-state-patterns/SKILL.md — TanStack Query, useReducer, Zustand patterns
- .agents/skills/mobile-expo-safety/SKILL.md — Expo-specific rules, build checks, common pitfalls
- .agents/skills/mobile-navigation/SKILL.md — Expo Router patterns, tab/stack/modal config
- .agents/skills/mobile-practice-flow/SKILL.md — practice implementation for 4 skills
- .agents/skills/mobile-exam-flow/SKILL.md — exam session flow, device check, timer, grading
- .agents/skills/mobile-audio-video/SKILL.md — expo-av, expo-speech, permission handling
- .agents/skills/mobile-file-organization/SKILL.md — folder structure, naming conventions
- .agents/skills/mobile-anti-patterns/SKILL.md — common mistakes to avoid
- .agents/wiki/app-shell.md — navigation architecture documentation
- .agents/wiki/state-patterns.md — deep dive state management
- .agents/wiki/practice-implementation.md — practice guide
- .agents/wiki/exam-implementation.md — exam guide
- .agents/wiki/LOG.md — session tracking file

Files modified:
- AGENTS.md — added mandatory session rules (before code, before handoff, before commit)
```

```
fix: resolve audio playback crash on iOS exam screen

Files modified:
- app/(app)/session/[id].tsx — replace native <audio controls> with custom expo-av player
- src/hooks/use-audio-player.ts — add play-once logic, disable seek during exam mode
- src/components/CustomAudioPlayer.tsx — new component: progress bar, play/pause, disabled state

Changes:
- Audio now plays once only per VSTEP exam rules
- Custom progress bar replaces native controls
- Seek disabled during exam mode
- 3-second countdown before auto-play starts
```

```
refactor: convert auth state from boolean to discriminated union

Files modified:
- src/hooks/use-auth.ts — replace boolean state with AuthStatus discriminated union
- app/_layout.tsx — update route guards to use new auth state shape
- src/lib/auth.ts — add explicit idle/authenticated/unauthenticated states

Files created:
- src/types/auth.ts — AuthState type definition

Changes:
- Auth state now explicitly typed: idle | authenticated | unauthenticated
- Route guards wait for authoritative refresh result
- No more null/boolean ambiguity in auth context
```

**❌ Incorrect:**
```
Update code                                    ← vague, no body, no type
Fixed some bugs                                ← vague, no body
feat: add listening screen                     ← no body listing changes
fix: sửa lỗi audio không phát                  ← subject not in English
feat: Add listening screen with custom player  ← subject has uppercase
```

---

## Branch Rules

### Naming

```
<type>/<short-description>
```

**Examples:**
- `feat/listening-practice`
- `fix/audio-playback-ios`
- `docs/handoff-update`
- `refactor/auth-state`

### Protected Branches

- `main` — production code, **NO force-push**
- `mobile` — development branch for mobile-v2

### Workflow

1. Create branch from `main` or `mobile` (depending on task)
2. Code → commit → push branch
3. Merge into `mobile` (development)
4. When stable → merge `mobile` into `main`

**Rule:** `git pull --no-rebase` (merge) — **NO rebase** unless explicitly requested.

---

## Pre-commit Checklist

BEFORE committing:

- [ ] `bun run typecheck` — PASS
- [ ] `bun run lint` — PASS
- [ ] No `console.log` in production code
- [ ] No `any` types
- [ ] No commented-out code
- [ ] Commit message in ENGLISH, Conventional Commits format
- [ ] Body lists ALL changed files with descriptions
- [ ] **Handoff files NOT included** (`.agents/skills/handoff/`, `HANDOFF.md`)
- [ ] Only stage files related to current task
- [ ] Test navigation flow (if routes changed)
- [ ] Test API calls (if data layer changed)

---

## Git Commands

### Commit
```bash
# Stage only files related to task
git add apps/mobile-v2/path/to/file.tsx

# Commit with full message
git commit -m "feat: add handoff and commit-push skills

Files created:
- .agents/skills/commit-push/SKILL.md — git conventions, commit message format, branch rules

Files modified:
- AGENTS.md — added session rules (before code, before handoff, before commit)"
```

### Push
```bash
# Push branch to remote
git push -u origin <branch-name>

# Push new commits
git push
```

### Pull (merge, not rebase)
```bash
git pull --no-rebase
```

### Undo (careful)
```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Discard changes in working directory
git checkout -- <file>

# Discard ALL changes (extreme caution)
git checkout -- .
```

**Rule:** NEVER use `git reset --hard` or `git checkout -- .` unless user explicitly requests.

---

## Post-commit Rules

1. **NEVER commit untested code** — at minimum run typecheck + lint
2. **NEVER commit directly to main** — through PR or merge from mobile
3. **Update HANDOFF.md** if significant progress made (this file is NOT committed — it tracks session state locally)
4. **Update LOG.md** in `.agents/wiki/` if important decision made
5. **NEVER force-push** to shared branches
