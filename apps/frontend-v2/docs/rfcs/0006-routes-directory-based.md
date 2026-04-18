# RFC 0006 — Routes: flat → directory-based

| Field | Value |
|---|---|
| Status | **Withdrawn** |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |
| Superseded by | RFC 0001 (Scout rule) |

## Status: Withdrawn

Sau khi đánh giá lại (2026-04-18), RFC này bị rút với các lý do:

1. **`routeTree.gen.ts` 1007 dòng không phải vấn đề.** File này auto-generated,
   `@ts-nocheck`, Biome ignore qua `!!**/*.gen.ts`, và `autoCodeSplitting: true`
   đã lazy-load mỗi route. Không ai đọc file này. Nest route cũng không giảm
   đáng kể kích thước (số route không đổi).

2. **Value thấp so với churn.** Rename 33 file routes, update mọi import path,
   đụng `routeTree.gen.ts` — rủi ro cao, giá trị chỉ là "tên file đẹp hơn".
   Autocomplete của editor đã handle tên dài.

3. **Conflict với RFC 0001 + RFC 0007.** Cùng touch file routes, gây double-touch,
   merge conflict, git blame phân mảnh.

4. **Không giải quyết pain thực sự.** Pain thực là:
   - File > 300 dòng (22 files) → xử lý qua RFC 0001 Scout rule
   - Hardcoded colors (29 files) → xử lý qua RFC 0007
   - `-components/` scattered → xử lý qua RFC 0001 (move vào `features/`)

5. **YAGNI.** Global rules trong AGENTS.md: "No speculative code". Flat naming
   hiện tại đang work, không block developer productivity đáng kể.

## Alternative đã chọn

- **RFC 0007** (Design Token Enforcement) — fix hardcoded colors parallel-safe
- **RFC 0001** (Architecture, rewritten incremental) — move feature khi touch

Khi RFC 0001 move `-components/` ra `features/`, `routes/` sẽ chỉ còn page files
compose — flat naming lúc đó càng ít painful.

## Resurrection criteria

Chỉ mở lại RFC này nếu:

- `routes/` tăng lên > 60 files cùng cấp
- Team report flat naming thực sự gây lỗi navigation (không phải "hơi khó đọc")
- TanStack Router update đổi convention

Đến lúc đó, reopen RFC hoặc tạo mới với evidence mới.
