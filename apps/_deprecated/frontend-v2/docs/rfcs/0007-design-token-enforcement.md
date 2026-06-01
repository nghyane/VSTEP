# RFC 0007 — Design Token Enforcement

| Field | Value |
|---|---|
| Status | **Withdrawn** |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |
| Superseded by | RFC 0002 v2 (design system rewrite) |

## Status: Withdrawn

Rút sau lần thử implement Scope A (Thi-thu):

### Lý do

1. **Sai thứ tự.** Token enforcement giả định "visual spec đã chốt, chỉ cần map sang
   tokens". Thực tế visual spec chưa đủ cụ thể → mỗi lần swap hue (rose → destructive)
   là một visual decision, không phải mechanical swap.

2. **RFC 0002 v1 quá ngắn.** Chỉ có mapping table + forbidden list. Không có
   component-level spec → agent không thể enforce tự động vì thiếu ground truth
   per-component.

3. **User reject Scope A.** Sau khi implement, user phản hồi "đã vi phạm nguyên tắc
   refactor visual sau". Đúng — fix "pure token swap" thực tế vẫn đổi visual vì:
   - `rose-*` → `destructive` = hue khác (rose vs red)
   - `emerald-*` → `success` = hue khác
   - ExamCard gradient shadow bỏ → visual change rõ rệt
   - `rounded-3xl` → `rounded-2xl` = hình dáng khác
   - `text-[11px]` → `text-xs` = 1px khác

   Chỉ `bg-white` → `bg-card` và `border-slate-200` → `border-border` là gần như zero
   visual change (light mode). Còn lại đều là design decision.

4. **AI agent không có mắt.** Không distinguish "token swap pure" vs "visual change
   disguised as token". Cần user review từng fix → không scale cho 29 files.

## Alternative đã chọn

**RFC 0002 v2** (rewritten) — spec visual chi tiết per-component:
- Trước khi touch code, user approve Phase A (design approval)
- Component có status ⚠️ → Phase B mechanical token swap (thật sự zero visual)
- Component có status ❌ → Phase C redesign (có screenshot before/after, PR riêng)
- Phase D — CI guard script + skill sync

Xem `docs/rfcs/0002-design-system.md` phần "Current state audit" và "Migration plan".

## Lessons learned

1. **Không enforce trước khi approve visual.** Visual spec phải đủ chi tiết, user
   approve, rồi mới enforce.
2. **Token swap không phải mechanical.** Phần lớn token swap đổi hue → cần design
   decision.
3. **Per-component spec > mapping table.** Mapping `rose-* → destructive` không nói
   hết ngữ cảnh. Phải có "CostBadge insufficient state dùng destructive" cụ thể.
4. **User review từng scope tốn thời gian.** Chia nhỏ hơn: "Phase B zero visual
   change" vs "Phase C redesign có approval" → rõ hơn cho cả user và agent.

## Không resurrect

RFC này không mở lại. Phần enforcement được absorb vào RFC 0002 v2 Phase D (CI guard
script). Phần migration absorb vào RFC 0002 v2 Phase B/C.
