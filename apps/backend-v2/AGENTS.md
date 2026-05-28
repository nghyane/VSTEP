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
- **Không silent fallback.** Lỗi phải throw ra, không âm thầm dùng default.
  - ❌ `(float) ($data['coverage_multiplier'] ?? 7)` — admin sai param → dùng 7, không ai biết bug.
  - ✅ `(float) $data['coverage_multiplier']` + validate thiếu key → `InvalidArgumentException` ngay khi boot/test.
  - ❌ `try { $llm->assess() } catch {} return 1.0` — LLM lỗi → điểm tối đa, học sinh DDoS AI server.
  - ✅ Throw exception → queue retry → job fail → admin thấy lỗi.
  - Pattern: DTO `fromArray()` dùng `self::REQUIRED` + `array_diff()` để validate.
- **Error handling.** Laravel exceptions (abort, ValidationException). Không try-catch chung.
- **Comments giải thích why, không what.**

## Operations

- **`./vendor/bin/pint` pass trước commit.**
- **Test behavior, không line count.** New behavior + bugfix cần ít nhất một test.
- **`php artisan test` trong container = WIPE DB DEV.** Container env `DB_DATABASE=vstep` (từ docker-compose) load vào `$_SERVER` trước PHP start. **`phpunit.xml force="true"` KHÔNG override được container env** vì Laravel ưu tiên server vars. `RefreshDatabase` chạy trên `vstep` thật → wipe sạch. Cách đúng: chạy ngoài container hoặc override CLI: `docker exec -e DB_DATABASE=vstep_test vstep-backend-1 php artisan test` (cần DB `vstep_test` đã tạo + migrate). Thấy ai đó chạy test trên dev DB → STOP.
- **No raw SQL.** Eloquent/Query Builder.
- **Hard delete + CASCADE.** Không soft deletes.
- **YAGNI.** Chỉ viết khi có consumer thật.
