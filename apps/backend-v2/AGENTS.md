# VSTEP Backend V2

VSTEP exam practice platform — Laravel 13 REST API.

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
  Enums/              # PHP backed enums for ALL fixed values
  Http/
    Controllers/Api/V1/   # Thin controllers — delegate to services, return Resources
    Middleware/            # CheckRole
    Requests/             # FormRequest validation (snake_case fields)
    Resources/            # API Resources — flat JsonResource, use parent::toArray()
  Models/             # Eloquent models extending BaseModel
  Policies/           # Authorization policies (ownership checks)
  Services/           # Business logic — one service per domain, single responsibility
database/
  migrations/         # Chronological migrations
  seeders/            # Data seeders
routes/
  api.php             # All API routes, prefixed /v1
```

### Service boundaries

| Service | Owns | Does NOT do |
|---------|------|-------------|
| `ExamService` | Exam CRUD | Session lifecycle |
| `SessionService` | Session start/answer/submit, grading | Exam CRUD |
| `SubmissionService` | Submission create/grade, auto-grade | Question selection |
| `PracticeService` | Adaptive question selection | Submission creation, grading |
| `ProgressService` | Progress reads, goals CRUD, `applySubmission()` | Submission/session logic |
| `OnboardingService` | Onboarding flows (self-assess/placement/skip) | Exam/session internals |
| `VocabularyService` | Topics, words, known tracking | — |
| `UserService` | Profile update, password change | Auth |
| `AuthService` | Register, login, refresh, logout | Profile management |
| `NotificationService` | Notification list/read | — |
| `DeviceService` | Device registration | — |

## Laravel 13 Patterns — MUST follow

### Models — extend BaseModel

All models extend `App\Models\BaseModel` (except User which extends Authenticatable).
BaseModel provides: `HasUuids` + `serializeDate()` (ISO 8601) + `$perPage = 20`.

```php
use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Fillable(['title', 'level', 'type'])]
#[Hidden(['secret_field'])]
class Exam extends BaseModel
{
    protected function casts(): array
    {
        return [
            'level' => Level::class,   // Always cast enums
            'type' => ExamType::class,
            'is_active' => 'boolean',
        ];
    }

    // Relationships, scopes, accessors only. No business logic.
}
```

**User model** — extends Authenticatable, has own `serializeDate()` + `HasUuids`.

### Scopes — `#[Scope]` attribute

```php
#[Scope]
protected function active(Builder $query): void
{
    $query->where('is_active', true);
}
```

Do NOT use the old `scopeXxx` prefix pattern.

### API Resources — flat, use parent::toArray()

Model handles serialization via `serializeDate()`, enum casts, `#[Hidden]`.

```php
// Simple — delegate entirely to model
class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }
}

// With additions — use whenLoaded/whenCounted
class VocabularyTopicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'word_count' => $this->whenCounted('words'),
        ];
    }
}
```

- Do NOT manually list every field — `parent::toArray()` is the default
- Do NOT call `->toISOString()` or `->value` — model handles it
- Use `whenCounted()` for counts, `whenLoaded()` for relations
- Hide internal fields via `#[Hidden]` on model — REQUIRED for every model
- Contextual hiding (e.g. answer_key for learners): `makeHidden()` in service before wrapping in Resource
- Computed/derived fields (e.g. days_remaining): add in Resource via `...parent::toArray()` spread
- Never return raw Eloquent models from controllers — always wrap in Resource

### Enums — domain logic belongs on enums

```php
enum Level: string
{
    case A2 = 'A2';
    case B1 = 'B1';
    case B2 = 'B2';
    case C1 = 'C1';

    public function next(): ?self { /* ... */ }
    public function prev(): ?self { /* ... */ }
    public function score(): int { /* A2=1, B1=2, B2=3, C1=4 */ }
    public static function fromScore(?float $score): self { /* ... */ }
}
```

- Cast in model, validate with `Rule::enum()`
- Put domain methods on the enum (`next()`, `score()`, `fromScore()`) — NOT in services
- Every fixed value MUST be an enum: `Level`, `Skill`, `Role`, `VstepBand`, `ExamType`, `SessionStatus`, `SubmissionStatus`, `StreakDirection`, `PlacementSource`, `Confidence`, `NotificationType`, `Platform`, `KnowledgePointCategory`
- Never pass raw strings for enum values between methods

