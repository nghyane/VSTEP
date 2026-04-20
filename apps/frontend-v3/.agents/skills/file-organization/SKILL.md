---
name: file-organization
description: >
  Where files go and how they are named. Load before creating any new file,
  folder, feature module, or route — or when deciding where to put a type,
  component, or utility.
---

# File Organization

- Feature folder: `src/features/{name}/` with components/, queries.ts, types.ts
- Shared utils: `src/lib/` — shared types: `src/types/`
- Colocate types first, promote to `types/` when shared cross-feature
- Named exports only. No default exports (except route components). No barrel files.
- Reference: `src/features/dashboard/` as canonical example
