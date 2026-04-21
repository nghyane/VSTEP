---
name: backend-integration
description: "Rules for modifying backend (apps/backend-v2) from FE context. Load when adding or changing API endpoints."
---

# Backend Integration

1. Read `apps/backend-v2/AGENTS.md` before writing code
2. Grep `routes/api.php` for existing endpoints
3. Grep `app/Services/` for related service — logic goes in service, not controller
4. Run `./vendor/bin/pint --dirty` after changes
