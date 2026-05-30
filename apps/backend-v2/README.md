# VSTEP Backend V2

Laravel 13 API for the VSTEP exam practice platform. This app owns the API contract for learner, admin, mobile, and future teacher clients.

## Stack

- PHP 8.4
- Laravel 13
- PostgreSQL
- Redis + Horizon
- JWT auth
- Octane with FrankenPHP
- Laravel AI for grading workflows
- Cloudflare R2/S3-compatible audio storage

## Docker local setup

Recommended on Windows because it does not require local PHP or Composer.

```bash
docker compose -f docker-compose.dev.yml up -d --build backend
docker compose -f docker-compose.dev.yml logs -f backend
```

The compose file starts PostgreSQL, Redis, installs Composer dependencies, creates `.env` when missing, generates `APP_KEY`, runs migrations, seeds demo data, and starts Octane at `http://localhost:8000`.

Verify:

```bash
curl http://localhost:8000/api/v1/health
```

Run Horizon when queue jobs are needed:

```bash
docker compose -f docker-compose.dev.yml up -d horizon
```

Useful container commands:

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan route:list --path=api/v1
docker compose -f docker-compose.dev.yml exec backend php artisan test
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml down -v
```

Demo accounts seeded locally use password `password`:

- `learner@vstep.test`
- `learner2@vstep.test`
- `teacher@vstep.test`
- `staff@vstep.test`
- `admin@vstep.test`

## Local setup without Docker

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
composer run dev
```

The development server runs at `http://127.0.0.1:8000`.

## Common commands

```bash
php artisan serve
composer run dev
./vendor/bin/pint
php artisan test
php artisan migrate
php artisan route:list --path=api/v1
```

## API

All versioned endpoints are under `/api/v1`.

Main route groups:

- `GET /health` and `GET /config`
- Auth: register, login, refresh, logout, switch profile, me
- Profiles: CRUD, reset, onboarding
- Wallet: balance, transactions, topup, promo redeem
- Vocabulary: topics, SRS queue/review, exercises
- Grammar: points, exercises, mastery
- Practice: listening, reading, writing, speaking
- Exams: published exams, sessions, submit, results
- Grading: job status, writing/speaking results
- Audio: presigned upload/download URLs
- Progress: overview, streak, activity heatmap
- Courses: enrollment orders, enrollment confirmation, bookings
- Notifications
- Admin/staff: dashboard summaries and exam import

## Architecture

Use the project convention:

```text
Controller -> FormRequest -> Service -> Model -> Resource
```

Rules:

- Controllers stay thin.
- Services own business logic.
- Models contain casts, relationships, scopes, and accessors only.
- Enums hold domain behavior where appropriate.
- API fields and database columns use `snake_case`.
- All PHP files use `declare(strict_types=1)`.

## Quality gates

Run before committing backend changes:

```bash
./vendor/bin/pint
php artisan test
```

For route/API work, also verify:

```bash
php artisan route:list --path=api/v1
```

## Documentation

- Architecture overview: `docs/architecture-overview.md`
- Design decisions: `docs/design-decisions.md`
- RFC index: `docs/rfcs/README.md`
