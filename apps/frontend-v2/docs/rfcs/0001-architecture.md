# RFC 0001 — Package-by-Feature Architecture Migration

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |

## Summary

Tổ chức lại codebase từ layered (components + lib + routes) sang package-by-feature (Bulletproof React style). Mỗi feature được đọc kỹ logic, clean code, apply design tokens (RFC 0002) khi migrate.

## Target structure

```
src/
  app/
    main.tsx
    providers.tsx
    router.ts
    styles.css

  shared/
    ui/                     # shadcn primitives + Logo, SpeakerIcon, ChatGptIcon
    lib/                    # cn, utils
    hooks/                  # use-mobile
    config/                 # env, constants
    lib/srs/                # SRS algorithm (Anki port, dùng cho vocabulary + grammar)

  features/
    auth/
      components/
    landing/
      components/
      lib/
    notification/
      components/
      lib/
    coin/
      components/
      lib/
    streak/
      components/
      lib/
    onboarding/
      components/
      lib/
    ai-chat/
      components/
      hooks/
      lib/
    course/
      components/
      lib/
    overview/
      components/
    practice/
      components/           # shared: McqQuestionList, McqNavBar, AiGradingCard, SkillPageLayout...
      hooks/                # use-mcq-session, use-voice-recorder, use-support-mode
      lib/                  # dictation-diff, speak-sentence, result-storage
      skills/
        listening/
        reading/
        writing/
        speaking/
      foundation/
        vocabulary/
        grammar/
    exam/
      components/
      lib/

  mocks/                    # mock data (sẽ bỏ khi wire API)

  routes/                   # TanStack file routes — CHỈ compose, ≤ 80 dòng/file
```

## Import boundaries

```
routes         → features, shared
features/X     → features/X/*, shared
features/X     ↛ features/Y     (trừ qua index.ts public API)
shared         ↛ features
features → mocks               (tạm, sẽ thay bằng API)
```

## Path aliases (tsconfig)

```json
{
  "paths": {
    "#/*": ["./src/*"],
    "#/app/*": ["./src/app/*"],
    "#/shared/*": ["./src/shared/*"],
    "#/features/*": ["./src/features/*"],
    "#/mocks/*": ["./src/mocks/*"]
  }
}
```

## Naming

- Folder + code: English (`practice`, `exam`, `coin`)
- URL paths: tiếng Việt (`/luyen-tap`, `/thi-thu`)
- UI copy: tiếng Việt

## Public API

Mỗi feature có `index.ts` export public API. Import cross-feature qua `#/features/X`.
Không barrel trong `components/index.ts` hay `lib/index.ts`.

## Per-feature migration approach

Mỗi feature:

1. **Đọc** — hiểu logic, store, components, dependencies
2. **Review** — tailwind tokens (RFC 0002), code quality, JS patterns
3. **Clean** — fix hardcoded colors, split files > 300 dòng, remove dead code
4. **Move** — vào feature folder, update imports
5. **Verify** — `tsc --noEmit` + `biome check` + `pnpm build`

Không mechanical move. Mỗi file chỉ touch 1 lần.

## Client-side logic (giữ lâu dài)

Các module này giữ client-side, cần review kỹ khi migrate:

| Module | Thuộc feature | Ghi chú |
|---|---|---|
| use-mcq-session | practice/hooks | State machine MCQ flow |
| use-voice-recorder | practice/hooks | MediaRecorder API |
| use-support-mode | practice/hooks | Toggle UI mode |
| speak-sentence | practice/lib | Web Speech API |
| dictation-diff | practice/lib | Pure function |
| writing-linkers | practice/skills/writing | Static data |
| writing-structures | practice/skills/writing | Static data + helpers |
| writing-sample-markers | practice/skills/writing | SVG sticker logic |
| useConnectorGeometry | practice/skills/writing | SVG connector rendering |
| SRS (6 files) | shared/lib/srs | Anki algorithm, vocabulary + grammar dùng |

## API-bound logic (sẽ thay khi wire backend)

Các module này sẽ thay bằng API calls, chỉ cần tổ chức folder đúng:

- Tất cả stores (coin, streak, notification, enrollment, completion-log)
- Progress stores (listening/reading/writing/speaking-progress)
- Mock data (`src/mocks/`)
- Query files (`src/lib/queries/`)
- mock-ai-grading, mock-dictionary, mock-translate

## Migration order

| # | Scope | Status |
|---|---|---|
| 0 | Skeleton folders + tsconfig + biome clean | ⏳ |
| 1 | Shared layer (ui, lib, hooks, srs) + mocks | ⏳ |
| 2 | auth, landing | ⏳ |
| 3 | notification, coin, streak | ⏳ |
| 4 | onboarding, ai-chat | ⏳ |
| 5 | course, overview | ⏳ |
| 6 | practice (shared + 4 skills + foundation) | ⏳ |
| 7 | exam | ⏳ |
| 8 | Router cleanup + skill update + RFC close | ⏳ |

## Non-goals

- Không wire API
- Không thêm test
- Không đổi URL
- Không thêm feature mới
