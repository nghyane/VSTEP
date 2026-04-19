# Skill: Backend Integration

Khi sửa backend (`apps/backend-v2`) từ context FE:

## Bắt buộc đọc trước

1. `apps/backend-v2/AGENTS.md` — architecture rules
2. Route file `routes/api.php` — endpoint hiện có
3. Service liên quan — grep `app/Services/`

## Backend architecture (từ AGENTS.md)

- **Controller mỏng.** FormRequest → Service → Resource. Không business logic trong controller.
- **Service đơn trách.** Mỗi service sở hữu 1 domain. Không cross-call trừ dependency rõ ràng.
- **Model chỉ chứa:** casts, relationships, scopes, accessors.
- **Dependency chảy xuống.** Controller → Service → Model. Không vòng.

## Checklist khi thêm endpoint

1. Route trong `routes/api.php` — đúng middleware group
2. Controller method — chỉ validate + delegate + return response
3. Business logic trong Service — query, compute, transform
4. `./vendor/bin/pint --dirty` pass
5. Response shape: `{ "data": ... }` theo Laravel convention

## Không được

- Business logic trong Controller (query, compute, if/else phức tạp)
- Raw SQL — dùng Eloquent/Query Builder
- Magic numbers — extract const hoặc SystemConfig
- Try-catch chung — dùng Laravel exceptions
