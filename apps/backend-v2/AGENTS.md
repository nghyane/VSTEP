# VSTEP Backend V2

VSTEP exam practice platform — Laravel REST API.

## Stack

PHP 8.4 · Laravel 13 · PostgreSQL · Redis · php-open-source-saver/jwt-auth · Laravel Pint

## Commands

- **Dev:** `php artisan serve`
- **Lint:** `./vendor/bin/pint`
- **Test:** `php artisan test`
- **Migrate:** `php artisan migrate`
- **Seed:** `php artisan db:seed`

## Architecture

```
app/
  Enums/              # PHP enums (Role, Skill, etc.)
  Http/
    Controllers/Api/V1/   # API controllers, thin — delegate to services
    Middleware/            # CheckRole, etc.
    Requests/             # Form Request validation
    Resources/            # API Resources (response transformation)
  Models/             # Eloquent models
  Services/           # Business logic — plain classes, one per domain
  Jobs/               # Queue jobs (grading dispatch, etc.)
database/
  migrations/         # Chronological migrations
  seeders/            # Data seeders
routes/
  api.php             # All API routes, prefixed /v1
```

## Conventions

### Controllers
- Namespace: `App\Http\Controllers\Api\V1`
- One controller per resource. Thin — validate via FormRequest, delegate to Service, return Resource.
- Use `apiResource` routes when possible.

### Services
- Plain classes in `App\Services\`. Constructor-injected via container.
- All business logic lives here. Controllers never query DB directly.
- Use DB::transaction() for multi-step mutations.

### Models
- UUIDs as primary key (HasUuids trait).
- Define `$fillable`, `casts()`, and relationships.
- No business logic in models — only scopes, accessors, relationships.

### Form Requests
- One per action: `StoreExamRequest`, `UpdateExamRequest`.
- `authorize()` returns true (auth handled by middleware) or checks ownership.
- Rules in `rules()` method.

### API Resources
- Transform Eloquent models to JSON response shape.
- Frontend expects camelCase keys — use Resource to transform snake_case.
- Wrap collections: `ExamResource::collection($exams)`.

### Auth
- JWT via php-open-source-saver/jwt-auth.
- 3 roles: learner < instructor < admin (hierarchical).
- Middleware: `auth:api` for authenticated, `role:admin` for role check.
- Custom claims include `role`.

### Routes
```php
Route::middleware('auth:api')->group(function () {
    Route::apiResource('exams', ExamController::class);
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});
```

### Naming
- Models: PascalCase singular (`Exam`, `User`)
- Controllers: PascalCase + Controller (`ExamController`)
- Migrations: snake_case (`create_exams_table`)
- DB columns: snake_case (`full_name`, `created_at`)
- JSON response: camelCase (transformed by Resources)

### Response Format
- Success: `{ "data": ... }` or `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`
- Error: `{ "message": "...", "errors": { ... } }`

### Rules
- No `console.log` equivalent — use `Log` facade if needed.
- No raw SQL — use Eloquent/Query Builder.
- Never return `password` or sensitive fields in responses.
- YAGNI — no speculative code.
- Hard delete with CASCADE. No soft deletes.
