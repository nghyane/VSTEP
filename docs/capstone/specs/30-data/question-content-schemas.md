# Question & Submission Content Shapes

> **Phiên bản**: 1.1 · SP26SE145

## Purpose

Chốt shape tối thiểu cho các trường JSONB chính:

- `questions.content` (delivery)
- `questions.answer_key` (auto-grade)
- `submissions.answer` (user input)
- `submissions.result` (grading output)

Mục tiêu: đủ rõ để backend implement MVP thống nhất; tài liệu trong `docs/` chỉ để tham khảo format/rubric (không phải chuẩn dữ liệu cho data design).

## References

- Exam format mapping: `../20-domain/vstep-exam-format.md`
- Scoring: `../../../00-overview/scoring-system.md`

## Conventions

- Không versioning trong JSON payload (capstone update đồng bộ).
- Các keys trong JSONB ưu tiên camelCase.

## questions (minimum columns)

`questions` nên có các fields để index/search:

- `skill`: `listening|reading|writing|speaking`
- `level`: `A1|A2|B1|B2|C1`
- `format`: enum theo skill (bên dưới)
- `content` (JSONB): payload delivery
- `answer_key` (JSONB, nullable): chỉ áp dụng cho listening/reading

## 1) Writing

### 1.1 question.format

- `writing_task_1`
- `writing_task_2`

### 1.2 questions.content (writing)

Fields tối thiểu:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `taskNumber` | int | Yes | `1` hoặc `2` |
| `prompt` | string | Yes | đề bài |
| `instructions` | string | No | nếu muốn hiển thị hướng dẫn riêng |
| `minWords` | int | No | default theo task (1:120, 2:250) |
| `imageUrls` | string[] | No | nếu có hình |

### 1.3 submissions.answer (writing)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `text` | string | Yes | bài viết |

## 2) Speaking

### 2.1 question.format

- `speaking_part_1`
- `speaking_part_2`
- `speaking_part_3`

### 2.2 questions.content (speaking)

Fields tối thiểu:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `partNumber` | int | Yes | `1`/`2`/`3` |
| `prompt` | string | Yes | nội dung chính (topic/câu hỏi) |
| `instructions` | string | No | |
| `options` | string[] | No | Part 2: 3 lựa chọn |
| `mindMapNodes` | string[] | No | Part 3 (optional) |
| `followUpQuestions` | string[] | No | Part 3 (optional) |
| `preparationSeconds` | int | No | default 60 |
| `speakingSeconds` | int | No | default theo part |
| `sampleAudioUrl` | string | No | |

### 2.3 submissions.answer (speaking)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `audioUrl` | string | Yes | URL tải audio |
| `durationSeconds` | int | Yes | |
| `transcript` | string | No | nếu có STT |

## 3) Reading

### 3.1 question.format

- `reading_passage`

### 3.2 questions.content (reading)

Fields tối thiểu:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `passage` | string | Yes | |
| `title` | string | No | |
| `items` | array | Yes | list 10 items |

Shape của mỗi item:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `number` | int | Yes | 1..10 |
| `prompt` | string | Yes | |
| `options` | object | Yes | keys A/B/C/D |

### 3.3 questions.answer_key (reading)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `correctAnswers` | object | Yes | map `number -> A/B/C/D` |

### 3.4 submissions.answer (reading)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `answers` | object | Yes | map `number -> A/B/C/D` |

## 4) Listening

### 4.1 question.format

- `listening_part`

### 4.2 questions.content (listening)

Fields tối thiểu:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `partNumber` | int | Yes | 1/2/3 |
| `audioUrl` | string | Yes | |
| `transcript` | string | No | |
| `items` | array | Yes | list items (count theo part) |

Shape của mỗi item giống Reading: `number`, `prompt`, `options`.

### 4.3 questions.answer_key (listening)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `correctAnswers` | object | Yes | map `number -> A/B/C/D` |

### 4.4 submissions.answer (listening)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `answers` | object | Yes | map `number -> A/B/C/D` |

## 5) submissions.result (common)

### 5.1 Auto-graded (listening/reading)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `correctCount` | int | Yes | |
| `total` | int | Yes | 35 (listening) / 40 (reading) |
| `score` | number | Yes | 0..10 (round 0.5) |
| `band` | enum | No | optional; có thể derive từ score |

### 5.2 AI-graded (writing/speaking)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `overallScore` | number | Yes | 0..10 (round 0.5) |
| `band` | enum | Yes | A1/A2/B1/B2/C1 |
| `criteriaScores` | object | No | per-rubric; shape tùy skill |
| `feedback` | string | No | |
| `confidenceScore` | int | Yes | 0..100 |
| `reviewRequired` | boolean | Yes | `confidenceScore < 85` |
