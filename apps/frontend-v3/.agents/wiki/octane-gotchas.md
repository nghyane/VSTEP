# Octane Gotchas (FrankenPHP)

## Problem

Backend container runs **Laravel Octane with FrankenPHP**. Octane boots the app once and keeps it in memory across requests (`--workers=auto --max-requests=500`). Source files are mounted via Docker volume, so edits on host are visible on disk inside the container — but Octane's workers still serve the OLD code from memory.

## Symptoms

- API returns stale response shape (old fields present, new fields missing)
- `php artisan tinker` shows correct behavior (boots fresh app)
- `php -r "require bootstrap..."` kernel test works (fresh boot)
- `curl http://localhost:8000/...` returns stale data (Octane worker)

## Fix

```bash
docker restart vstep-backend-1
```

Wait ~15s for migrations + seeders to run before testing.

## Why not `php artisan octane:reload`?

Octane reload sends SIGUSR1 to workers, which works for simple file changes. But if you've changed service providers, config, or routes, a full restart is safer. Since our dev container also runs seeders on boot, restart is the canonical approach.

## Rule

After ANY backend code change (controller, service, model, resource, middleware), restart the container before testing via browser or curl.
