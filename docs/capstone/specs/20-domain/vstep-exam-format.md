# VSTEP Exam Format (Domain Mapping)

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt cách hệ thống **biểu diễn format đề VSTEP** (VSTEP.3-5: B1–C1) để:

- Mock test đúng cấu trúc bài thi
- Practice mode có thể tách nhỏ theo part/passage/task
- Database/API có schema ổn định (agents không phải đoán)

Tài liệu này **không** viết lại hướng dẫn/chiến lược làm bài; nó chỉ map format → domain model.

## Reference docs (non-normative)

Các tài liệu trong `docs/` dùng để tham khảo format đề/định nghĩa rubric. Đây không phải “chuẩn dữ liệu” bắt buộc cho thiết kế schema.

- Tổng quan cấu trúc: `../../../00-overview/exam-structure.md`
- Tổng quan format: `../../../01-format/overview.md`
- Listening: `../../../04-listening/format.md`
- Reading: `../../../03-reading/format.md`
- Writing prompt banks: `../../../02-writing/task1/prompts.md`, `../../../02-writing/task2/prompts.md`
- Speaking: `../../../05-speaking/format.md`
- Scoring overview: `../../../00-overview/scoring-system.md`
- Rubrics: `../../../06-scoring/writing-rubric.md`, `../../../06-scoring/speaking-rubric.md`

## Domain decisions

### 1) Skills (canonical)

- `listening` (35 MCQ, 40 minutes)
- `reading` (40 MCQ, 60 minutes)
- `writing` (2 tasks, 60 minutes)
- `speaking` (3 parts, ~12 minutes)

### 2) Levels

- VSTEP.3-5 target levels: `B1`, `B2`, `C1`
- Hệ thống có thể lưu `level` rộng hơn (`A1`..`C1`) để phục vụ adaptive (nhưng mock test VSTEP.3-5 mặc định dùng B1–C1).

### 3) Granularity: “question” in MainDB

Trong MainDB, `questions` nên represent **một unit có thể deliver và score độc lập**:

- Listening: 1 question = 1 part (Part 1/2/3) hoặc 1 audio set có nhiều MCQ
- Reading: 1 question = 1 passage (10 MCQ)
- Writing: 1 question = 1 task (Task 1 hoặc Task 2)
- Speaking: 1 question = 1 part (Part 1/2/3)

Mock test sẽ compose thành full exam bằng cách ghép các units này theo blueprint.

## Canonical blueprint (mock test)

### Listening

- Part 1: Q1–8 (8 MCQ)
- Part 2: Q9–20 (12 MCQ)
- Part 3: Q21–35 (15 MCQ)
- Audio play: one-time (practice có thể theo part/audio set)

### Reading

- Passage 1..4, mỗi passage 10 MCQ

### Writing

- Task 1: Letter/Email, >=120 words, ~20 minutes, weight 1/3
- Task 2: Essay, >=250 words, ~40 minutes, weight 2/3

### Speaking

- Part 1: Social Interaction, 2–3 minutes
- Part 2: Solution Discussion (3 options), 1 minute prep + 2–3 minutes speaking
- Part 3: Topic Development, 1 minute prep + 3–4 minutes speaking + follow-up

## Scoring mapping

Canonical scoring rules (tham khảo): `../../../00-overview/scoring-system.md`

- Listening: `score = (correct / 35) * 10` (round to nearest 0.5)
- Reading: `score = (correct / 40) * 10` (round to nearest 0.5)
- Writing: `writing = task1*(1/3) + task2*(2/3)` (round to nearest 0.5)
- Speaking: average 5 criteria (round to nearest 0.5)
- Overall (exam-style): average 4 skills (round to nearest 0.5)

Lưu ý: progress dashboard trong hệ thống có thể dùng logic riêng (vd. weakest-skill), nhưng **mock test result** nên compute đủ cả `overallScore`.

## Data model references

- Question content schemas: `../30-data/question-content-schemas.md`
- MainDB entities: `../30-data/database-schema.md`
