# Adaptive Scaffolding Specification (Practice Mode)

> **Phiên bản**: 1.0 · SP26SE145

## 1. Purpose

Định nghĩa cơ chế adaptive scaffolding trong Practice Mode để điều chỉnh mức hỗ trợ theo năng lực thực tế của user. Spec này mô tả **stages, luật chuyển stage, dữ liệu lưu trữ, và tiêu chí chấp nhận**.

## 2. Scope

- Áp dụng cho:
  - Writing practice (Template → Keywords → Free)
  - Listening practice (Full Text → Highlights → Pure Audio)
- Tính toán theo từng user và từng skill (mỗi skill một `user_progress` record).
- Sử dụng lịch sử attempts gần đây (tối thiểu 3 attempts) để quyết định lên/xuống stage.

## 3. Definitions

- **Stage**: mức hỗ trợ hiện tại cho một skill.
- **Attempt score**: score của submission (0-10) quy đổi ra percent `scorePct = score * 10` (0-100).
- **History window**: tối đa 3 attempts gần nhất (mới nhất trước) dùng để quyết định stage.

## 4. Writing Scaffolding

### 4.1 Stage definitions

- **Stage 1: Template**: cung cấp template/khung bài, sentence starters, connectors, checklist format.
- **Stage 2: Keywords**: cung cấp key phrases, transitions, từ vựng chủ đề; giảm template cứng.
- **Stage 3: Free**: không scaffold mặc định; chỉ có micro-hints theo yêu cầu.

### 4.2 Initial stage assignment

Dựa trên `currentLevel` (per skill):
- A1-A2 → Stage 1
- B1 → Stage 2
- B2-C1 → Stage 3

### 4.3 Progression rules (theo `../../diagrams/flow-diagrams.vi.md`)

Tính `avg3` = trung bình `scorePct` của 3 attempts gần nhất.

- **Stage 1 (Template)**
  - Level up → Stage 2 nếu `avg3 >= 80`.
  - Không level down dưới Stage 1.
  - Nếu `avg3 < 50` trong 2 attempts liên tiếp: giữ Stage 1 và bật thêm micro-hints mặc định.

- **Stage 2 (Keywords)**
  - Level up → Stage 3 nếu `avg3 >= 75`.
  - Level down → Stage 1 nếu `avg3 < 60` trong 2 attempts liên tiếp.
  - Giữ Stage 2 nếu trong [60, 75).

- **Stage 3 (Free)**
  - Duy trì Stage 3 nếu `avg3 >= 70` (tăng độ khó/giảm hint, không đổi stage).
  - Level down → Stage 2 nếu `avg3 < 65` trong 2 attempts liên tiếp.

### 4.4 Micro-scaffolding

- User có thể yêu cầu hint theo nhu cầu (structure hint, vocabulary hint, connector hint).
- Hint usage phải được log để tránh "level up" khi user dựa quá nhiều vào hints.
- Rule tối thiểu: nếu hint usage > 50% attempts trong window 3 bài, không level up.

## 5. Listening Scaffolding

### 5.1 Stage definitions

- **Stage 1: Full Text**: transcript đầy đủ, user vừa nghe vừa đọc.
- **Stage 2: Highlights**: chỉ highlight key phrases, transcript không đầy đủ.
- **Stage 3: Pure Audio**: chỉ audio, không transcript.

### 5.2 Initial stage assignment

- A1-A2 → Stage 1
- B1 → Stage 2
- B2-C1 → Stage 3

### 5.3 Progression rules

Sử dụng `accuracyPct` (0-100) cho 3 attempts gần nhất.

- Level up (giảm scaffold) nếu `avg3 >= 80`.
- Giữ stage nếu `avg3` trong [50, 80).
- Level down (tăng scaffold) nếu `avg3 < 50` trong 2 attempts liên tiếp.

Stage transitions:
- Stage 1 ↔ Stage 2 ↔ Stage 3 (chỉ chuyển 1 bậc mỗi lần).

## 6. Data Storage

- `user_progress.scaffold_level`: integer 1-3, ý nghĩa phụ thuộc skill.
- `user_progress.recent_scores`: lưu attempts gần đây phục vụ progression.
- Late results (`is_late=true`) và FAILED attempts không được đưa vào recent_scores.

## 7. Edge Cases

- Nếu < 3 attempts hợp lệ: không đổi stage, chỉ áp dụng initial stage.
- Nếu user đổi goal/level: không reset stage ngay; stage vẫn dựa trên performance.
- Nếu có dấu hiệu inconsistent (điểm dao động mạnh): không level up, giữ stage và ưu tiên micro-hints.

## 8. Acceptance Criteria

- Initial stage đúng theo level mapping.
- Stage progression đúng ngưỡng theo rule (writing: 80/75/70, down: 60/65, listening: 80/50).
- Level down yêu cầu 2 attempts liên tiếp dưới ngưỡng.
- Hint usage có thể chặn level up.
- Stage update chỉ dựa trên attempts hợp lệ (COMPLETED, không late).

## 9. Cross-references

- Practice scaffolding diagrams → `docs/capstone/diagrams/flow-diagrams.vi.md` Section 7
- Progress entity storage → `../30-data/database-schema.md` (`user_progress`)
- Attempts validity rules → `submission-lifecycle.md`
