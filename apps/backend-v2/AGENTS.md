# VSTEP Backend V2 — Agent Instructions

Ưu tiên code đúng, rõ, dễ bảo trì. Rules này là default mạnh; lệch default phải có lý do kỹ thuật rõ ràng.

Stack: PHP 8.4 · Laravel 13 · PostgreSQL · Redis · jwt-auth · Laravel Pint · Octane (FrankenPHP) · Laravel AI.

Commands: `php artisan serve` · `./vendor/bin/pint` · `php artisan test` · `php artisan migrate`.

## Architecture

- **Controller mỏng.** Validate (FormRequest) → delegate Service → return Resource. Không business logic.
- **Service đơn trách.** Mỗi service sở hữu một domain. Không cross-call trừ khi dependency rõ ràng.
- **Model chỉ chứa:** casts, relationships, scopes, accessors. Không business logic.
- **Enum chứa domain logic.** `next()`, `score()`, `fromScore()` — đặt trên enum, không trong service.
- **Dependency chảy xuống, không vòng.** `Controller → Service → Model`. Không đi ngược.

## Code

- **`declare(strict_types=1)` trong MỌI file PHP.** **[pint]**
- **Naming.** snake_case: DB columns, request/response fields, route params. PascalCase: class. camelCase: method/variable.
- **Không magic numbers.** Extract thành `const` hoặc enum.
- **Error handling.** Dùng Laravel exceptions (abort, ValidationException). Không try-catch chung chung.
- **Comments giải thích why, không what.** Nếu comment lặp lại code, xóa và rename.

## Laravel Patterns

- **Models extend `BaseModel`** (HasUuids + serializeDate ISO 8601 + $perPage = 20). User extends Authenticatable riêng.
- **Scopes dùng `#[Scope]` attribute.** Không pattern `scopeXxx` cũ.
- **Resources dùng `parent::toArray()`.** Dùng `whenLoaded()`, `whenCounted()`. Hide fields qua `#[Hidden]` trên model.
- **FormRequest validate.** Enum fields dùng `Rule::enum()`, không `'in:...'`.
- **Route model binding.** Không `string $id` + `findOrFail`.
- **`paginate()` không args.** BaseModel $perPage xử lý default.
- **`when()` cho conditional filters.** Không `if ($x = $params['x'] ?? null)`.

## Response

- **Resource single:** `{ "data": { ... } }` (auto-wrapped).
- **Resource collection:** `{ "data": [...], "links": {...}, "meta": { ... } }`.
- **Action success:** `response()->json(['data' => ['success' => true]])`.
- **snake_case everywhere.** FE transform nếu cần.

## Auth

- **JWT** via php-open-source-saver/jwt-auth. Refresh token hashed trong DB.
- **3 roles:** learner < instructor < admin (hierarchical, `Role::is()`).
- **Middleware:** `auth:api`, `role:admin`. Controller: `#[Authorize]` cho ownership.

## Operations

- **`./vendor/bin/pint` phải pass trước commit.**
- **Test behavior, không test line count.** New behavior + bugfix cần ít nhất một test.
- **No raw SQL.** Dùng Eloquent/Query Builder.
- **Hard delete với CASCADE.** Không soft deletes.
- **YAGNI.** Không code speculative. Chỉ viết khi có consumer thật.