### Controllers — thin, typed extraction

```php
class SessionController extends Controller
{
    public function __construct(
        private readonly SessionService $service,
    ) {}

    public function index(Request $request)
    {
        return ExamSessionResource::collection(
            $this->service->list($request->user()->id, $request->query('status')),
        );
    }

    #[Authorize('view', 'session')]
    public function show(ExamSession $session)
    {
        $session->load('answers.question');
        return new ExamSessionResource($session);
    }
}
```

- Use `$request->query('key')`, `$request->boolean('key')`, `$request->only([...])` — NOT `$request->query()` raw dump
- Use `#[Authorize('ability', 'routeParam')]` — NOT `Gate::authorize()`
- Use route model binding — NOT `string $id` + findOrFail
- Return Resource directly — NOT `response()->json(['data' => ...])`
- Exception: aggregate/non-model endpoints use `response()->json(['data' => ...])`

### Services — typed params, `when()`, `paginate()`

```php
class ExamService
{
    // List — use when() for conditional filters, paginate() without args
    public function list(array $filters = [], bool $adminView = false): LengthAwarePaginator
    {
        return Exam::query()
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($filters['level'] ?? null, fn ($q, $v) => $q->where('level', $v))
            ->when(! $adminView, fn ($q) => $q->active())
            ->orderByDesc('created_at')
            ->paginate();   // Uses BaseModel::$perPage = 20
    }

    // Create — spread validated data, model #[Fillable] filters
    public function create(array $data, string $userId): Exam
    {
        return Exam::create([...$data, 'created_by' => $userId]);
    }
}
```

- `paginate()` without args — `BaseModel::$perPage = 20` handles default
- `when()` for conditional filters — NOT `if ($x = $params['x'] ?? null)`
- Trust `$request->validated()` data — do NOT `$data['field'] ?? null` on validated input
- Spread validated data into `Model::create()` — do NOT remap field by field
- Accept Models from route model binding — NOT string IDs
- Use `$request->only([...])` in controller for filters — NOT raw `$request->query()`
- Return Models/collections — never arrays with presentation logic

### Service naming — consistent verbs

| Pattern | Methods |
|---------|---------|
| CRUD | `list`, `show`, `create`, `update`, `delete` |
| Domain actions | descriptive verb: `submit`, `grade`, `start`, `markRead`, `toggleKnown` |

No model prefix on methods — class name provides context (`ExamService::create()` not `createExam()`).

### Form Requests — Rule::enum()

```php
public function rules(): array
{
    return [
        'target_band' => ['required', 'string', Rule::enum(VstepBand::class)],
    ];
}
```

Do NOT use `'in:B1,B2,C1'` for enum fields.

### Policies — ownership checks

```php
class ExamSessionPolicy
{
    public function view(User $user, ExamSession $session): bool
    {
        return $user->id === $session->user_id;
    }
}
```

One policy per model that needs ownership. Laravel auto-discovers via naming convention.

## Response Format

- **Resource single:** `{ "data": { ... } }` (auto-wrapped by JsonResource)
- **Resource collection:** `{ "data": [...], "links": {...}, "meta": { ... } }` (auto by paginate)
- **Action success:** `response()->json(['data' => ['success' => true]])`
- **Aggregate data:** `response()->json(['data' => [...custom...]])`
- **Errors:** auto by Laravel (validation 422, not found 404)

## snake_case Everywhere

- Request body, response body, DB columns — all snake_case
- No camelCase in API. FE transforms if needed.

## Auth

- JWT via php-open-source-saver/jwt-auth
- 3 roles: learner < instructor < admin (hierarchical, see `Role::is()`)
- Route middleware: `auth:api`, `role:admin`
- Controller-level: `#[Authorize]` attribute for ownership

## Strictness

- `Model::shouldBeStrict()` enabled in dev
- `declare(strict_types=1)` in ALL PHP files
- `./vendor/bin/pint` must pass before commit

## Rules

- No raw SQL — use Eloquent/Query Builder
- Never return password or sensitive fields (`#[Hidden]` handles this)
- YAGNI — no speculative code
- Hard delete with CASCADE. No soft deletes.
- No `console.log` — use `Log` facade if needed
- No raw strings for fixed values — use enums
- No `??` on validated data — FormRequest already handles nullability
- No hardcoded defaults in services — use model `$perPage`, enum defaults
