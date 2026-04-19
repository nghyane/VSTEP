---
name: file-organization
description: "Folder structure, type placement, naming conventions, export rules. Load when creating new features or files."
---

# File Organization

- Feature folder: `src/features/{name}/` with components/, queries.ts, types.ts
- Shared utils: `src/lib/` — shared types: `src/types/`
- Colocate types first, promote to `types/` when shared cross-feature
- Named exports only. No default exports (except route components). No barrel files.
- Reference: `src/features/dashboard/` as canonical example
