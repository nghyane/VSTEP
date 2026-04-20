---
name: backend-integration
description: >
  Rules for touching the Laravel backend from this frontend repo. Load before
  adding, changing, or removing any API endpoint, route, controller, or service
  in apps/backend-v2.
---

# Backend Integration

1. Read `apps/backend-v2/AGENTS.md` before writing code
2. Grep `routes/api.php` for existing endpoints
3. Grep `app/Services/` for related service — logic goes in service, not controller
4. Run `./vendor/bin/pint --dirty` after changes
