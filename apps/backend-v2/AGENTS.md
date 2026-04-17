# VSTEP Backend V2 — Agent Instructions

Ưu tiên code đúng, rõ, dễ bảo trì. Lệch default phải có lý do kỹ thuật rõ ràng.

Stack: PHP 8.4 · Laravel 13 · PostgreSQL · Redis · jwt-auth · Pint · Octane (FrankenPHP) · Laravel AI.

Commands: `php artisan serve` · `./vendor/bin/pint` · `php artisan test` · `php artisan migrate`.

## Architecture

- **Controller mỏng.** FormRequest → Service → Resource. Không business logic.
- **Service đơn trách.** Mỗi service sở hữu một domain. Không cross-call trừ dependency rõ ràng.
- **Model chỉ chứa:** casts, relationships, scopes, accessors.
- **Enum chứa domain logic.** `next()`, `score()`, `fromScore()` đặt trên enum.
- **Dependency chảy xuống.** Controller → Service → Model. Không vòng.

## Code

- **`declare(strict_types=1)` mọi file.** [pint]
- **Naming.** snake_case: DB, API fields. PascalCase: class. camelCase: method/variable.
- **Không magic numbers.** Extract thành const hoặc enum.
- **Error handling.** Laravel exceptions (abort, ValidationException). Không try-catch chung.
- **Comments giải thích why, không what.**

## Operations

- **`./vendor/bin/pint` pass trước commit.**
- **Test behavior, không line count.** New behavior + bugfix cần ít nhất một test.
- **No raw SQL.** Eloquent/Query Builder.
- **Hard delete + CASCADE.** Không soft deletes.
- **YAGNI.** Chỉ viết khi có consumer thật.
