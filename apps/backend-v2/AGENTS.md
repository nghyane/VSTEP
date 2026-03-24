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
  Enums/              # PHP enums (Role, Skill, Level, ExamType, SessionStatus, SubmissionStatus, KnowledgePointCategory)
  Http/
    Controllers/Api/V1/   # Thin controllers — delegate to services, return Resources
    Middleware/            # CheckRole
    Requests/             # FormRequest validation (snake_case fields)
    Resources/            # API Resources (snake_case output)
  Models/             # Eloquent models with #[Fillable], #[Hidden] attributes
  Services/           # Business logic — plain classes, one per domain
  Support/            # Helpers
database/
  migrations/         # Chronological migrations
  seeders/            # Data seeders
routes/
  api.php             # All API routes, prefixed /v1
```

## Conventions

### snake_case everywhere
- **Request body:** `{ "full_name": "...", "answer_key": {...} }`
- **Response body:** `{ "full_name": "...", "created_at": "..." }`
- **DB columns:** `full_name`, `created_at`, `is_active`
- **No camelCase in API.** FE transforms with `camelizeKeys()` if needed.

### Response format
- Success single: `{ "data": { ... } }`
- Success collection: `{ "data": [...], "links": {...}, "meta": { "current_page", "per_page", "total", "last_page" } }`
- Success action: `{ "data": { "success": true } }`
- Error validation: `{ "message": "...", "errors": { "field": ["..."] } }`
- Error auth: `{ "message": "Unauthenticated." }`

### Controllers
- Namespace: `App\Http\Controllers\Api\V1`
- Use route model binding for CRUD: `show(Exam $exam)`
- Thin — validate via FormRequest, delegate to Service, return Resource.

### Services
- Plain classes in `App\Services\`. Injected via constructor.
- All business logic lives here. Controllers never query DB directly.
- Return Models/collections, never Resources or arrays with presentation logic.
- Use `DB::transaction()` for multi-step mutations.
- Since request keys = DB columns (both snake_case), use `...$data` spread for create, `$model->update($data)` for update.

### Models
- UUIDs as primary key (HasUuids trait).
- Use PHP Attributes: `#[Fillable([...])]`, `#[Hidden([...])]`.
- Cast enums: `'skill' => Skill::class`, `'status' => SessionStatus::class`.
- No business logic in models — only scopes, accessors, relationships.

### Form Requests
- snake_case field names matching DB columns.
- Use `Rule::enum(Skill::class)` for enum validation.
- `authorize()` returns true (auth handled by middleware).

### API Resources
- Transform Model → JSON response (snake_case, same as DB).
- Computed fields (e.g. `days_remaining` on GoalResource).
- `whenLoaded()` for conditional relationships.

### Auth
- JWT via php-open-source-saver/jwt-auth.
- 3 roles: learner < instructor < admin (hierarchical).
- Middleware: `auth:api` for authenticated, `role:admin` for role check.
- Rate limiting on auth endpoints: `throttle:10,1`.

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
- Enums: PascalCase (`Skill`, `Level`, `SessionStatus`)
- Migrations: snake_case (`create_exams_table`)
- DB columns: snake_case
- JSON request/response: snake_case
- PHP variables: camelCase (internal only)

### Rules
- No `console.log` equivalent — use `Log` facade if needed.
- No raw SQL — use Eloquent/Query Builder.
- Never return `password` or sensitive fields in responses.
- YAGNI — no speculative code.
- Hard delete with CASCADE. No soft deletes.
- Use PHP Enums for all fixed-value fields. Compare with enum, not strings.
- `Model::preventLazyLoading()` enabled in dev.
